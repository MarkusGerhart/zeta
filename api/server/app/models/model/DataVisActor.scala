package models.model

import java.io.File

import akka.actor.{ Actor, ActorRef, Props }
import models.model.DataVisActor.{ MetamodelFailure, MetamodelLoaded }
import models.model.ModelWsActor.DataVisInvalidError
import play.api.Logger
import play.api.libs.json.{ JsObject, Json }
import shared.DiagramWSMessage.{ DataVisCodeMessage, DataVisScopeQuery }
import util.MetamodelBuilder
import util.datavis.domain.Conditional
import util.datavis.generator.ListenersGenerator
import util.datavis.parser.DataVisParsers
import util.datavis.validator.ConstrainedDataVisValidator
import util.domain.{ Metamodel, ObjectWithAttributes }

class DataVisActor(socket: ActorRef, instanceId: String, graphType: String) extends Actor with DataVisParsers {
  val log = Logger(this getClass () getName ())
  var metamodel: Metamodel = null
  val generator = new ListenersGenerator

  // TODO: Connect model instance to new REST API
  /* MetaModelDatabase_2.loadModel(graphType) onComplete{
    case scala.util.Success(opt) => opt match {
      case None => self ! MetamodelFailure()
      case Some(mm) => //self ! MetamodelLoaded(mm.model)
    }
    case scala.util.Failure(t) => self ! MetamodelFailure
  } */

  override def receive = {
    case msg: DataVisCodeMessage => handleDataVisCode(msg)
    case DataVisScopeQuery(mClass) => handleScopeQuery(mClass)
    case MetamodelLoaded(code) => metamodel = MetamodelBuilder().fromJson(Json.parse(code).asInstanceOf[JsObject])
    case MetamodelFailure() => log.error("Unable to lead metamodel")
    case _ => log.error("Unknown message received")
  }

  private def handleDataVisCode(msg: DataVisCodeMessage) = {
    log.debug("DataVis Code for object " + msg.context + ": " + msg.code)

    metamodel.getObjectByName(msg.classname) match {
      case None => socket ! ModelWsActor.DataVisInvalidError(List("Unable to load class " + msg.classname + " from metamodel."), msg.context)
      case Some(mObject) => parseAll(script, msg.code) match {
        case NoSuccess(error, _) => socket ! ModelWsActor.DataVisParseError("Could not parse code: " + error, msg.context)
        case Success(conditionals, _) => validateAndGenerateDataVisCode(mObject, conditionals, msg)
      }
    }
  }

  private def handleScopeQuery(classname: String) = {
    /*
    log.debug("Scope query for MObj" + classname)
    metamodel.getObjectByName(classname) match {
      case None => socket ! DiagramWSActor.DataVisInvalidError(List("Unable to load class " + classname + " from metamodel."), "")
      case Some(mObject) => mObject match {
       // case mClass:MClass => socket ! DataVisScope(mClass.allAttributes.map(_.name), classname)
        //case mReference:MReference => socket ! DataVisScope(mReference.attributes.map(_.name), classname)
      }
    }
    */
  }

  private def validateAndGenerateDataVisCode(mObject: ObjectWithAttributes, conditionals: List[Conditional], msg: DataVisCodeMessage) = {
    val validator = new ConstrainedDataVisValidator
    if (validator.validate(conditionals, mObject))
      generateAndPublish(msg, conditionals)
    else
      socket ! DataVisInvalidError(validator.errors.toList, msg.context)
  }

  private def generateAndPublish(msg: DataVisCodeMessage, conditionals: List[Conditional]) = {
    val fileName = generator.generate(instanceId, msg.context, conditionals)
    socket ! ModelWsActor.PublishFile(msg.context, ("/assets/" + fileName).replace(File.separator, "/"))
  }
}

object DataVisActor {
  def props(socket: ActorRef, instanceId: String, graphType: String) = Props(new DataVisActor(socket, instanceId, graphType))
  case class MetamodelLoaded(json: String)
  case class MetamodelFailure()
}