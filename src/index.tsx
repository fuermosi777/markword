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

let startState = EditorState.create({
  extensions: [
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
    EditorView.lineWrapping,
  ],
});

let view = new EditorView({
  state: startState,
  parent: document.getElementById('container')!,
});
