import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { standardKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import { defaultHighlightStyle, classHighlightStyle } from '@codemirror/highlight';
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
  markdown({
    defaultCodeLanguage: javascriptLanguage,
  }),
  defaultHighlightStyle,
  classHighlightStyle,

  keymap.of(standardKeymap),
  EditorView.lineWrapping,

  // listTask(),
  // phraseEmphasis(),
  // heading(),
  // link(),
  // image(),
  // blockquote(),
  // codeblock(),
  // hr(),

  webkit(),
];

type ThemeColor = 'Default' | 'Dark';

const urlParams = new URLSearchParams(window.location.search);
const themeFromUrl = urlParams.get('theme') as ThemeColor;
let color: Extension = themeFromUrl === 'Dark' ? darkColor() : defaultColor();
let colorThemeComp = new Compartment();
const colorThemeExtension = colorThemeComp.of(color);

// State when first start.
let startState = EditorState.create({
  extensions: makeExtensions(),
});

function makeExtensions() {
  return [...extensions, colorThemeExtension];
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
    view.state.update({ effects: colorThemeComp.reconfigure(color) });
  }
}

const _global = (window /* browser */ || global) /* node */ as any;
_global.ClientUpdateDoc = ClientUpdateDoc;
_global.ClientUpdateTheme = ClientUpdateTheme;
