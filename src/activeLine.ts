import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function showActiveLine(): Extension {
  return [
    EditorView.theme({
      '.cm-activeLine': {
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
      },
    }),
  ];
}

export function hideActiveLine(): Extension {
  return [
    EditorView.theme({
      '.cm-activeLine': {
        backgroundColor: 'transparent',
      },
    }),
  ];
}
