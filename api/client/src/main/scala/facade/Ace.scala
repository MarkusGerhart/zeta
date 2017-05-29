package facade

import org.scalajs.dom.raw._
import scala.scalajs.js
import js.annotation._

package object ace extends js.GlobalScope {
  var ace: Ace = js.native
}

trait Delta extends js.Object {
  var action: String = js.native
  var range: Range = js.native
  var text: String = js.native
  var lines: js.Array[String] = js.native
}

trait EditorCommand extends js.Object {
  var name: String = js.native
  var bindKey: js.Any = js.native
  var exec: js.Function = js.native
}

trait CommandManager extends js.Object {
  var byName: js.Array[EditorCommand] = js.native
  var commands: js.Array[EditorCommand] = js.native
  var platform: String = js.native
  def addCommands(commands: js.Array[EditorCommand]): js.Dynamic = js.native
  def addCommand(command: EditorCommand): js.Dynamic = js.native
  def exec(name: String, editor: Editor, args: js.Any): js.Dynamic = js.native
}

trait Annotation extends js.Object {
  var row: Double = js.native
  var column: Double = js.native
  var text: String = js.native
  var `type`: String = js.native
}

trait TokenInfo extends js.Object {
  var value: String = js.native
}

trait Position extends js.Object {
  var row: Int = js.native
  var column: Int = js.native
}

@JSName("AceAjax.KeyBinding")
class KeyBinding protected () extends js.Object {
  def this(editor: Editor) = this()
  def setDefaultHandler(kb: js.Any): js.Dynamic = js.native
  def setKeyboardHandler(kb: js.Any): js.Dynamic = js.native
  def addKeyboardHandler(kb: js.Any, pos: js.Any): js.Dynamic = js.native
  def removeKeyboardHandler(kb: js.Any): Boolean = js.native
  def getKeyboardHandler(): js.Dynamic = js.native
  def onCommandKey(e: js.Any, hashId: js.Any, keyCode: js.Any): js.Dynamic = js.native
  def onTextInput(text: js.Any): js.Dynamic = js.native
}

@JSName("AceAjax.KeyBinding")
object KeyBinding extends js.Object {
}

class TextMode extends js.Object {
  def this($id: js.Any) = this()
  def getTokenizer(): js.Dynamic = js.native
  def toggleCommentLines(state: js.Any, doc: js.Any, startRow: js.Any, endRow: js.Any): js.Dynamic = js.native
  def getNextLineIndent(state: js.Any, line: js.Any, tab: js.Any): String = js.native
  def checkOutdent(state: js.Any, line: js.Any, input: js.Any): Boolean = js.native
  def autoOutdent(state: js.Any, doc: js.Any, row: js.Any): js.Dynamic = js.native
  def createWorker(session: js.Any): js.Dynamic = js.native
  def createModeDelegates(mapping: js.Any): js.Dynamic = js.native
  def transformAction(state: js.Any, action: js.Any, editor: js.Any, session: js.Any, param: js.Any): js.Dynamic = js.native
}

trait Ace extends js.Object {
  def require(moduleName: String): js.Dynamic = js.native
  def edit(el: String): Editor = js.native
  def createEditSession(text: js.Any, mode: js.Any): IEditSession = js.native
}

@JSName("AceAjax.Anchor")
class Anchor protected () extends js.Object {
  def this(doc: Document, row: Double, column: Double) = this()
  def on(event: String, fn: js.Function1[js.Any, Any]): js.Dynamic = js.native
  def getPosition(): Position = js.native
  def getDocument(): Document = js.native
  def onChange(e: js.Any): js.Dynamic = js.native
  def setPosition(row: Double, column: Double, noClip: Boolean): js.Dynamic = js.native
  def detach(): js.Dynamic = js.native
}

@JSName("AceAjax.Anchor")
object Anchor extends js.Object {
}

@JSName("AceAjax.BackgroundTokenizer")
class BackgroundTokenizer protected () extends js.Object {
  def this(tokenizer: Tokenizer, editor: Editor) = this()
  var states: js.Array[js.Any] = js.native
  def setTokenizer(tokenizer: Tokenizer): js.Dynamic = js.native
  def setDocument(doc: Document): js.Dynamic = js.native
  def fireUpdateEvent(firstRow: Double, lastRow: Double): js.Dynamic = js.native
  def start(startRow: Double): js.Dynamic = js.native
  def stop(): js.Dynamic = js.native
  def getTokens(row: Double): js.Array[TokenInfo] = js.native
  def getState(row: Double): String = js.native
}

@JSName("AceAjax.BackgroundTokenizer")
object BackgroundTokenizer extends js.Object {
}

