package generator.model.shapecontainer.shape.geometrics

import generator.model.shapecontainer.shape.{ Compartment }
import generator.model.shapecontainer.shape.geometrics.layouts.{ CommonLayoutParser, CommonLayout }
import generator.model.style.Style
import generator.parser.{ Cache, GeoModel }

/**
 * Created by julian on 20.10.15.
 * representation of an Ellipse (which has the same attributes as a rectangle,
 * thats why it just extends model.shape.geometrics.Rectangle)
 * Vorsicht Ellipse erbt zwar von Rectangle, aber eine Ellipse als ein Rectangle zu benutzen ist nicht der eigentliche Sinn
 * rein pragmatisch, da Ellipse und Rectangle die selben Attribute haben
 */
sealed class Ellipse private (
  parent: Option[GeometricModel] = None,
  commonLayout: CommonLayout,
  compartment: Option[Compartment],
  wrapping: List[GeoModel]
) extends Rectangle(parent, commonLayout, compartment, wrapping)

object Ellipse {
  /**
   * parses a GeoModel into an actual GeometricModel, in this case a Rectangle
   * @param geoModel is the sketch to parse into a GeometricModel
   * @param parent is the parent instance that wraps the new GeometricModel
   */
  def apply(geoModel: GeoModel, parent: Option[GeometricModel], parentStyle: Option[Style], hierarchyContainer: Cache) = parse(geoModel, parent, parentStyle, hierarchyContainer)
  def parse(geoModel: GeoModel, parent: Option[GeometricModel], parentStyle: Option[Style], hierarchyContainer: Cache): Option[Ellipse] = {
    /*mapping*/
    val commonLayout: Option[CommonLayout] = CommonLayoutParser.parse(geoModel, parentStyle, hierarchyContainer)
    val compartment: Option[Compartment] = Compartment.parse(geoModel.attributes)

    if (commonLayout.isEmpty)
      return None

    Some(new Ellipse(parent, commonLayout.get, compartment, geoModel.children))
  }
}
