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

![image alt text](https://picsum.photos/200 "xtt") 

## Blockquotes

> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
> consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
> Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.
> 
> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
> id sem consectetuer libero luctus adipiscing.

*lazy mode*

> This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,
consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.
Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.

> Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse
id sem consectetuer libero luctus adipiscing.

\`\`\`javascript
var makeFunc = function() {
  return 3;
}
\`\`\`

`,
  extensions: [
    wordmarkTheme(),
    listTask(),
    phraseEmphasis(),
    heading(),
    link(),
    image(),
    blockquote(),
    codeblock(),
    keymap(defaultKeymap),
    EditorView.lineWrapping,
  ],
});

let view = new EditorView({
  state: startState,
  parent: document.getElementById('container')!,
});
