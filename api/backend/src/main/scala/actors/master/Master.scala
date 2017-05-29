package actors.master

import actors.worker.MasterWorkerProtocol
import actors.worker.MasterWorkerProtocol.CancelWork
import akka.actor.{ ActorLogging, ActorRef, Props }
import akka.cluster.Cluster
import akka.cluster.client.ClusterClientReceptionist
import akka.cluster.pubsub.{ DistributedPubSub, DistributedPubSubMediator }
import akka.persistence.PersistentActor
import models.session.Session

import scala.concurrent.duration._
import scala.concurrent.duration.{ Deadline, FiniteDuration }

object Master {
  def props(workerTimeout: FiniteDuration, sessionDuration: FiniteDuration, sessionManager: Session): Props =
    Props(classOf[Master], workerTimeout, sessionDuration, sessionManager)

  private sealed trait WorkerStatus
  private case object Idle extends WorkerStatus
  private case class Busy(workId: String, deadline: Deadline) extends WorkerStatus
  private case class WorkerState(ref: ActorRef, status: WorkerStatus, deadline: Deadline)

  private case object WorkerTimeoutTick
  private case object CompletedWorkTick
}

class Master(workerTimeout: FiniteDuration, sessionDuration: FiniteDuration, sessionManager: Session) extends PersistentActor with ActorLogging {
  import DistributedPubSubMediator.Subscribe
  import Master._
  import WorkState._

  val numberOfWorkersToNotify = 4
  val mediator = DistributedPubSub(context.system).mediator
  mediator ! Subscribe("Master", self)

  //val mediator = DistributedPubSub(context.system).mediator
  ClusterClientReceptionist(context.system).registerService(self)

  // persistenceId must include cluster role to support multiple masters
  override def persistenceId: String = Cluster(context.system).selfRoles.find(_.startsWith("backend-")) match {
    case Some(role) => role + "-master"
    case None => "master"
  }

  // workers state is not event sourced
  private var workers = Map[String, WorkerState]()

  // workState is event sourced
  private var workState = WorkState.empty()

  import context.dispatcher
  val workerTimeoutTask = context.system.scheduler.schedule(workerTimeout / 2, workerTimeout / 2, self, WorkerTimeoutTick)
  val completedWorkTask = context.system.scheduler.schedule(10.seconds, 10.seconds, self, CompletedWorkTick)

  override def postStop() = {
    workerTimeoutTask.cancel()
    completedWorkTask.cancel()
  }

  override def receiveRecover: Receive = {
    case event: WorkDomainEvent => workState = workState.updated(event)
  }

  def workerDeathTimeout = Deadline.now + workerTimeout

