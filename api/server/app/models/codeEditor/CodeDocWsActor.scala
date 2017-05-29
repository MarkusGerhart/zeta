package models.codeEditor

import akka.actor.{ Actor, ActorLogging, ActorRef, Props }
import akka.cluster.client.ClusterClient.Publish
import akka.cluster.pubsub.DistributedPubSub
import akka.cluster.pubsub.DistributedPubSubMediator.Subscribe
import akka.event.Logging
import scalot.Server
import shared.CodeEditorMessage
import shared.CodeEditorMessage._
import upickle.default._

case class MediatorMessage(msg: Any, broadcaster: ActorRef)

/**
 * This Actor takes care of applying the changed to the documents.
 */
class CodeDocManagingActor extends Actor {

  var documents: Map[String, DbCodeDocument] = CodeDocumentDb.getAllDocuments.map(x => (x.docId, x)).toMap

  val mediator = DistributedPubSub(context.system).mediator
  val log = Logging(context.system, this)

  def receive = {
    case x: CodeEditorMessage =>
      x match {
        case TextOperation(op, docId) =>
          documents(docId).doc.receiveOperation(op) match {
            case Some(send) => {
              mediator ! Publish(
                documents(docId).dslType,
                MediatorMessage(TextOperation(send, docId), self)
              )
              sender() ! MediatorMessage(TextOperation(send, docId), self)
            }
            case _ => // Nothing to do!
          }
          CodeDocumentDb.saveDocument(documents(docId))

        case newDoc: DocAdded =>
          documents = documents + (newDoc.id -> new DbCodeDocument(
            docId = newDoc.id,
            dslType = newDoc.dslType,
            metaModelUuid = newDoc.metaModelUuid,
            doc = new Server(
            str = "",
            title = newDoc.title,
            docType = newDoc.docType,
            id = newDoc.id
          )
          ))
          CodeDocumentDb.saveDocument(documents(newDoc.id))
          mediator ! Publish(newDoc.dslType, MediatorMessage(newDoc, sender()))
          sender() ! MediatorMessage(newDoc, sender())

        case msg: DocDeleted =>
          documents = documents - msg.id
          CodeDocumentDb.deleteDocWithId(msg.id)
          mediator ! Publish(msg.dslType, MediatorMessage(msg, sender()))
          sender() ! MediatorMessage(msg, sender())

        case _ => ;
      }
  }
}

object CodeDocManagingActor {
  def props() = Props(new CodeDocManagingActor())
}

/**
 * This Actor is responsible of the communictaion with the users browser
 */
class CodeDocWsActor(out: ActorRef, docManager: ActorRef, metaModelUuid: String, dslType: String) extends Actor with ActorLogging {

  val mediator = DistributedPubSub(context.system).mediator
  mediator ! Subscribe(dslType, self)

  /** Tell the client about the existing document */
  CodeDocumentDb.getDocWithUuidAndDslType(metaModelUuid, dslType) match {
    case doc: Some[DbCodeDocument] => out ! write[CodeEditorMessage](
      DocLoaded(
        str = doc.get.doc.str,
        revision = doc.get.doc.operations.length,
        docType = doc.get.doc.docType,
        title = doc.get.doc.title,
        id = doc.get.docId,
        dslType = doc.get.dslType,
        metaModelUuid = doc.get.metaModelUuid
      )
    )
    case None => out ! write[CodeEditorMessage](
      DocNotFound(
        dslType = dslType,
        metaModelUuid = metaModelUuid
      )
    )
  }

  def receive = {
    case pickled: String => try {
      read[CodeEditorMessage](pickled) match {

        case msg: TextOperation =>
          docManager ! msg

        case msg: DocAdded =>
          log.debug("WS: Got DocAdded")
          docManager ! msg

        case msg: DocDeleted =>
          log.debug("WS: Got DocDeleted")
          docManager ! msg

        case _ => log.error("Discarding message, probably sent by myself")
      }
    }

    case medMsg: MediatorMessage =>
      if (medMsg.broadcaster != self) {
        medMsg.msg match {
          case x: CodeEditorMessage => out ! write[CodeEditorMessage](x)
          case _ => log.error("Unknown message type from Meidator")
        }
      }

    case _ => log.debug(s" ${self.toString()} - Message is not a String!")
  }
}

object CodeDocWsActor {
  def props(out: ActorRef, docManager: ActorRef, metaModelUuid: String, dslType: String) = Props(new CodeDocWsActor(out, docManager, metaModelUuid, dslType))
}
