package actors.developer

import actors.worker.MasterWorkerProtocol.Work

import scala.collection.Iterable
import scala.collection.immutable.Queue

object WorkState {
  def empty(): WorkState = WorkState(
    pendingWork = Queue.empty,
    workInWait = Map.empty,
    workInProgress = Map.empty,
    workCanceled = Map.empty
  )

  trait Event
  case class WorkEnqueued(work: Work) extends Event
  case class WorkCanceled(work: Work) extends Event
  case class WorkSendToMaster(work: Work) extends Event
  case class WorkAcceptedByMaster(work: Work) extends Event
  case class WorkCompleted(work: Work, result: Int) extends Event
}

case class WorkState(
    val pendingWork: Queue[Work],
    val workInWait: Map[String, Work],
    val workInProgress: Map[String, Work],
    val workCanceled: Map[String, Work]
) {

  import WorkState._

  def hasWork: Boolean = pendingWork.nonEmpty
  def nextWork: Work = pendingWork.head
  def numberOfRunning: Int = workInWait.size + workInProgress.size
  def workAccepted(workId: String) = workInProgress.contains(workId)
  def listWorkInWait = workInWait.toList
  def listCanceledWork = workCanceled.keys.toList
  def getWorkInWait(workId: String): Option[Work] = workInWait.get(workId)
  def getWorkInProgress(workId: String): Option[Work] = workInProgress.get(workId)
  def getCanceledWork(workId: String): Option[Work] = workCanceled.get(workId)
  def getWorkFromAnyState(workId: String): Option[Work] =
    pendingWork.find(work => work.id == workId)
      .orElse(workInWait.values.find(work => work.id == workId))
      .orElse(workInProgress.values.find(work => work.id == workId))
      .orElse(workCanceled.values.find(work => work.id == workId))

  def findChildWork(elements: Iterable[Work], parent: String): Iterable[Work] = {
    // get children of the parent
    val list = elements.filter(work => work.job.parent match {
      case Some(x) => x == parent
      case None => false
    })
    // call the method recursive with all children
    list ++ list.flatMap(child => findChildWork(list, child.id))
  }

  def toMap(iterable: Iterable[Work]): Map[String, Work] = iterable.map(e => (e.id, e)).toMap

  def updated(event: Event): WorkState = event match {
    case WorkEnqueued(work) =>
      copy(
        pendingWork = pendingWork enqueue work
      )

    case WorkSendToMaster(work) =>
      val (next, rest) = pendingWork.dequeue
      require(work.id == next.id, s"WorkStarted expected workId ${work.id} == ${next.id}")
      copy(
        pendingWork = rest,
        workInWait = workInWait + (work.id -> work)
      )

    case WorkAcceptedByMaster(work) =>
      copy(
        workInWait = workInWait - work.id,
        workInProgress = workInProgress + (work.id -> work)
      )

    case WorkCompleted(work, result) =>
      val workId = work.id
      // we need to check if there is (recursive) child work (pending, inWait, InProgress) which need to be canceled
      val cancelPending = findChildWork(pendingWork, workId)
      val cancelInWait = findChildWork(workInWait.values, workId)
      val cancelInProgress = findChildWork(workInProgress.values, workId)

      copy(
        // remove all pending child work
        pendingWork = pendingWork.filterNot(current => cancelPending.exists(pending => pending.id == current.id)),
        // remove all waiting child work
        workInWait = workInWait.filterNot(current => cancelInWait.exists(inWait => inWait.id == current._1)),
        // remove all in progress child work and the completed work
        workInProgress = workInProgress.filterNot(current => cancelInProgress.exists(inProgress => inProgress.id == current._1)) - workId,
        // create a new canceled list with the canceled in wait + cancel in progress + old workCanceled
        // and remove the completed work (it could be in cancel state)
        workCanceled = (toMap(cancelInWait) ++ toMap(cancelInProgress) ++ workCanceled) - workId
      )

    case WorkCanceled(work) =>
      val workId = work.id
      // we need to check if there is (recursive) child work (pending, inWait, InProgress) which need to be canceled
      val cancelPending = findChildWork(pendingWork, workId)
      val cancelInWait = findChildWork(workInWait.values, workId)
      val cancelInProgress = findChildWork(workInProgress.values, workId)

      copy(
        // remove all pending child work
        pendingWork = pendingWork.filterNot(current => cancelPending.exists(pending => pending.id == current.id)),
        // remove all waiting child work
        workInWait = workInWait.filterNot(current => cancelInWait.exists(inWait => inWait.id == current._1)),
        // remove all in progress child work and the completed work
        workInProgress = workInProgress.filterNot(current => cancelInProgress.exists(inProgress => inProgress.id == current._1)) - workId,
        // create a new canceled list with the canceled in wait + cancel in progress + old workCanceled
        workCanceled = (toMap(cancelInWait) ++ toMap(cancelInProgress) ++ workCanceled) + (work.id -> work)
      )
  }
}
