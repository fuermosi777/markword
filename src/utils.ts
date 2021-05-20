import { EditorState } from '@codemirror/state';
import { Text } from '@codemirror/text';
import { ViewUpdate, WidgetType } from '@codemirror/view';

/**
 * Check if cursor is inside the widget.
 * @param update
 * @param from
 * @param to
 * @param inclusive Whether the left and right edges are included. Default is true.
 */
function isCursorInside(update: ViewUpdate, from: number, to: number, inclusive = true): boolean {
  let latestTr = update.transactions[update.transactions.length - 1];

  if (latestTr && latestTr.selection) {
    if (inclusive && latestTr.selection.main.head >= from && latestTr.selection.main.head <= to) {
      return true;
    }
    if (!inclusive && latestTr.selection.main.head > from && latestTr.selection.main.head < to) {
      return true;
    }
  }
  return false;
}

/**
 * Check if cursor is inside the line.
 * @param state
 * @param from
 * @param to
 * @returns
 */
function isCursorInsideLine(state: EditorState, from: number, to: number): boolean {
  let cursorStart = state.selection.main.from;
  let cursorEnd = state.selection.main.to;
  if (from <= cursorStart && cursorStart <= to) {
    return true;
  }
  if (to <= cursorEnd && cursorEnd <= to) {
    return true;
  }
  return false;
}

function eachLineMatchRe(
  doc: Text,
  from: number,
  // TODO: use this to save cost.
  to: number,
  re: RegExp,
  func: (match: any, pos: number) => void,
) {
  for (let pos = from, iter = doc.iterRange(from), m; !iter.next().done; ) {
    if (!iter.lineBreak) {
      while ((m = re.exec(iter.value))) {
        func(m, pos);
      }
    }
    pos += iter.value.length + 1;
  }
}

class EmptyWidget extends WidgetType {
  constructor() {
    super();
  }

  eq(other: EmptyWidget) {
    return true;
  }

  toDOM() {
    let span = document.createElement('span');
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

export { isCursorInside, isCursorInsideLine, eachLineMatchRe, EmptyWidget };
