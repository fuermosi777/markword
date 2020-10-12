import { EditorState } from '@codemirror/next/state';
import { EditorView, keymap } from '@codemirror/next/view';
import { defaultKeymap } from '@codemirror/next/commands';
import { phraseEmphasis } from './phraseEmphasis';
import './styles.less';
import { heading } from './heading';

let startState = EditorState.create({
  doc: '',
  extensions: [phraseEmphasis(), keymap(defaultKeymap)],
});

let view = new EditorView({
  state: startState,
  parent: document.getElementById('container')!,
});