@JSName("AceAjax.Document")
class Document protected () extends js.Object {
  def this(text: String = ???) = this()
  def on(event: String, fn: js.Function1[js.Any, Any]): js.Dynamic = js.native
  def setValue(text: String): js.Dynamic = js.native
  def getValue(): String = js.native
  def createAnchor(row: Double, column: Double): js.Dynamic = js.native
  def getNewLineCharacter(): String = js.native
  def setNewLineMode(newLineMode: String): js.Dynamic = js.native
  def getNewLineMode(): String = js.native
  def isNewLine(text: String): Boolean = js.native
  def getLine(row: Double): String = js.native
  def getLines(firstRow: Double, lastRow: Double): js.Array[String] = js.native
  def getAllLines(): js.Array[String] = js.native
  def getLength(): Int = js.native
  def getTextRange(range: Range): String = js.native
  def insert(position: Position, text: String): js.Dynamic = js.native
  def insertLines(row: Double, lines: js.Array[String]): js.Dynamic = js.native
  def insertNewLine(position: Position): js.Dynamic = js.native
  def insertInLine(position: js.Any, text: String): js.Dynamic = js.native
  def remove(range: Range): js.Dynamic = js.native
  def removeInLine(row: Double, startColumn: Double, endColumn: Double): js.Dynamic = js.native
  def removeLines(firstRow: Double, lastRow: Double): js.Array[String] = js.native
  def removeNewLine(row: Double): js.Dynamic = js.native
  def replace(range: Range, text: String): js.Dynamic = js.native
  def applyDeltas(deltas: js.Array[Delta]): js.Dynamic = js.native
  def revertDeltas(deltas: js.Array[Delta]): js.Dynamic = js.native
  def indexToPosition(index: Int, startRow: Int): Position = js.native
  def positionToIndex(pos: Position, startRow: Int): Int = js.native
}

@JSName("AceAjax.Document")
object Document extends js.Object {
}

