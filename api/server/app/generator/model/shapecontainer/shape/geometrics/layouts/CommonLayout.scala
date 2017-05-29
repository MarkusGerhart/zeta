package generator.model.shapecontainer.shape.geometrics.layouts

import generator.model.style.Style
import generator.parser.{ Cache, GeoModel, CommonParserMethods }
import parser._

/**
 * Created by julian on 15.10.15.
 * the commonLayout (from the Grammarsheet)
 */
trait CommonLayout extends Layout {
  val position: Option[(Int, Int)] // (x,y) Tuple
  val size_width: Int
  val size_height: Int

  /*unsafe getter!*/
  def x = position.getOrElse(0, 0)._1
  def y = position.getOrElse(0, 0)._2
}

object CommonLayoutParser extends CommonParserMethods {
  def parse(geoModel: GeoModel, parentStyle: Option[Style], cache: Cache): Option[CommonLayout] = {
    implicit val hierarchyContainer = cache
    val attributes = geoModel.attributes

    /*mapping*/
    var pos: Option[(Int, Int)] = None
    var size_w: Option[Int] = None
    var size_h: Option[Int] = None
    var styl: Option[Style] = Style.generateChildStyle(cache, parentStyle, geoModel.style) //if geoModel.style and parentstyle are defined a childStyle is created

    attributes.foreach {
      case x if x.matches("position.+") => pos = {
        val newPositoin = parse(position, x).get
        if (newPositoin isDefined)
          newPositoin
        else
          None
      }
      case x if x.matches("size.+") =>
        val newSize = parse(size, x).get
        if (newSize.isDefined) {
          size_w = Some(newSize.get._1)
          size_h = Some(newSize.get._2)
        }
      case anonymousStyle: String if cache.styleHierarchy.contains(anonymousStyle) =>
        styl = Style.generateChildStyle(cache, styl, Some(anonymousStyle)) //generate anonymous style
      case _ =>
    }

    var ret: Option[CommonLayout] = None
    if (size_w.isDefined && size_h.isDefined)
      ret = Some(new CommonLayout {
        override val position: Option[(Int, Int)] = pos
        override val size_width: Int = size_w.get
        override val size_height: Int = size_h.get
        override val style: Option[Style] = styl
      })
    else println("no size was given for Position in: " + geoModel.typ)
    ret
  }
}
