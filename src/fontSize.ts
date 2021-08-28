import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function fontSize(value: number): Extension {
  return EditorView.theme({
    '&.cm-editor': {
      fontSize: `${value}px`,
    },
  });
}
