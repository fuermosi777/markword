import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

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
    $line: { color: '#1E1E1E' },
    '$line a': { color: '#188FE9' },
    $blockquote: {
      backgroundColor: '#F9F9F9',
    },
    $codeblock: {
      backgroundColor: '#F9F9F9',
    },
  },
  { dark: false },
);

const darkTheme = EditorView.theme(
  {
    $$wrap: {
      backgroundColor: '#1E1E1E',
    },
    $content: { caretColor: '#188FE9' },
    $line: { color: '#E3E3E3' },
    '$line a': { color: '#188FE9' },
    $blockquote: {
      backgroundColor: '#464646',
    },
    $codeblock: {
      backgroundColor: '#464646',
    },
  },
  { dark: true },
);