trait IEditSession extends js.Object {
  var selection: Selection = js.native
  var bgTokenizer: BackgroundTokenizer = js.native
  var doc: Document = js.native
  def on(event: String, fn: js.Function1[js.Any, Any]): js.Dynamic = js.native
  def findMatchingBracket(position: Position): js.Dynamic = js.native
  def addFold(text: String, range: Range): js.Dynamic = js.native
  def getFoldAt(row: Double, column: Double): js.Dynamic = js.native
  def removeFold(arg: js.Any): js.Dynamic = js.native
  def expandFold(arg: js.Any): js.Dynamic = js.native
  def unfold(arg1: js.Any, arg2: Boolean): js.Dynamic = js.native
  def screenToDocumentColumn(row: Double, column: Double): js.Dynamic = js.native
  def getFoldDisplayLine(foldLine: js.Any, docRow: Double, docColumn: Double): js.Dynamic = js.native
  def getFoldsInRange(range: Range): js.Dynamic = js.native
  def highlight(text: String): js.Dynamic = js.native
  def setDocument(doc: Document): js.Dynamic = js.native
  def getDocument(): Document = js.native
  @JSName("$resetRowCache")
  def `$resetRowCache`(row: Double): js.Dynamic = js.native
  def setValue(text: String): js.Dynamic = js.native
  def setMode(mode: String): js.Dynamic = js.native
  def getValue(): String = js.native
  def getSelection(): Selection = js.native
  def getState(row: Double): String = js.native
  def getTokens(row: Double): js.Array[TokenInfo] = js.native
  def getTokenAt(row: Double, column: Double): TokenInfo = js.native
  def setUndoManager(undoManager: UndoManager): js.Dynamic = js.native
  def getUndoManager(): UndoManager = js.native
  def getTabString(): String = js.native
  def setUseSoftTabs(useSoftTabs: Boolean): js.Dynamic = js.native
  def getUseSoftTabs(): Boolean = js.native
  def setTabSize(tabSize: Double): js.Dynamic = js.native
  def getTabSize(): Double = js.native
  def isTabStop(position: js.Any): Boolean = js.native
  def setOverwrite(overwrite: Boolean): js.Dynamic = js.native
  def getOverwrite(): Boolean = js.native
  def toggleOverwrite(): js.Dynamic = js.native
  def addGutterDecoration(row: Double, className: String): js.Dynamic = js.native
  def removeGutterDecoration(row: Double, className: String): js.Dynamic = js.native
  def getBreakpoints(): js.Array[Double] = js.native
  def setBreakpoints(rows: js.Array[js.Any]): js.Dynamic = js.native
  def clearBreakpoints(): js.Dynamic = js.native
  def setBreakpoint(row: Double, className: String): js.Dynamic = js.native
  def clearBreakpoint(row: Double): js.Dynamic = js.native
  def addMarker(range: Range, clazz: String, `type`: js.Function, inFront: Boolean): js.Dynamic = js.native
  def addDynamicMarker(marker: js.Any, inFront: Boolean): js.Dynamic = js.native
  def removeMarker(markerId: Double): js.Dynamic = js.native
  def getMarkers(inFront: Boolean): js.Array[js.Any] = js.native
  def setAnnotations(annotations: js.Array[Annotation]): js.Dynamic = js.native
  def getAnnotations(): js.Dynamic = js.native
  def clearAnnotations(): js.Dynamic = js.native
  @JSName("$detectNewLine")
  def `$detectNewLine`(text: String): js.Dynamic = js.native
  def getWordRange(row: Double, column: Double): Range = js.native
  def getAWordRange(row: Double, column: Double): js.Dynamic = js.native
  def setNewLineMode(newLineMode: String): js.Dynamic = js.native
  def getNewLineMode(): String = js.native
  def setUseWorker(useWorker: Boolean): js.Dynamic = js.native
  def getUseWorker(): Boolean = js.native
  def onReloadTokenizer(): js.Dynamic = js.native
  @JSName("$mode")
  def `$mode`(mode: TextMode): js.Dynamic = js.native
  def getMode(): TextMode = js.native
  def setScrollTop(scrollTop: Double): js.Dynamic = js.native
  def getScrollTop(): Double = js.native
  def setScrollLeft(): js.Dynamic = js.native
  def getScrollLeft(): Double = js.native
  def getScreenWidth(): Double = js.native
  def getLine(row: Double): String = js.native
  def getLines(firstRow: Double, lastRow: Double): js.Array[String] = js.native
  def getLength(): Double = js.native
  def getTextRange(range: Range): String = js.native
  def insert(position: Position, text: String): js.Dynamic = js.native
  def remove(range: Range): js.Dynamic = js.native
  def undoChanges(deltas: js.Array[js.Any], dontSelect: Boolean): Range = js.native
  def redoChanges(deltas: js.Array[js.Any], dontSelect: Boolean): Range = js.native
  def setUndoSelect(enable: Boolean): js.Dynamic = js.native
  def replace(range: Range, text: String): js.Dynamic = js.native
  def moveText(fromRange: Range, toPosition: js.Any): Range = js.native
  def indentRows(startRow: Double, endRow: Double, indentString: String): js.Dynamic = js.native
  def outdentRows(range: Range): js.Dynamic = js.native
  def moveLinesUp(firstRow: Double, lastRow: Double): Double = js.native
  def moveLinesDown(firstRow: Double, lastRow: Double): Double = js.native
  def duplicateLines(firstRow: Double, lastRow: Double): Double = js.native
  def setUseWrapMode(useWrapMode: Boolean): js.Dynamic = js.native
  def getUseWrapMode(): Boolean = js.native
  def setWrapLimitRange(min: Double, max: Double): js.Dynamic = js.native
  def adjustWrapLimit(desiredLimit: Double): Boolean = js.native
  def getWrapLimit(): Double = js.native
  def getWrapLimitRange(): js.Dynamic = js.native
  @JSName("$getDisplayTokens")
  def `$getDisplayTokens`(str: String, offset: Double): js.Dynamic = js.native
  @JSName("$getStringScreenWidth")
  def `$getStringScreenWidth`(str: String, maxScreenColumn: Double, screenColumn: Double): js.Array[Double] = js.native
  def getRowLength(row: Double): Double = js.native
  def getScreenLastRowColumn(screenRow: Double): Double = js.native
  def getDocumentLastRowColumn(docRow: Double, docColumn: Double): Double = js.native
  def getDocumentLastRowColumnPosition(docRow: Double, docColumn: Double): Double = js.native
  def getRowSplitData(): String = js.native
  def getScreenTabSize(screenColumn: Double): Double = js.native
  def screenToDocumentPosition(screenRow: Double, screenColumn: Double): js.Dynamic = js.native
  def documentToScreenPosition(docRow: Double, docColumn: Double): js.Dynamic = js.native
  def documentToScreenColumn(row: Double, docColumn: Double): Double = js.native
  def documentToScreenRow(docRow: Double, docColumn: Double): js.Dynamic = js.native
  def getScreenLength(): Double = js.native
}

