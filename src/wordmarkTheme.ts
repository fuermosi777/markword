import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { regularFontFamily } from './theme';

export function wordmarkTheme(): Extension {
  return [baseTheme];
}

const baseTheme = EditorView.theme({
  '&.cm-editor': {
    height: '100%',
  },
  '&.cm-content': {
    lineHeight: 2,
  },
  '.cm-line': { ...regularFontFamily },
  '&.cm-focused': { outline: 'none' },
});