  override def receiveCommand: Receive = {
    /**
     * Worker send a registration message
     */
    case MasterWorkerProtocol.RegisterWorker(workerId) =>
      if (workers.contains(workerId)) {
        workers += (workerId -> workers(workerId).copy(ref = sender(), deadline = workerDeathTimeout))
      } else {
        workers += (workerId -> WorkerState(sender(), Idle, workerDeathTimeout))
        if (workState.hasWork)
          sender() ! MasterWorkerProtocol.WorkIsReady
      }

    /**
     * Worker is asking for work
     */
    case MasterWorkerProtocol.WorkerRequestsWork(workerId) =>
      if (workState.hasWork) {
        workers.get(workerId) match {
          case Some(worker @ WorkerState(_, Idle, _)) =>
            val workerRef = sender()
            val work = workState.nextWork
            persist(WorkStarted(work.id)) { event =>
              workState = workState.updated(event)
              workers += (workerId -> worker.copy(status = Busy(work.id, Deadline.now + workerTimeout)))
              sessionManager.getSession(work.owner, sessionDuration.toSeconds).map { session =>
                workerRef ! work.copy(session = session)
              }.recover {
                case e: Exception =>
                  log.error(s"Master failed on loading a session for ${work.owner}")
                  self ! work
              }
            }
          case _ =>
        }
      }

    /**
     * Worker successful executed work
     */
    case MasterWorkerProtocol.WorkIsDone(workerId, workId, result) =>
      // send a ack to the worker to tell the worker that the message was received
      sender() ! MasterWorkerProtocol.Ack(workId)
      // set the worker back to idle state
      changeWorkerToIdle(workerId)
      // if the work is not persisted as "done", we need to persist this state
      if (!workState.isDone(workId)) {
        persist(WorkCompleted(workId, result)) { event =>
          workState = workState.updated(event)
          workState.completedWorkById(workId) match {
            case Some(completed) =>
              log.info("Sending work {} as completed to the work creator {}", workerId, completed.work.owner)
              mediator ! DistributedPubSubMediator.Publish(completed.work.owner, MasterWorkerProtocol.MasterCompletedWork(workId, result))
            case None =>
              // should not happen
              log.error("Completed work {} was not available as expected", workId)
          }
        }
      }

    /**
     * Worker executed work and work failed.
     */
    case MasterWorkerProtocol.WorkFailed(workerId, workId) =>
      // send a ack to the worker to tell the worker that the message was received
      sender() ! MasterWorkerProtocol.Ack(workId)
      // set the worker back to idle state
      changeWorkerToIdle(workerId)

      if (workState.isInProgress(workId)) {
        log.info("Work {} failed by worker {}", workId, workerId)
        changeWorkerToIdle(workerId)
        persist(WorkerFailed(workId)) { event =>
          workState = workState.updated(event)
          notifyWorkers()
        }
      }

    /*
     * Developer sends ack that he received the result of the completed work
     */
    case MasterWorkerProtocol.DeveloperReceivedCompletedWork(workId) =>
      log.info("Master received ack that work completion was received {}", workId)
      persist(WorkCompletionReceived(workId)) { event =>
        workState = workState.updated(event)
      }

    /**
     * New work was send by a developer.
     */
    case work: MasterWorkerProtocol.Work =>
      if (workState.isAccepted(work.id)) {
        sender() ! MasterWorkerProtocol.MasterAcceptedWork(work.id)
      } else {
        persist(WorkAccepted(work)) { event =>
          sender() ! MasterWorkerProtocol.MasterAcceptedWork(work.id)
          workState = workState.updated(event)
          notifyWorkers()
        }
      }

    /**
     * Work should be canceled.
     */
    case cancelWork: CancelWork =>
      log.info("Cancel work: {}", cancelWork.id)
      val reply = sender()

      // check if a worker is working on the workId
      val worker = workers.find {
        case (workerId, state) => state.status match {
          case Idle => false
          case Busy(workId, deadline) => workId == cancelWork.id
        }
      }
      // if a worker is working send the worker a cancel. otherwise the work is already done
      worker match {
        case Some(x) => x._2.ref ! cancelWork
        case None => reply ! MasterWorkerProtocol.MasterCompletedWork(cancelWork.id, 3)
      }

    case WorkerTimeoutTick =>
      /**
       * A busy worker actor reached the timeout
       */
      for ((workerId, s @ WorkerState(_, Busy(workId, timeout), _)) ← workers) {
        if (timeout.isOverdue) {
          log.info("Work timed out: {}", workId)
          workers -= workerId
          persist(WorkerTimedOut(workId)) { event =>
            workState = workState.updated(event)
            notifyWorkers()
          }
        }
      }
      /**
       * A idle worker actor reached the timeout
       */
      for ((workerId, s @ WorkerState(_, Idle, timeout)) ← workers) {
        if (timeout.isOverdue) {
          log.info("Worker timed out and removed from the system: {}", workerId)
          workers -= workerId
        }
      }

    /**
     * Check for completed work from which no ack was received by the developer (which started the work).
     */
    case CompletedWorkTick =>
      workState.completedWorkList foreach { completed =>
        log.info(s"Re-send work completed : '${completed.work.job}' to ${completed.work.owner}")
        mediator ! DistributedPubSubMediator.Publish(completed.work.owner, MasterWorkerProtocol.MasterCompletedWork(completed.work.id, completed.result))
      }
  }

  /**
   * Get idle workers
   *
   * @return A map with (workerId -> WorkerState) of IDLE workers
   */
  private def idleWorkers() = {
    workers.filter {
      case (workerId, workerState) => workerState.status match {
        case Idle => true
        case Busy(workId, deadline) => false
      }
    }
  }

  /**
   * Send a few idle workers that work is available
   */
  private def notifyWorkers(): Unit = {
    if (workState.hasWork) {
      idleWorkers
        .take(numberOfWorkersToNotify)
        .foreach {
          case (_, WorkerState(ref, Idle, _)) => ref ! MasterWorkerProtocol.WorkIsReady
        }
    }
  }

  private def changeWorkerToIdle(workerId: String): Unit = {
    workers.get(workerId) match {
      case Some(worker @ WorkerState(_, Busy(_, _), _)) =>
        workers += (workerId -> worker.copy(status = Idle))
      case _ =>
      // ok, might happen after standby recovery, worker state is not persisted
    }
  }
}