@JSName("AceAjax.EditSession")
object EditSession extends js.Object {
  /* ??? ConstructorMember(FunSignature(List(),List(FunParam(Ident(text),false,Some(TypeRef(CoreType(string),List()))), FunParam(Ident(mode),true,Some(TypeRef(TypeName(TextMode),List())))),Some(TypeRef(TypeName(IEditSession),List())))) */
  /* ??? ConstructorMember(FunSignature(List(),List(FunParam(Ident(content),false,Some(TypeRef(CoreType(string),List()))), FunParam(Ident(mode),true,Some(TypeRef(CoreType(string),List())))),Some(TypeRef(TypeName(IEditSession),List())))) */
  /* ??? ConstructorMember(FunSignature(List(),List(FunParam(Ident(text),false,Some(TypeRef(TypeName(Array),List(TypeRef(CoreType(string),List()))))), FunParam(Ident(mode),true,Some(TypeRef(CoreType(string),List())))),Some(TypeRef(TypeName(IEditSession),List())))) */
}

@JSName("AceAjax.Editor")
class Editor protected () extends js.Object {
  def this(renderer: VirtualRenderer, session: IEditSession = ???) = this()
  def addEventListener(ev: String, callback: js.Function): js.Dynamic = js.native
  var inMultiSelectMode: Boolean = js.native
  def selectMoreLines(n: Double): js.Dynamic = js.native
  def onTextInput(text: String): js.Dynamic = js.native
  def onCommandKey(e: js.Any, hashId: js.Any, keyCode: js.Any): js.Dynamic = js.native
  var commands: CommandManager = js.native
  var session: IEditSession = js.native
  var selection: Selection = js.native
  var renderer: VirtualRenderer = js.native
  var keyBinding: KeyBinding = js.native
  var container: HTMLElement = js.native
  var $blockScrolling: js.Any = js.native
  def onSelectionChange(e: js.Any): js.Dynamic = js.native
  def onChangeMode(e: js.Any = ???): js.Dynamic = js.native
  def execCommand(command: String, args: js.Any = ???): js.Dynamic = js.native
  def setKeyboardHandler(keyboardHandler: String): js.Dynamic = js.native
  def getKeyboardHandler(): String = js.native
  def setSession(session: IEditSession): js.Dynamic = js.native
  def getSession(): IEditSession = js.native
  def setValue(`val`: String, cursorPos: Double = ???): String = js.native
  def getValue(): String = js.native
  def getSelection(): Selection = js.native
  def resize(force: Boolean = ???): js.Dynamic = js.native
  def setTheme(theme: String): js.Dynamic = js.native
  def getTheme(): String = js.native
  def setStyle(style: String): js.Dynamic = js.native
  def unsetStyle(): js.Dynamic = js.native
  def setFontSize(size: String): js.Dynamic = js.native
  def focus(): js.Dynamic = js.native
  def isFocused(): js.Dynamic = js.native
  def blur(): js.Dynamic = js.native
  def onFocus(): js.Dynamic = js.native
  def onBlur(): js.Dynamic = js.native
  def onDocumentChange(e: js.Any): js.Dynamic = js.native
  def onCursorChange(): js.Dynamic = js.native
  def getCopyText(): String = js.native
  def onCopy(): js.Dynamic = js.native
  def onCut(): js.Dynamic = js.native
  def onPaste(text: String): js.Dynamic = js.native
  def insert(text: String): js.Dynamic = js.native
  def setOverwrite(overwrite: Boolean): js.Dynamic = js.native
  def getOverwrite(): Boolean = js.native
  def toggleOverwrite(): js.Dynamic = js.native
  def setScrollSpeed(speed: Double): js.Dynamic = js.native
  def getScrollSpeed(): Double = js.native
  def setDragDelay(dragDelay: Double): js.Dynamic = js.native
  def getDragDelay(): Double = js.native
  def setSelectionStyle(style: String): js.Dynamic = js.native
  def getSelectionStyle(): String = js.native
  def setHighlightActiveLine(shouldHighlight: Boolean): js.Dynamic = js.native
  def getHighlightActiveLine(): js.Dynamic = js.native
  def setHighlightSelectedWord(shouldHighlight: Boolean): js.Dynamic = js.native
  def getHighlightSelectedWord(): Boolean = js.native
  def setShowInvisibles(showInvisibles: Boolean): js.Dynamic = js.native
  def getShowInvisibles(): Boolean = js.native
  def setShowPrintMargin(showPrintMargin: Boolean): js.Dynamic = js.native
  def getShowPrintMargin(): Boolean = js.native
  def setPrintMarginColumn(showPrintMargin: Double): js.Dynamic = js.native
  def getPrintMarginColumn(): Double = js.native
  def setReadOnly(readOnly: Boolean): js.Dynamic = js.native
  def getReadOnly(): Boolean = js.native
  def setBehavioursEnabled(enabled: Boolean): js.Dynamic = js.native
  def getBehavioursEnabled(): Boolean = js.native
  def setWrapBehavioursEnabled(enabled: Boolean): js.Dynamic = js.native
  def getWrapBehavioursEnabled(): js.Dynamic = js.native
  def setShowFoldWidgets(show: Boolean): js.Dynamic = js.native
  def getShowFoldWidgets(): js.Dynamic = js.native
  def remove(dir: String): js.Dynamic = js.native
  def removeWordRight(): js.Dynamic = js.native
  def removeWordLeft(): js.Dynamic = js.native
  def removeToLineStart(): js.Dynamic = js.native
  def removeToLineEnd(): js.Dynamic = js.native
  def splitLine(): js.Dynamic = js.native
  def transposeLetters(): js.Dynamic = js.native
  def toLowerCase(): js.Dynamic = js.native
  def toUpperCase(): js.Dynamic = js.native
  def indent(): js.Dynamic = js.native
  def blockIndent(): js.Dynamic = js.native
  def blockOutdent(arg: String = ???): js.Dynamic = js.native
  def toggleCommentLines(): js.Dynamic = js.native
  def getNumberAt(): Double = js.native
  def modifyNumber(amount: Double): js.Dynamic = js.native
  def removeLines(): js.Dynamic = js.native
  def moveLinesDown(): Double = js.native
  def moveLinesUp(): Double = js.native
  def moveText(fromRange: Range, toPosition: js.Any): Range = js.native
  def copyLinesUp(): Double = js.native
  def copyLinesDown(): Double = js.native
  def getFirstVisibleRow(): Double = js.native
  def getLastVisibleRow(): Double = js.native
  def isRowVisible(row: Double): Boolean = js.native
  def isRowFullyVisible(row: Double): Boolean = js.native
  def selectPageDown(): js.Dynamic = js.native
  def selectPageUp(): js.Dynamic = js.native
  def gotoPageDown(): js.Dynamic = js.native
  def gotoPageUp(): js.Dynamic = js.native
  def scrollPageDown(): js.Dynamic = js.native
  def scrollPageUp(): js.Dynamic = js.native
  def scrollToRow(): js.Dynamic = js.native
  def scrollToLine(line: Double, center: Boolean, animate: Boolean, callback: js.Function): js.Dynamic = js.native
  def centerSelection(): js.Dynamic = js.native
  def getCursorPosition(): Position = js.native
  def getCursorPositionScreen(): Double = js.native
  def getSelectionRange(): Range = js.native
  def selectAll(): js.Dynamic = js.native
  def clearSelection(): js.Dynamic = js.native
  def moveCursorTo(row: Double, column: Double = ???, animate: Boolean = ???): js.Dynamic = js.native
  def moveCursorToPosition(position: Position): js.Dynamic = js.native
  def jumpToMatching(): js.Dynamic = js.native
  def gotoLine(lineNumber: Double, column: Double = ???, animate: Boolean = ???): js.Dynamic = js.native
  def navigateTo(row: Double, column: Double): js.Dynamic = js.native
  def navigateUp(times: Double = ???): js.Dynamic = js.native
  def navigateDown(times: Double = ???): js.Dynamic = js.native
  def navigateLeft(times: Double = ???): js.Dynamic = js.native
  def navigateRight(times: Double): js.Dynamic = js.native
  def navigateLineStart(): js.Dynamic = js.native
  def navigateLineEnd(): js.Dynamic = js.native
  def navigateFileEnd(): js.Dynamic = js.native
  def navigateFileStart(): js.Dynamic = js.native
  def navigateWordRight(): js.Dynamic = js.native
  def navigateWordLeft(): js.Dynamic = js.native
  def replace(replacement: String, options: js.Any = ???): js.Dynamic = js.native
  def replaceAll(replacement: String, options: js.Any = ???): js.Dynamic = js.native
  def getLastSearchOptions(): js.Dynamic = js.native
  def find(needle: String, options: js.Any = ???, animate: Boolean = ???): js.Dynamic = js.native
  def findNext(options: js.Any = ???, animate: Boolean = ???): js.Dynamic = js.native
  def findPrevious(options: js.Any = ???, animate: Boolean = ???): js.Dynamic = js.native
  def undo(): js.Dynamic = js.native
  def redo(): js.Dynamic = js.native
  def destroy(): js.Dynamic = js.native
  def setOptions(options: js.Any): js.Dynamic = js.native
}

