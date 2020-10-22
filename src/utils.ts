import { Text } from '@codemirror/next/text';
import { ViewUpdate } from '@codemirror/next/view';

function isCursorInside(update: ViewUpdate, from: number, to: number): boolean {
  let latestTr = update.transactions[update.transactions.length - 1];

  if (latestTr && latestTr.selection) {
    if (latestTr.selection.primary.head >= from && latestTr.selection.primary.head <= to) {
      return true;
    }
  }
  return false;
}

function eachLineMatchRe(
  doc: Text,
  from: number,
  to: number,
  re: RegExp,
  func: (match: any, pos: number) => void,
) {
  for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
    if (!cursor.lineBreak) {
      while ((m = re.exec(cursor.value))) {
        func(m, pos);
      }
    }
    pos += cursor.value.length;
  }
}

export { isCursorInside, eachLineMatchRe };
