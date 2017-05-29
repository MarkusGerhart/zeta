package actors.developer.manager

import akka.actor.{ Actor, ActorLogging, ActorRef, Props }
import models.document._
import models.worker.RerunFilterJob
import rx.lang.scala.Notification.{ OnError, OnNext }

object FiltersManager {
  def props(worker: ActorRef, repository: Repository) = Props(new FiltersManager(worker, repository))
}

class FiltersManager(worker: ActorRef, repository: Repository) extends Actor with ActorLogging {
  def rerunFilter = {
    repository.query[Filter](AllFilters()).materialize.subscribe(n => n match {
      case OnError(err) => log.error(err.toString)
      case OnNext(filter) => worker ! RerunFilterJob(filter.id())
    })
  }

  def receive = {
    case Changed(model: ModelEntity, change: Change) => change match {
      case Created => rerunFilter
      case Updated => // filter don't need to be rerun on model update
      case Deleted => rerunFilter
    }
    case _ =>
  }
}