@JSName("AceAjax.Editor")
object Editor extends js.Object {
}

trait EditorChangeEvent extends js.Object {
  var start: Position = js.native
  var end: Position = js.native
  var action: String = js.native
  var lines: js.Array[js.Any] = js.native
}

@JSName("AceAjax.PlaceHolder")
class PlaceHolder protected () extends js.Object {
  def this(session: Document, length: Double, pos: Double, others: String, mainClass: String, othersClass: String) = this()
  def this(session: IEditSession, length: Double, pos: Position, positions: js.Array[Position]) = this()
  def on(event: String, fn: js.Function1[js.Any, Any]): js.Dynamic = js.native
  def setup(): js.Dynamic = js.native
  def showOtherMarkers(): js.Dynamic = js.native
  def hideOtherMarkers(): js.Dynamic = js.native
  def onUpdate(): js.Dynamic = js.native
  def onCursorChange(): js.Dynamic = js.native
  def detach(): js.Dynamic = js.native
  def cancel(): js.Dynamic = js.native
}

@JSName("AceAjax.PlaceHolder")
object PlaceHolder extends js.Object {
}

trait IRangeList extends js.Object {
  var ranges: js.Array[Range] = js.native
  def pointIndex(pos: Position, startIndex: Double = ???): js.Dynamic = js.native
  def addList(ranges: js.Array[Range]): js.Dynamic = js.native
  def add(ranges: Range): js.Dynamic = js.native
  def merge(): js.Array[Range] = js.native
  def substractPoint(pos: Position): js.Dynamic = js.native
}

