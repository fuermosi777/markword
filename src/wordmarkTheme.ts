import { Extension } from '@codemirror/next/state';
import { EditorView } from '@codemirror/next/view';
import { regularFontFamily } from './theme';

export function wordmarkTheme(): Extension {
  return [baseTheme];
}

const baseTheme = EditorView.baseTheme({
  $line: { ...regularFontFamily },
  $$focused: { outline: 'none' },
  $$wrap: {
    width: '800px',
    margin: '0 auto',
  },
});
