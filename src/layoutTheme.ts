import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function letterSpacing(value: number = 0): Extension {
  return EditorView.theme({
    '&.cm-editor': {
      letterSpacing: `${value}px`,
    },
  });
}

export function fontSize(value: number): Extension {
  return EditorView.theme({
    '&.cm-editor': {
      fontSize: `${value}px`,
    },
  });
}

export function fontFamily(
  name = '"SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;',
): Extension {
  return EditorView.theme({
    '.cm-line': {
      fontFamily: name,
    },
  });
}