@JSName("AceAjax.RangeList")
object RangeList extends js.Object {
  /* ??? ConstructorMember(FunSignature(List(),List(),Some(TypeRef(TypeName(IRangeList),List())))) */
}

@JSName("AceAjax.Range")
class Range protected () extends js.Object {
  def this(startRow: Double, startColumn: Double, endRow: Double, endColumn: Double) = this()
  var startRow: Double = js.native
  var startColumn: Double = js.native
  var endRow: Double = js.native
  var endColumn: Double = js.native
  var start: Position = js.native
  var end: Position = js.native
  def isEmpty(): Boolean = js.native
  def isEqual(range: Range): js.Dynamic = js.native
  override def toString(): String = js.native
  def contains(row: Double, column: Double): Boolean = js.native
  def compareRange(range: Range): Double = js.native
  def comparePoint(p: Range): Double = js.native
  def containsRange(range: Range): Boolean = js.native
  def intersects(range: Range): Boolean = js.native
  def isEnd(row: Double, column: Double): Boolean = js.native
  def isStart(row: Double, column: Double): Boolean = js.native
  def setStart(row: Double, column: Double): js.Dynamic = js.native
  def setEnd(row: Double, column: Double): js.Dynamic = js.native
  def inside(row: Double, column: Double): Boolean = js.native
  def insideStart(row: Double, column: Double): Boolean = js.native
  def insideEnd(row: Double, column: Double): Boolean = js.native
  def compare(row: Double, column: Double): Double = js.native
  def compareStart(row: Double, column: Double): Double = js.native
  def compareEnd(row: Double, column: Double): Double = js.native
  def compareInside(row: Double, column: Double): Double = js.native
  def clipRows(firstRow: Double, lastRow: Double): Range = js.native
  def extend(row: Double, column: Double): Range = js.native
  def isMultiLine(): Boolean = js.native
  override def clone(): Range = js.native
  def collapseRows(): Range = js.native
  def toScreenRange(session: IEditSession): Range = js.native
  def fromPoints(start: Range, end: Range): Range = js.native
}

@JSName("AceAjax.Range")
object Range extends js.Object {
  def fromPoints(pos1: Position, pos2: Position): Range = js.native
}

@JSName("AceAjax.RenderLoop")
class RenderLoop extends js.Object {
}

@JSName("AceAjax.RenderLoop")
object RenderLoop extends js.Object {
}

@JSName("AceAjax.ScrollBar")
class ScrollBar protected () extends js.Object {
  def this(parent: HTMLElement) = this()
  def onScroll(e: js.Any): js.Dynamic = js.native
  def getWidth(): Double = js.native
  def setHeight(height: Double): js.Dynamic = js.native
  def setInnerHeight(height: Double): js.Dynamic = js.native
  def setScrollTop(scrollTop: Double): js.Dynamic = js.native
}

@JSName("AceAjax.ScrollBar")
object ScrollBar extends js.Object {
}

@JSName("AceAjax.Search")
class Search extends js.Object {
  def set(options: js.Any): Search = js.native
  def getOptions(): js.Dynamic = js.native
  def setOptions(An: js.Any): js.Dynamic = js.native
  def find(session: IEditSession): Range = js.native
  def findAll(session: IEditSession): js.Array[Range] = js.native
  def replace(input: String, replacement: String): String = js.native
}

@JSName("AceAjax.Search")
object Search extends js.Object {
}

