import { Extension } from '@codemirror/next/state';
import { EditorView } from '@codemirror/next/view';

export function defaultColor(): Extension {
  return [defaultTheme];
}

export function darkColor(): Extension {
  return [darkTheme];
}

const defaultTheme = EditorView.theme(
  {
    $$wrap: {
      backgroundColor: 'white',
    },
    $content: { caretColor: '#188FE9' },
  },
  { dark: false },
);

const darkTheme = EditorView.theme(
  {
    $$wrap: {
      backgroundColor: '#1E1E1E',
    },
    $content: { caretColor: '#188FE9' },
  },
  { dark: true },
);
