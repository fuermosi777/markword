import { EditorState } from '@codemirror/next/state';
import { EditorView, keymap } from '@codemirror/next/view';
import { defaultKeymap } from '@codemirror/next/commands';
import { phraseEmphasis } from './phraseEmphasis';
import './styles.less';
import { heading } from './heading';
import { wordmarkTheme } from './wordmarkTheme';
import { link } from './link';
import { listTask } from './listTask';
import { image } from './image';
import { blockquote } from './blockquote';
import { codeblock } from './codeblock';
import { hr } from './hr';
import { webkit } from './webkit';

let extensions = [
  wordmarkTheme(),
  listTask(),
  phraseEmphasis(),
  heading(),
  link(),
  image(),
  blockquote(),
  codeblock(),
  hr(),
  keymap(defaultKeymap),
  webkit(),
  EditorView.lineWrapping,
];

let startState = EditorState.create({
  extensions,
});

let view = new EditorView({
  state: startState,
  parent: document.getElementById('container')!,
});

function ClientUpdateDoc(doc: string) {
  view.setState(EditorState.create({ doc, extensions }));
}

const _global = (window /* browser */ || global) /* node */ as any;
_global.ClientUpdateDoc = ClientUpdateDoc;