@JSName("AceAjax.Selection")
class Selection protected () extends js.Object {
  def this(session: IEditSession) = this()
  def addEventListener(ev: String, callback: js.Function): js.Dynamic = js.native
  def moveCursorWordLeft(): js.Dynamic = js.native
  def moveCursorWordRight(): js.Dynamic = js.native
  def fromOrientedRange(range: Range): js.Dynamic = js.native
  def setSelectionRange(`match`: js.Any): js.Dynamic = js.native
  def getAllRanges(): js.Array[Range] = js.native
  def on(event: String, fn: js.Function1[js.Any, Any]): js.Dynamic = js.native
  def addRange(range: Range): js.Dynamic = js.native
  def isEmpty(): Boolean = js.native
  def isMultiLine(): Boolean = js.native
  def getCursor(): Position = js.native
  def setSelectionAnchor(row: Double, column: Double): js.Dynamic = js.native
  def getSelectionAnchor(): js.Dynamic = js.native
  def getSelectionLead(): js.Dynamic = js.native
  def shiftSelection(columns: Double): js.Dynamic = js.native
  def isBackwards(): Boolean = js.native
  def getRange(): Range = js.native
  def clearSelection(): js.Dynamic = js.native
  def selectAll(): js.Dynamic = js.native
  def setRange(range: Range, reverse: Boolean): js.Dynamic = js.native
  def selectTo(row: Double, column: Double): js.Dynamic = js.native
  def selectToPosition(pos: js.Any): js.Dynamic = js.native
  def selectUp(): js.Dynamic = js.native
  def selectDown(): js.Dynamic = js.native
  def selectRight(): js.Dynamic = js.native
  def selectLeft(): js.Dynamic = js.native
  def selectLineStart(): js.Dynamic = js.native
  def selectLineEnd(): js.Dynamic = js.native
  def selectFileEnd(): js.Dynamic = js.native
  def selectFileStart(): js.Dynamic = js.native
  def selectWordRight(): js.Dynamic = js.native
  def selectWordLeft(): js.Dynamic = js.native
  def getWordRange(): js.Dynamic = js.native
  def selectWord(): js.Dynamic = js.native
  def selectAWord(): js.Dynamic = js.native
  def selectLine(): js.Dynamic = js.native
  def moveCursorUp(): js.Dynamic = js.native
  def moveCursorDown(): js.Dynamic = js.native
  def moveCursorLeft(): js.Dynamic = js.native
  def moveCursorRight(): js.Dynamic = js.native
  def moveCursorLineStart(): js.Dynamic = js.native
  def moveCursorLineEnd(): js.Dynamic = js.native
  def moveCursorFileEnd(): js.Dynamic = js.native
  def moveCursorFileStart(): js.Dynamic = js.native
  def moveCursorLongWordRight(): js.Dynamic = js.native
  def moveCursorLongWordLeft(): js.Dynamic = js.native
  def moveCursorBy(rows: Double, chars: Double): js.Dynamic = js.native
  def moveCursorToPosition(position: js.Any): js.Dynamic = js.native
  def moveCursorTo(row: Double, column: Double, keepDesiredColumn: Boolean = ???): js.Dynamic = js.native
  def moveCursorToScreen(row: Double, column: Double, keepDesiredColumn: Boolean): js.Dynamic = js.native
}

@JSName("AceAjax.Selection")
object Selection extends js.Object {
}

@JSName("AceAjax.Split")
class Split extends js.Object {
  def getSplits(): Double = js.native
  def getEditor(idx: Double): js.Dynamic = js.native
  def getCurrentEditor(): Editor = js.native
  def focus(): js.Dynamic = js.native
  def blur(): js.Dynamic = js.native
  def setTheme(theme: String): js.Dynamic = js.native
  def setKeyboardHandler(keybinding: String): js.Dynamic = js.native
  def forEach(callback: js.Function, scope: String): js.Dynamic = js.native
  def setFontSize(size: Double): js.Dynamic = js.native
  def setSession(session: IEditSession, idx: Double): js.Dynamic = js.native
  def getOrientation(): Double = js.native
  def setOrientation(orientation: Double): js.Dynamic = js.native
  def resize(): js.Dynamic = js.native
}

@JSName("AceAjax.Split")
object Split extends js.Object {
}

@JSName("AceAjax.TokenIterator")
class TokenIterator protected () extends js.Object {
  def this(session: IEditSession, initialRow: Double, initialColumn: Double) = this()
  def stepBackward(): js.Array[String] = js.native
  def stepForward(): String = js.native
  def getCurrentToken(): TokenInfo = js.native
  def getCurrentTokenRow(): Double = js.native
  def getCurrentTokenColumn(): Double = js.native
}

@JSName("AceAjax.TokenIterator")
object TokenIterator extends js.Object {
}

@JSName("AceAjax.Tokenizer")
class Tokenizer protected () extends js.Object {
  def this(rules: js.Any, flag: String) = this()
  def getLineTokens(): js.Dynamic = js.native
}

@JSName("AceAjax.Tokenizer")
object Tokenizer extends js.Object {
}

