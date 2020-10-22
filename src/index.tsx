import { EditorState } from '@codemirror/next/state';
import { EditorView, keymap } from '@codemirror/next/view';
import { defaultKeymap } from '@codemirror/next/commands';
import { phraseEmphasis } from './phraseEmphasis';
import './styles.less';
import { heading } from './heading';
import { wordmarkTheme } from './wordmarkTheme';
import { link } from './link';
import { listTask } from './listTask';

let startState = EditorState.create({
  doc: `# Introduction

## Styles

Introducing markword -- a *italic* and **bold** styles. Insert some inline \`code\` is fine, such as \`var markword = function() { return true; }\`

and support the [external link](http://google.com "title") and <http://autolink.cc> and lists:

- Panda
- Banana
- Cat and *dog*

And to-do list!

- [ ] Buy bread
- [ ] Do yoga
- [ ] Repair the floor

`,
  extensions: [
    wordmarkTheme(),
    listTask(),
    phraseEmphasis(),
    heading(),
    link(),
    keymap(defaultKeymap),
  ],
});

let view = new EditorView({
  state: startState,
  parent: document.getElementById('container')!,
});
