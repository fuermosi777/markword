import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { regularFontFamily } from './theme';

export function wordmarkTheme(): Extension {
  return [baseTheme];
}

const baseTheme = EditorView.theme(
  {
    $line: { ...regularFontFamily },
    // '$line:first-child': {
    //   marginTop: '60px',
    // },
    $$focused: { outline: 'none' },
    // $$wrap: {
    //   margin: '0 auto',
    //   height: '100%',
    // },
    // $content: {
    //   padding: '0 15%',
    // },
    // $image: {
    //   maxWidth: '100%',
    // },
  },
  { dark: true },
);
