package models.modelDefinitions.model

import models.modelDefinitions.metaModel.MetaModel
import models.modelDefinitions.model.elements._
import models.modelDefinitions.model.elements.ModelWrites._
import play.api.libs.functional.syntax._
import play.api.libs.json._

import scala.collection.immutable.{ Map, _ }

/**
 * Immutable container for model definitions
 *
 * @param name the name of the model
 * @param metaModel the corresponding metamodel instance
 * @param elements the object graph containing the actual model data
 * @param uiState the uistate of the browser client. Location is debatable
 */
case class Model(
  name: String,
  metaModel: MetaModel,
  elements: Map[String, ModelElement],
  uiState: String
)

object Model {

  def readAndMergeWithMetaModel(json: JsValue, meta: MetaModel): JsResult[Model] = {
    val mapReads = ModelReads.elementMapReads(meta)
    val name = (json \ "name").as[String]
    val elements = (json \ "elements").as[Map[String, ModelElement]](mapReads)
    val uiState = (json \ "uiState").as[String]
    val model = Model(name, meta, elements, uiState)

    JsSuccess(model)
  }

  /*
  def reads(implicit meta: MetaModel): Reads[Model] = {
    val mapReads = ModelReads.elementMapReads(meta)
    ((__ \ "name").read[String] and
      Reads.pure(meta) and
      (__ \ "elements").read[Map[String, ModelElement]](mapReads) and
      (__ \ "uiState").read[String])(Model.apply _)
  }
  */

  implicit val reads = new Reads[Model] {
    def reads(json: JsValue): JsResult[Model] = {
      /*
      val meta = (__ \ "meta").read[MetaModel].asInstanceOf[MetaModel]
      val mapReads = ModelReads.elementMapReads(meta)

      ((__ \ "name").read[String] and
        Reads.pure(meta) and
        (__ \ "elements").read[Map[String, ModelElement]](mapReads) and
        (__ \ "uiState").read[String]
        ) (Model.apply _)
      */
      //val meta = (__ \ "meta").read[MetaModel].asInstanceOf[MetaModel]
      //val mapReads = ModelReads.elementMapReads(meta)
      //val name = (__ \ "name").read[String].asInstanceOf[String]
      //val elements = (__ \ "elements").read[Map[String, ModelElement]](mapReads)

      val name = (json \ "name").as[String]
      val uiState = (json \ "uiState").as[String]

      //val meta = (json \ "meta").as[MetaModel]
      //val mapReads = ModelReads.elementMapReads(meta)
      //val elements = (json \ "elements").as[Map[String, ModelElement]] //(mapReads)

      val model = Model(name, null, Map[String, ModelElement](), uiState)
      JsSuccess(model)
    }
  }

  implicit val writes = new Writes[Model] {
    def writes(d: Model): JsValue = Json.obj(
      "name" -> d.name,
      "elements" -> d.elements.values,
      "uiState" -> d.uiState
    )
  }

}
