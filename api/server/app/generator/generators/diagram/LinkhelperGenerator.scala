package generator.generators.diagram

import generator.model.diagram.Diagram
import generator.model.diagram.edge.Edge

/**
 * Created by julian on 10.02.16.
 */
object LinkhelperGenerator {
  def generate(diagram: Diagram) = {
    s"""
    $generateHead
    ${generateLinkhelper(diagram)}
    """
  }

  def generateHead =
    """
    /*
    * This is a generated linkhelper file for JointJS
    */
    """

  protected def generateLinkhelper(diagram: Diagram) =
    s"""
    var linkhelper = {
      ${generatePlacingTexts(diagram)}
      $generateHelperMethods
    };
    """

  protected def generatePlacingTexts(diagram: Diagram) = {
    s"""
    placingTexts:{
      ${
      diagram.edges.map(e =>
        s"""
            ${e.name}: {
              ${generateStringProperties(e).mkString(",")}
          }""").mkString(",")
    }
    },
    """
  }

  protected def generateStringProperties(edge: Edge) = {
    val stringProperties = edge.connection.vals
    for ((key, value) <- stringProperties) yield s"""'$key': "${value.getOrElse("").toString}""""
  }

  protected def generateHelperMethods =
    """
    getLabelText: function(edge, textId){
      var text = this.placingTexts[edge][textId];
      if(text === undefined){
        text = "";
      }
      return text;
    }
    """
}
