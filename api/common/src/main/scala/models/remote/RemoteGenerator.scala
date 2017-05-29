package models.remote
import java.util.UUID
import java.util.concurrent.atomic.AtomicInteger

import com.neovisionaries.ws.client._
import models.frontend._
import play.api.libs.json.{ Json, _ }
import rx.lang.scala.{ Observable, Subject }

object RemoteGenerator {
  def apply(session: String, work: String, parent: Option[String] = None, key: Option[String] = None): Remote = new RemoteGenerator(session, work, parent, key)
}

class RemoteGenerator(session: String, work: String, parent: Option[String] = None, key: Option[String] = None) extends Remote {
  val uri = s"ws://api:9000/socket/generator/${work}"
  val ws = new WebSocketFactory().createSocket(uri).addHeader("Cookie", s"SyncGatewaySession=${session};")

  // The sequence number which will be used on emit to the parent generator
  var sequence = new AtomicInteger(0)

  // A Subject is an Observable and an Observer at the same time.
  private val events = Subject[GeneratorResponse]()
  private val connection: Observable[GeneratorResponse] = events

  ws.addListener(new WebSocketAdapter() {
    // A text message arrived from the server.
    override def onTextMessage(ws: WebSocket, message: String) = {
      val json = Json.parse(message)

      json.validate[GeneratorResponse] match {
        case s: JsSuccess[GeneratorResponse] => {
          events.onNext(s.get)
        }
        case JsError(errors) => {
          events.onError(new Exception(s"Unable to parse server response on remote generator call : ${message}"))
        }
      }
    }

    override def onDisconnected(websocket: WebSocket, serverCloseFrame: WebSocketFrame, clientCloseFrame: WebSocketFrame, closedByServer: Boolean) = {
      if (closedByServer) {
        events.onError(new Exception(s"Connection for remote generator call was closed by server : ${serverCloseFrame.toString}"))
      } else {
        events.onError(new Exception(s"Connection for remote generator call was closed by client : ${clientCloseFrame.toString}"))
      }
    }
  })

  private def sendRunGenerator[Input](key: String, generator: String, options: Input)(implicit writes: Writes[Input]) = {
    val message = Json.toJson(options).toString()
    val json = Json.toJson(RunGeneratorFromGenerator(work, key, generator, message))
    ws.sendText(json.toString())
  }

  // Connect to the server and perform an opening handshake.
  // This method blocks until the opening handshake is finished.
  ws.connect()

  def call[Input, Output](generator: String, options: Input)(implicit writes: Writes[Input], reads: Reads[Output]): Observable[Output] = {
    val subscriptionKey = UUID.randomUUID().toString

    def error(message: String) = new Exception(s"Remote generator call of ${generator} with options ${options} fired an error : ${message}")

    // start the generator with the provided options
    sendRunGenerator(subscriptionKey, generator, options)

    Observable[Output](subscriber => {
      val i = new AtomicInteger(0)

      connection.subscribe(response => {
        response match {
          case StartGeneratorError(key, reason) => if (key == subscriptionKey) {
            subscriber.onError(throw new Exception(reason))
          }
          case FromGenerator(index, key, message) => if (key == subscriptionKey) {
            if (index == i.incrementAndGet()) {
              Json.parse(message).validate[Output] match {
                case JsSuccess(value, path) => {
                  if (!subscriber.isUnsubscribed) {
                    subscriber.onNext(value)
                  }
                }
                case JsError(errors) => subscriber.onError(error(s"Unable to parse message '${message}' from generator to expected Output format."))
              }
            } else {
              subscriber.onError(error("Sequence number was not as expected. Lost messages."))
            }
          }
          case GeneratorCompleted(key, result) => if (key == subscriptionKey) {
            if (result == 0) {
              subscriber.onCompleted()
            } else {
              subscriber.onError(error(s"Generator completed with status code ${result}"))
            }
          }
        }
      })
    })
  }

  def emit[Output](value: Output)(implicit writes: Writes[Output]): Unit = parent match {
    case Some(parent) => key match {
      case Some(key) => {
        val message = Json.toJson(value).toString()
        val json = Json.toJson(ToGenerator(sequence.incrementAndGet(), key, parent, message)).toString
        ws.sendText(json)
      }
      case None => throw new Exception("Unable to publish because this generator was not called by another generator. Missing key parameter.")
    }
    case None => throw new Exception("Unable to publish because this generator was not called by another generator. Missing parent parameter.")
  }
}
