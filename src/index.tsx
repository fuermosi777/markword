import './styles.less';

import {
  EditorState,
  Extension,
  Compartment,
  EditorSelection,
} from '@codemirror/state';
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
} from '@codemirror/view';
import { standardKeymap } from '@codemirror/commands';
import { insertNewlineContinueList, spaceTabBinding } from './commands';
import { markdown } from '@codemirror/lang-markdown';
import { javascriptLanguage } from '@codemirror/lang-javascript';
import {
  classHighlightStyle,
  defaultHighlightStyle,
} from '@codemirror/highlight';
import { phraseEmphasis } from './phraseEmphasis';
import { heading, headingRE } from './heading';
import { wordmarkTheme } from './wordmarkTheme';
import { link } from './link';
import { listTask } from './listTask';
import { image } from './image';
import { blockquote } from './blockquote';
import { codeblock } from './codeblock';
import { webkitPlugins } from './webkit';
import { lightColor, darkColor } from './colorTheme';
import { history, historyKeymap } from '@codemirror/history';
import { hideActiveLine, showActiveLine } from './activeLine';
import { fontSize } from './fontTheme';
import { frontMatter } from './frontMatter';
import { fontFamily } from './fontTheme';

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
  EditorView.contentAttributes.of({ spellcheck: 'true' }),
  drawSelection(),

  listTask(),
  phraseEmphasis(),
  heading(),
  link(),
  image(),
  blockquote(),
  codeblock(),
  frontMatter(),

  // This must be after hr as otherwise it will alter the class names.
  highlightActiveLine(),

  webkitPlugins(),
];

// If empty string then it's just follow system.
type ThemeColor = '' | 'Light' | 'Dark';

//https://discuss.codemirror.net/t/codemirror-next-0-18-0/2983
let colorThemeComp = new Compartment();
const colorThemeExtension = colorThemeComp.of(getColor());

let activeLineComp = new Compartment();
const activeLineExtension = activeLineComp.of(showActiveLine());

let fontSizeComp = new Compartment();
const fontSizeExtension = fontSizeComp.of(fontSize(16));

let fontFamilyComp = new Compartment();
const fontFamilyExtension = fontFamilyComp.of(fontFamily());

// State for debugging.
let debugState = EditorState.create({
  doc: `---
layout: post
categories: [intro, admin]
---

# Welcome to WordMark

## Introduction

WordMark is a **WYSIWYG** *and* _lightweight_ [markdown](https://daringfireball.net/projects/markdown/) editor for macOS. It ~~doesn't~~ supports <http://google.com> links, and \`inline codes\`.

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
> Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.

### Heading 3 is possible 

#### Heading 4 

###### Heading 6 Is also possible
`,
  extensions: makeExtensions(),
});

// Get color theme based on current environment.
// If name is given, use it. Otherwise respect the name from URL params.
// Otherwise respect system appearance.
function getColor(name?: ThemeColor): Extension {
  if (name) {
    return name === 'Dark' ? darkColor() : lightColor();
  }
  // Override if forced set in the url params.
  // This is for testing purpose, shouldn't be used by the client.
  const urlParams = new URLSearchParams(window.location.search);
  const themeFromUrl = urlParams.get('theme') as ThemeColor;
  if (themeFromUrl) {
    return themeFromUrl === 'Dark' ? darkColor() : lightColor();
  }
  // If color is not given, and doesn't in url, just respect system.
  let color = lightColor();
  if (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    color = darkColor();
  }

  return color;
}

function makeExtensions() {
  return [
    ...extensions,
    colorThemeExtension,
    activeLineExtension,
    fontSizeExtension,
    fontFamilyExtension,
  ];
}

// https://stackoverflow.com/a/64752311
function decodeBase64(base64: string) {
  const text = window.atob(base64);
  const length = text.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = text.charCodeAt(i);
  }
  const decoder = new TextDecoder(); // default is utf-8
  return decoder.decode(bytes);
}

let view: EditorView;

window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', (event) => {
    if (event.matches) {
      ClientUpdateTheme('Dark');
    } else {
      ClientUpdateTheme('Light');
    }
  });

if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  view = new EditorView({
    state: debugState,
    parent: document.getElementById('container')!,
  });
}

// Start a new editor with base64 encoded content.
function ClientInitEditor(doc: string) {
  if (view) {
    view.destroy();
  }
  view = new EditorView({
    state: EditorState.create({
      doc: decodeBase64(doc),
      extensions: makeExtensions(),
    }),
    parent: document.getElementById('container')!,
  });
}

// Update the content with new base64 encoded content.
function ClientUpdateContent(doc: string) {
  if (view) {
    view.dispatch({
      changes: { from: 0, insert: decodeBase64(doc) },
    });
  }
}

// Updates the theme for the editor.
function ClientUpdateTheme(name: ThemeColor) {
  if (view) {
    view.dispatch({
      effects: colorThemeComp.reconfigure(getColor(name)),
    });
  }
}

function ClientUpdateFontSize(value: number) {
  if (view) {
    view.dispatch({
      effects: fontSizeComp.reconfigure(fontSize(value)),
    });
  }
}

function ClientUpdateFont(name: string) {
  if (view) {
    view.dispatch({
      effects: fontFamilyComp.reconfigure(fontFamily(name)),
    });
  }
}

function ClientToggleActiveLine(on: boolean) {
  if (view) {
    view.dispatch({
      effects: activeLineComp.reconfigure(
        on ? showActiveLine() : hideActiveLine(),
      ),
    });
  }
}

function ClientToggleHeading(heading: number) {
  if (view) {
    view.dispatch(
      view.state.changeByRange((range) => {
        let line = view.state.doc.lineAt(range.from);
        let changes = [];

        // First remove #s is there are.
        let removed = line.text.replace(headingRE, '');
        changes.push({ from: line.from, to: line.to, insert: removed });

        let added = Array(heading + 1).join('#') + ' ';
        changes.push({ from: line.from, insert: added });
        return {
          changes,
          range: EditorSelection.range(range.from, range.to),
        };
      }),
    );
  }
}

// TODO: add remove inline format.
function ClientToggleInlineFormat(indicators: string) {
  if (view) {
    view.dispatch(
      view.state.changeByRange((range) => {
        return {
          changes: [
            { from: range.from, insert: indicators },
            { from: range.to, insert: indicators },
          ],
          range: EditorSelection.range(
            range.from,
            range.to + indicators.length * 2,
          ),
        };
      }),
    );
  }
}

// For example, insert "**" and move cursor inbetween two *.
function ClientInsert(text: string, offset = 0) {
  if (view) {
    view.dispatch(
      view.state.changeByRange((range) => {
        return {
          changes: [{ from: range.from, insert: text }],
          range: EditorSelection.range(
            range.from + text.length - offset,
            range.from + text.length - offset,
          ),
        };
      }),
    );
  }
}

const _global = (window /* browser */ || global) /* node */ as any;
_global.ClientInitEditor = ClientInitEditor;
_global.ClientUpdateContent = ClientUpdateContent;
_global.ClientToggleActiveLine = ClientToggleActiveLine;
_global.ClientUpdateFontSize = ClientUpdateFontSize;
_global.ClientUpdateFont = ClientUpdateFont;
_global.ClientToggleHeading = ClientToggleHeading;
_global.ClientToggleInlineFormat = ClientToggleInlineFormat;
_global.ClientInsert = ClientInsert;

// @ts-ignore
const webkit = window.webkit;
if (webkit) {
  webkit.messageHandlers.Loaded.postMessage('');
}
