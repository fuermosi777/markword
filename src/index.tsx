import './styles.less';

import { EditorState, Extension, Compartment } from '@codemirror/state';
import { EditorView, keymap } from '@codemirror/view';
import { standardKeymap } from '@codemirror/commands';
import { insertNewlineContinueList, spaceTabBinding } from './commands';
import { markdown } from '@codemirror/lang-markdown';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import {
  defaultHighlightStyle,
  classHighlightStyle,
} from '@codemirror/highlight';
import { phraseEmphasis } from './phraseEmphasis';
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
import { history, historyKeymap } from '@codemirror/history';

const extensions = [
  wordmarkTheme(),
  history(),
  keymap.of([
    spaceTabBinding,
    insertNewlineContinueList,
    ...standardKeymap,
    ...historyKeymap,
  ]),
  EditorView.lineWrapping,
  markdown({
    defaultCodeLanguage: javascriptLanguage,
    // Disable markdown keymaps.
    addKeymap: false,
  }),
  defaultHighlightStyle,
  classHighlightStyle,

  listTask(),
  phraseEmphasis(),
  heading(),
  link(),
  image(),
  blockquote(),
  codeblock(),
  hr(),

  webkit(),
];

type ThemeColor = 'Default' | 'Dark';

const urlParams = new URLSearchParams(window.location.search);
const themeFromUrl = urlParams.get('theme') as ThemeColor;
let color: Extension = themeFromUrl === 'Dark' ? darkColor() : defaultColor();

//https://discuss.codemirror.net/t/codemirror-next-0-18-0/2983
let colorThemeComp = new Compartment();
const colorThemeExtension = colorThemeComp.of(color);

// State when first start.
let startState = EditorState.create({
  doc: `# Welcome to WordMark

## Introduction

WordMark is a **WYSIWYG** and _lightweight_ [markdown](https://daringfireball.net/projects/markdown/) editor for macOS. It supports <http://google.com> links, and \`inline codes\`.

## Features

- Real time markdown render
- Publish to Github pages (Jekyll) and Medium
- Apple Silicon native support

1. Support ordered list
2. When Enter

---

- [ ] Panaba
- [x] Floor makeover

![photos](https://picsum.photos/200 =100x)

\`\`\`js
// This function is for demo purpose.
function fibonacci(n) {
  for (let i = 0; i < n.length; i++) {
    console.log("Fi: ", fibonacci(4));
  }
  return n < 1 ? 0 : n <= 2 ? 1 : fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

> Quotes
> Support
>
Multi line
`,
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
