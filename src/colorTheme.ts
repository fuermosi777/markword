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
    '&.cm-wrap': {
      backgroundColor: 'white',
    },
    '.cm-content': { caretColor: '#188FE9' },
    '.cm-line': { color: '#1E1E1E' },
    '.cm-link': { color: '#007AFF' },
    '.cm-blockquote': {
      backgroundColor: '#F9F9F9',
    },
    '.cm-codeblock': {
      backgroundColor: '#F9F9F9',
    },
    '.cm-inline-code': {
      backgroundColor: 'rgba(255,255,255,0.15)',
      padding: '1px',
    },
    '.cm-list-ol': {
      color: '#007AFF',
    },
    '.cm-bullet': {
      backgroundColor: '#007AFF',
    },
    '.cmt-meta': {
      color: '#007AFF',
    },
    '.cmt-url': {
      color: '#007AFF',
    },
  },
  { dark: false },
);

const darkTheme = EditorView.theme(
  {
    '&.cm-wrap': {
      backgroundColor: '#1E1E1E',
    },
    '.cm-content': { caretColor: '#188FE9' },
    '.cm-line': { color: '#E3E3E3' },
    '.cm-link': { color: '#0B84FF' },
    '.cm-blockquote': {
      backgroundColor: '#464646',
    },
    '.cm-codeblock': {
      backgroundColor: '#464646',
    },
    '.cm-inline-code': {
      backgroundColor: 'rgba(255,255,255,0.15)',
      padding: '1px',
    },
    '.cm-list-li': {
      color: '#0B84FF',
    },
    '.cm-bullet': {
      backgroundColor: '#0B84FF',
    },
    '.cmt-meta': {
      color: '#0B84FF',
    },
    '.cmt-url': {
      color: '#0B84FF',
    },
  },
  { dark: true },
);
