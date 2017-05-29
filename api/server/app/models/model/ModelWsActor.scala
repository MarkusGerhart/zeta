package models.model

import akka.actor.{ Actor, ActorRef, Props }
import akka.cluster.pubsub.DistributedPubSub
import akka.cluster.pubsub.DistributedPubSubMediator.{ Publish, Subscribe, SubscribeAck }
import models.model.ModelWsActor.{ DataVisInvalidError, DataVisParseError }
import play.api.Logger
import shared.DiagramWSMessage
import shared.DiagramWSMessage.{ DataVisCodeMessage, DataVisScopeQuery }
import shared.DiagramWSOutMessage.{ DataVisError, DataVisScope, NewScriptFile }
import upickle.default._

class ModelWsActor(out: ActorRef, instanceId: String, graphType: String) extends Actor {
  val mediator = DistributedPubSub(context.system).mediator
  val log = Logger(this getClass () getName ())
  val dataVisActor = context.actorOf(DataVisActor.props(self, instanceId, graphType))

  mediator ! Subscribe(instanceId, self)

  override def receive = {
    case webSocketMsg: String => try {
      read[DiagramWSMessage](webSocketMsg) match {
        case code: DataVisCodeMessage => dataVisActor ! code
        case scope: DataVisScopeQuery => dataVisActor ! scope
      }
      log.debug(webSocketMsg)
    } catch {
      case e: upickle.Invalid =>
        log.debug("Invalid JSON message")
        e.printStackTrace()
      case e: MatchError => log.error("Unexpected Match Error:" + e.getMessage())
    }

    case ModelWsActor.PublishFile(objectId, path) => mediator ! Publish(instanceId, NewScriptFile(objectId, path))

    case newFile: NewScriptFile => out ! write(newFile)
    case scope: DataVisScope => out ! write(scope)

    case DataVisParseError(error, objectId) =>
      log.debug(error)
      out ! write(DataVisError(List(error), objectId))

    case DataVisInvalidError(errors, objectId) =>
      errors.foreach(err => log.debug(err))
      out ! write(DataVisError(errors, objectId))

    case mediatorAck: SubscribeAck => log.debug("Subscribed to messages for instance with uuid: " + instanceId)
    case _ => log.error("Unknown message received.")
  }
}

object ModelWsActor {
  def props(out: ActorRef, instanceId: String, graphType: String) = Props(new ModelWsActor(out, instanceId, graphType))
  case class PublishFile(context: String, path: String)
  case class DataVisParseError(msg: String, context: String)
  case class DataVisInvalidError(msg: List[String], context: String)
}
