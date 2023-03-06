import { indentMore } from '@codemirror/commands';
import { markdownLanguage } from '@codemirror/lang-markdown';
import {
  ChangeSpec,
  StateCommand,
  Transaction,
  Text,
  EditorSelection,
} from '@codemirror/state';
import { KeyBinding } from '@codemirror/view';
import { blockquoteRE } from './blockquote';
import { olistRE, taskRE, ulistRE } from './listTask';

const insertTab: StateCommand = ({ state, dispatch }) => {
  if (state.selection.ranges.some((r) => !r.empty))
    return indentMore({ state, dispatch });
  dispatch(
    state.update(state.replaceSelection(`    `), {
      scrollIntoView: true,
      annotations: [Transaction.userEvent.of('input')],
    }),
  );
  return true;
};

// Gets order of the ordered list. E.g. "1" from "1. xxx".
const olistOrderRE = /^(\s*)(\d+)(?=[.)])/;

// Get the line from current selection, use RE to check if the current line is a list.
// If it is a list, then fetch the list indicator and append to a new line.
const continueWithLastLine: StateCommand = ({ state, dispatch }) => {
  let dont = null,
    changes = state.changeByRange((range) => {
      if (range.empty && markdownLanguage.isActiveAt(state, range.from)) {
        // The line where the the key (Enter) is pressed.
        let line = state.doc.lineAt(range.from);
        let m =
          line.text.match(taskRE) ||
          line.text.match(ulistRE) ||
          line.text.match(olistRE) ||
          line.text.match(blockquoteRE);
        if (m) {
          let from = range.from;
          let changes: ChangeSpec[] = [];
          let isEmptyLine = m[0] === m.input;
          if (isEmptyLine) {
            from = from - m[0].length;
            return {
              range: EditorSelection.cursor(from),
              changes: { from, to: range.from },
            };
          }
          let orders = m[0].match(/\d+/g);
          let futureText = m[0];

          // If it is a todo bullet, make it unchecked.
          futureText = futureText.replace('[x]', '[ ]');

          // If it is a ordered list.
          if (orders && orders.length > 0) {
            // Ordered list
            let order = (Number(orders[0]) || 0) + 1;
            let preSpaces = m[1];
            futureText = m[0].replace(/\d+/, String(order));
            // Reorder numbers after this line.
            // Move the pos to the start of the next line.
            let pos = line.to + 1;
            while (pos < state.doc.length) {
              let line = state.doc.lineAt(pos);
              let stillList = olistOrderRE.exec(line.text);
              console.log('is still list?', stillList);
              if (!stillList) break;
              let nextPreSpaces = stillList[1];
              if (nextPreSpaces != preSpaces) break;
              order++;
              changes.push({
                from: line.from + stillList[1].length, // ?????
                to: line.from + stillList[0].length,
                insert: String(order),
              });
              pos = line.to + 1;
            }
          }
          changes.push({
            from,
            to: from,
            insert: Text.of(['', futureText]),
          });
          return {
            range: EditorSelection.cursor(from + 1 + futureText.length),
            changes,
          };
        }
        m = line.text.match(olistRE);
      }
      return (dont = { range });
    });
  if (dont) return false;

  dispatch(state.update(changes, { scrollIntoView: true }));
  // Allow other keymaps.
  return true;
};

export const spaceTabBinding: KeyBinding = { key: 'Tab', run: insertTab };
export const insertNewlineContinueList: KeyBinding = {
  key: 'Enter',
  run: continueWithLastLine,
};
