import { indentMore } from '@codemirror/commands';
import { StateCommand, Transaction } from '@codemirror/state';
import { KeyBinding } from '@codemirror/view';

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

export const spaceTabBinding: KeyBinding = { key: 'Tab', run: insertTab };
