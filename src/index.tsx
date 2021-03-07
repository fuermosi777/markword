import { EditorState, Extension, tagExtension } from '@codemirror/next/state';
import { EditorView, keymap } from '@codemirror/next/view';
import { standardKeymap } from '@codemirror/next/commands';
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
import { defaultColor, darkColor } from './colorTheme';

const extensions = [
  wordmarkTheme(),
  listTask(),
  phraseEmphasis(),
  heading(),
  link(),
  image(),
  blockquote(),
  codeblock(),
  hr(),
  keymap.of(standardKeymap),
  webkit(),
  EditorView.lineWrapping,
];

type ThemeColor = 'Default' | 'Dark';

const urlParams = new URLSearchParams(window.location.search);
const themeFromUrl = urlParams.get('theme') as ThemeColor;
let color: Extension = themeFromUrl === 'Dark' ? darkColor() : defaultColor();
let colorThemeExtTag = Symbol();

// State when first start.
let startState = EditorState.create({
  extensions: makeExtensions(),
});

function makeExtensions() {
  return [...extensions, tagExtension(colorThemeExtTag, color)];
}

let view = new EditorView({
  state: startState,
  parent: document.getElementById('container')!,
});

function ClientUpdateDoc(doc: string) {
  view.setState(EditorState.create({ doc, extensions: makeExtensions() }));
}

function ClientUpdateTheme(name: ThemeColor) {
  if (name === 'Default') {
    color = defaultColor();
  } else if (name === 'Dark') {
    color = darkColor();
  }
  if (view) {
    view.dispatch({
      reconfigure: { [colorThemeExtTag]: color },
    });
  }
}

const _global = (window /* browser */ || global) /* node */ as any;
_global.ClientUpdateDoc = ClientUpdateDoc;
_global.ClientUpdateTheme = ClientUpdateTheme;