@JSName("AceAjax.UndoManager")
class UndoManager extends js.Object {
  def execute(options: js.Any): js.Dynamic = js.native
  def undo(dontSelect: Boolean = ???): Range = js.native
  def redo(dontSelect: Boolean): js.Dynamic = js.native
  def reset(): js.Dynamic = js.native
  def hasUndo(): Boolean = js.native
  def hasRedo(): Boolean = js.native
}

@JSName("AceAjax.UndoManager")
object UndoManager extends js.Object {
}

@JSName("AceAjax.VirtualRenderer")
class VirtualRenderer protected () extends js.Object {
  def this(container: HTMLElement, theme: String = ???) = this()
  var scroller: js.Any = js.native
  var characterWidth: Double = js.native
  var lineHeight: Double = js.native
  def screenToTextCoordinates(left: Double, top: Double): js.Dynamic = js.native
  def setSession(session: IEditSession): js.Dynamic = js.native
  def updateLines(firstRow: Double, lastRow: Double): js.Dynamic = js.native
  def updateText(): js.Dynamic = js.native
  def updateFull(force: Boolean): js.Dynamic = js.native
  def updateFontSize(): js.Dynamic = js.native
  def onResize(force: Boolean, gutterWidth: Double, width: Double, height: Double): js.Dynamic = js.native
  def adjustWrapLimit(): js.Dynamic = js.native
  def setAnimatedScroll(shouldAnimate: Boolean): js.Dynamic = js.native
  def getAnimatedScroll(): Boolean = js.native
  def setShowInvisibles(showInvisibles: Boolean): js.Dynamic = js.native
  def getShowInvisibles(): Boolean = js.native
  def setShowPrintMargin(showPrintMargin: Boolean): js.Dynamic = js.native
  def getShowPrintMargin(): Boolean = js.native
  def setPrintMarginColumn(showPrintMargin: Boolean): js.Dynamic = js.native
  def getPrintMarginColumn(): Boolean = js.native
  def getShowGutter(): Boolean = js.native
  def setShowGutter(show: Boolean): js.Dynamic = js.native
  def getContainerElement(): HTMLElement = js.native
  def getMouseEventTarget(): HTMLElement = js.native
  def getTextAreaContainer(): HTMLElement = js.native
  def getFirstVisibleRow(): Double = js.native
  def getFirstFullyVisibleRow(): Double = js.native
  def getLastFullyVisibleRow(): Double = js.native
  def getLastVisibleRow(): Double = js.native
  def setPadding(padding: Double): js.Dynamic = js.native
  def getHScrollBarAlwaysVisible(): Boolean = js.native
  def setHScrollBarAlwaysVisible(alwaysVisible: Boolean): js.Dynamic = js.native
  def updateFrontMarkers(): js.Dynamic = js.native
  def updateBackMarkers(): js.Dynamic = js.native
  def addGutterDecoration(): js.Dynamic = js.native
  def removeGutterDecoration(): js.Dynamic = js.native
  def updateBreakpoints(): js.Dynamic = js.native
  def setAnnotations(annotations: js.Array[js.Any]): js.Dynamic = js.native
  def updateCursor(): js.Dynamic = js.native
  def hideCursor(): js.Dynamic = js.native
  def showCursor(): js.Dynamic = js.native
  def scrollCursorIntoView(): js.Dynamic = js.native
  def getScrollTop(): Double = js.native
  def getScrollLeft(): Double = js.native
  def getScrollTopRow(): Double = js.native
  def getScrollBottomRow(): Double = js.native
  def scrollToRow(row: Double): js.Dynamic = js.native
  def scrollToLine(line: Double, center: Boolean, animate: Boolean, callback: js.Function): js.Dynamic = js.native
  def scrollToY(scrollTop: Double): Double = js.native
  def scrollToX(scrollLeft: Double): Double = js.native
  def scrollBy(deltaX: Double, deltaY: Double): js.Dynamic = js.native
  def isScrollableBy(deltaX: Double, deltaY: Double): Boolean = js.native
  def textToScreenCoordinates(row: Double, column: Double): js.Dynamic = js.native
  def visualizeFocus(): js.Dynamic = js.native
  def visualizeBlur(): js.Dynamic = js.native
  def showComposition(position: Double): js.Dynamic = js.native
  def setCompositionText(text: String): js.Dynamic = js.native
  def hideComposition(): js.Dynamic = js.native
  def setTheme(theme: String): js.Dynamic = js.native
  def getTheme(): String = js.native
  def setStyle(style: String): js.Dynamic = js.native
  def unsetStyle(style: String): js.Dynamic = js.native
  def destroy(): js.Dynamic = js.native
}

@JSName("AceAjax.VirtualRenderer")
object VirtualRenderer extends js.Object {
}
