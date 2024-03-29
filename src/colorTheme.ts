import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function lightColor(): Extension {
  return [lightTheme];
}

export function darkColor(): Extension {
  return [darkTheme];
}

const lightTheme = EditorView.theme(
  {
    '&.cm-editor': {
      backgroundColor: 'white',
    },
    '.cm-cursor': {
      borderColor: '#007AFF',
    },
    '&.cm-focused .cm-selectionBackground': {
      background: 'rgba(0,122,255, 0.3)',
    },
    '.cm-content': { caretColor: '#188FE9' },
    '.cm-h-indicator': { color: '#CCC' },
    '.cm-line': { color: '#1E1E1E' },
    '.cm-link': { color: '#007AFF' },
    '.cm-blockquote': {
      borderColor: '#007AFF',
    },
    '.cm-front-matter': {
      backgroundColor: 'rgba(240, 240, 240, 0.4)',
    },
    '.cm-codeblock': {
      backgroundColor: 'rgba(240, 240, 240, 0.4)',
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
    '.cmt-labelName': {
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
    '.cm-front-matter-start, .cm-front-matter-start *, .cm-front-matter-end *':
      {
        color: '#ccc',
      },
  },
  { dark: false },
);

const darkTheme = EditorView.theme(
  {
    '&.cm-editor': {
      backgroundColor: '#1E1E1E',
    },
    '.cm-cursor': {
      borderColor: '#0B84FF',
    },
    '&.cm-focused .cm-selectionBackground': {
      background: 'rgba(0,122,255, 0.3)',
    },
    '.cm-content': { caretColor: '#188FE9' },
    '.cm-h-indicator': { color: '#505050' },
    '.cm-line': { color: '#E3E3E3' },
    '.cm-link': { color: '#0B84FF' },
    '.cm-blockquote': {
      borderColor: '#0B84FF',
    },
    '.cm-front-matter': {
      backgroundColor: 'rgba(72, 72, 72, 0.4)',
    },
    '.cm-codeblock': {
      backgroundColor: 'rgba(72, 72, 72, 0.4)',
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
    '.cmt-labelName': {
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
    '.cm-front-matter-start, .cm-front-matter-start *, .cm-front-matter-end *':
      {
        color: '#5a5858',
      },
  },
  { dark: true },
);
