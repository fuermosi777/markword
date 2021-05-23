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
import { olistRE, taskRE, ulistRE } from './listTask';

const insertTab: StateCommand = ({ state, dispatch }) => {
  if (state.selection.ranges.some((r) => !r.empty))
    return indentMore({ state, dispatch });
  dispatch(
    state.update(state.replaceSelection(`  `), {
      scrollIntoView: true,
      annotations: [Transaction.userEvent.of('input')],
    }),
  );
  return true;
};

/// TODO: number list.
/// Get the line from current selection, use RE to check if the current line is a list. If it is a list, then fetch the list indicator and append to a new line.
const insertListTask: StateCommand = ({ state, dispatch }) => {
  let dont = null,
    changes = state.changeByRange((range) => {
      if (range.empty && markdownLanguage.isActiveAt(state, range.from)) {
        let line = state.doc.lineAt(range.from);
        let m = line.text.match(taskRE) || line.text.match(ulistRE);
        if (m) {
          // Unordered list or task.
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
          changes.push({
            from,
            to: from,
            insert: Text.of(['', m[0]]),
          });
          return {
            range: EditorSelection.cursor(from + 1 + m[0].length),
            changes,
          };
        }
        m = line.text.match(olistRE);
        console.log(m);
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
  run: insertListTask,
};
