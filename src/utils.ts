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

export { isCursorInside };
