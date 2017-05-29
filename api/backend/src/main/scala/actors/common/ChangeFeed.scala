package actors.common

import akka.actor.{ Actor, ActorLogging, ActorRef, Props }
import com.neovisionaries.ws.client._
import models.document._
import play.api.libs.json.{ JsError, JsSuccess, Json, Reads }

/**
 * Configuration to connect to the Sync Gateway
 *
 * @param url The url of the Sync Gateway
 * @param user The user with which to connect
 * @param password The password of the user
 * @param since The value of the sequence number from which to start the change feed
 */
case class Configuration(url: String = "database:4984/db", user: String = "system", password: String = "superSecretPassword", since: Int = 0)

/**
 * Definition of Channels which can be used to listen on the change feed
 */
trait Channel {
  /**
   * Get the string representation for the channel
   *
   * @return
   */
  val value: String
}
case class AllDocsFromDeveloper(client: String) extends Channel {
  override val value: String = s"ch-dev-${client}"
}
case class Images() extends Channel {
  override val value: String = "ch-images"
}
case class Developers() extends Channel {
  override val value: String = "ch-developers"
}

object ChangeFeed {
  def props(conf: Configuration, channels: List[Channel], listeners: List[ActorRef]) = Props(new ChangeFeed(conf, channels, listeners))
}

/**
 * The change feed can be used to listen for database changes.
 *
 * @param channels The channels for which to listen
 */
class ChangeFeed(conf: Configuration, channels: List[Channel], listeners: List[ActorRef]) extends Actor with ActorLogging {
  // change from the changeFeed.
  case class Changes(seq: Int, id: String, doc: Option[Document], deleted: Option[Boolean])

  object Changes {
    implicit lazy val readChanges: Reads[Changes] = Json.reads[Changes]
  }

  val parent = context.parent

  // connect the change feed
  connect(0)

  /**
   * Connect to the sync gateway and get all docs since the provided index
   *
   * @param since The sequence number of the change feed from which to start loading documents.
   */
  def connect(since: Int): Unit = {
    // sequence number of the change feed
    var seq = since

    def parseMessage(message: String) = {
      Json.parse(message).validate[List[Changes]] match {
        case s: JsSuccess[List[Changes]] => {
          val list: List[Changes] = s.get
          list.foreach { element =>
            element.doc match {
              case Some(doc: Document) => sendDoc(doc, element.deleted.getOrElse(false))
              case None => log.debug("No document received from change feed. Is a expected behaviour.")
            }
            // store the sequence number
            seq = element.seq
          }
        }
        case e: JsError => {
          log.error("Errors: " + JsError.toJson(e).toString() + ". Raw :  " + message)
        }
      }
    }

    def sendDoc(doc: Document, deleted: Boolean) = {
      if (deleted) {
        log.info(s"Deleted ${doc.id}")
        listeners.foreach { listener =>
          listener ! Changed(doc, Deleted)
        }
      } else if (doc.isUpdated()) {
        log.info(s"Updated ${doc.id}")
        listeners.foreach { listener =>
          listener ! Changed(doc, Updated)
        }
      } else {
        log.info(s"Created ${doc.id}")
        listeners.foreach { listener =>
          listener ! Changed(doc, Created)
        }
      }
    }

    val ch = channels.map(_.value).mkString(",")
    val uri = s"ws://${conf.url}/_changes?include_docs=true&feed=websocket&filter=sync_gateway/bychannel&channels=${ch}"

    val ws = new WebSocketFactory().createSocket(uri);

    ws.setUserInfo(conf.user, conf.password)

    ws.addListener(new WebSocketAdapter() {
      // A text message arrived from the server.
      override def onTextMessage(ws: WebSocket, message: String) = {
        parseMessage(message)
        ws.sendContinuation()
      }

      override def onDisconnected(websocket: WebSocket, serverCloseFrame: WebSocketFrame, clientCloseFrame: WebSocketFrame, closedByServer: Boolean) = {
        connect(seq)
      }
    })

    try {
      log.info("Connection with seq : {}", since)
      // Connect to the server and perform an opening handshake.
      // This method blocks until the opening handshake is finished.
      ws.connect()
      // send seq since when to get documents
      ws.sendText(s"""{\"since\": ${since}, \"include_docs\": true}""")
    } catch {
      // A violation against the WebSocket protocol was detected
      // during the opening handshake.
      case (e: OpeningHandshakeException) => log.error(e.toString)
      // Failed to establish a WebSocket connection.
      case (e: WebSocketException) => log.error(e.toString)
    }
  }

  def receive = {
    case _ => log.error("ChangeFeed cannot handle any message")
  }
}
