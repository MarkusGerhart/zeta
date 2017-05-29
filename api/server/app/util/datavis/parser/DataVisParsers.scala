package util.datavis.parser

import util.datavis.domain._
import language.postfixOps

import scala.util.parsing.combinator.JavaTokenParsers

trait DataVisParsers extends JavaTokenParsers {
  def script = conditional *

  def conditional = "if" ~ condition ~ ":" ~ assignment ^^ { case _ ~ cond ~ _ ~ assign => new Conditional(cond, assign) }

  def condition = operand ~ comparator ~ operand ^^ { case opA ~ comp ~ opB => new Condition(opA, opB, comp) }
  def assignment = identifier ~ "=" ~ literal ^^ { case target ~ _ ~ value => new Assignment(target, value) }

  def comparator: Parser[Comparator] = ("==" | "!=" | ">=" | "<=" | ">" | "<") ^^ {
    case "==" => new Equal
    case "!=" => new NotEqual
    case ">=" => new GreaterOrEqual
    case "<=" => new LessOrEqual
    case ">" => new Greater
    case "<" => new Less
  }

  def operand = literal | identifier

  def identifier = styleIdentifier | mIdentifier //Order is important!

  def styleIdentifier = "style" ~ selector ~ dotProperties ^^ { case _ ~ selector ~ properties => new StyleIdentifier(selector, buildIdentifier("", properties)) }
  def mIdentifier = ident ~ dotProperties ^^ { case first ~ properties => new MIdentifier(buildIdentifier(first, properties)) }

  def dotProperties = dotProperty.*
  def dotProperty = "." ~ property ^^ { case dot ~ prop => dot + prop }
  def property = "[_A-Za-z$][\\- _A-Za-z0-9$]*".r ^^ { case s => s }

  def selector = "\\[.*?\\]".r ^^ { case selector => selector.toString.replace("['", "").replace("']", "") }

  def literal: Parser[Literal] = number | string | boolean
  def number = floatingPointNumber ^^ { s => new NumericLiteral(s.toDouble) }
  def string = stringLiteral ^^ { s => new StringLiteral(s) }
  def boolean = ("true" | "false") ^^ { s => new BooleanLiteral(s.toBoolean) }

  private def buildIdentifier(first: String, list: List[String]) = {
    val identifier = list.foldLeft(first) { (id, next) => id + next }
    identifier
  }
}
