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
      backgroundColor: 'rgba(195,195,195,0.3)',
      borderRadius: '3px',
      padding: '2px',
    },
    '.cm-list-ol': {
      color: '#007AFF',
    },
    '.cm-bullet': {
      backgroundColor: '#007AFF',
    },
    '.cm-hr': {
      backgroundColor: '#CCC',
    },
    '.cmt-meta': {
      color: '#007AFF',
    },
    'cmt-labelName': {
      color: '#aaa',
    },
    '.cmt-url': {
      color: '#007AFF',
    },
    '.cmt-variableName': {
      color: '#fb7c3e',
    },
    '.cmt-keyword': {
      color: '#e83461',
    },
    '.cmt-number': {
      color: '#e0b128',
    },
    '.cmt-propertyName': {
      color: '#AC9CF2',
    },
    '.cmt-operator': {
      color: '#31b4c3',
    },
    '.cmt-comment': {
      color: '#ccc',
    },
    '.cmt-string': {
      color: '#62a521',
    },
    '.cmt-punctuation': {
      color: '#aaaaaa',
    },
    '.cm-front-matter-start *, .cm-front-matter-end *': {
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
      backgroundColor: '#2d2d2d',
    },
    '.cm-codeblock': {
      backgroundColor: '#2d2d2d',
    },
    '.cm-inline-code': {
      backgroundColor: 'rgba(195,195,195,0.15)',
      borderRadius: '3px',
      padding: '2px',
    },
    '.cm-list-li': {
      color: '#0B84FF',
    },
    '.cm-bullet': {
      backgroundColor: '#0B84FF',
    },
    '.cm-hr': {
      backgroundColor: '#505050',
    },
    '.cmt-meta': {
      color: '#0B84FF',
    },
    'cmt-labelName': {
      color: '#aaa',
    },
    '.cmt-url': {
      color: '#0B84FF',
    },
    '.cmt-variableName': {
      color: '#FC9867',
    },
    '.cmt-keyword': {
      color: '#FF6188',
    },
    '.cmt-number': {
      color: '#FFD866',
    },
    '.cmt-propertyName': {
      color: '#AC9CF2',
    },
    '.cmt-operator': {
      color: '#78DCE8',
    },
    '.cmt-comment': {
      color: '#5a5858',
    },
    '.cmt-string': {
      color: '#A8DC76',
    },
    '.cmt-punctuation': {
      color: '#aaaaaa',
    },
    '.cm-front-matter-start *, .cm-front-matter-end *': {
      color: '#0B84FF',
    },
  },
  { dark: true },
);
