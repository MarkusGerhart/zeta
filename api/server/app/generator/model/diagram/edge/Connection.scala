package generator.model.diagram.edge

import generator.model.style.Style
import generator.parser.{ Cache, ConnectionSketch, PropsAndComps }
import models.modelDefinitions.metaModel.elements.MReference
import parser._

/**
 * Created by julian on 11.12.15.
 * representation of diagram connection
 */
class Connection(corporateStyle: Option[Style], propsAndComps: PropsAndComps, c: Cache, mc: MReference) {
  implicit val cache = c
  val referencedConnection: Option[generator.model.shapecontainer.connection.Connection] = {
    val connectionSketch: ConnectionSketch = propsAndComps.ref
    connectionSketch.toConnection(corporateStyle, cache)
  }
  val propertiesAndCompartments = propsAndComps.propertiesAndCompartments
  val vars = propertiesAndCompartments.getOrElse(List()).filter(i => i._1 == "var").map(_._2).map(i =>
    mc.attributes.filter(_.name == i._1).head -> referencedConnection.get.textMap.get(i._2)).toMap
  val vals = propertiesAndCompartments.getOrElse(List()).filter(i => i._1 == "val").map(_._2).map(i =>
    i._1 -> referencedConnection.get.textMap.get(i._2)).toMap
}
