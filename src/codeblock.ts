import { Extension, Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { codeFontFamily } from './theme';
import { isCursorInside, Position } from './utils';

export function codeblock(): Extension {
  return [codeblockDecorationPlugin, baseTheme];
}

const codeblockRE = /^[`~]{3}([a-zA-Z]*)/;

const codeblockDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;
    content: string = '';

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      let lineDecorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        // Start from 0 because we want to make sure the ``` always starts from top to bottom to avoid a case when the ending indicator becomes the starting one.
        this.getDecorationsFor(0, to, decorations, lineDecorations, update);
      }
      this.decorations = Decoration.set(lineDecorations, true);

      this.decorations = this.decorations.update({
        add: decorations,
      });
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.recompute(update);
      }
    }

    addLineDecoration(
      className: string,
      decos: Range<Decoration>[],
      pos: number,
    ) {
      const heading = Decoration.line({
        attributes: {
          class: className,
        },
      });
      decos.push(heading.range(pos));
    }

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
      lineDecorations: Range<Decoration>[],
      update?: ViewUpdate,
    ) {
      let { doc } = this.view.state;
      let codePos: Position[] = [];

      for (
        let pos = from,
          iter = doc.iterRange(from, to),
          codeFrom = -1,
          insideCodeblock = false;
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(codeblockRE);
          if (m && !insideCodeblock) {
            // Start the codeblock.
            insideCodeblock = true;
            codeFrom = pos;
            this.addLineDecoration('cm-codeblock-start', lineDecorations, pos);

            this.content = '';
          } else if (m && insideCodeblock) {
            insideCodeblock = false;
            let lineLength = iter.value.length;
            codePos.push({ from: codeFrom, to: pos + lineLength });
            this.addLineDecoration('cm-codeblock-end', lineDecorations, pos);

            // Remove last line break from previous line.
            this.content = this.content.slice(0, -1);

            // Copy button.
            let deco = Decoration.replace({
              widget: new CopyCodeWidget(this.content),
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos));
          } else {
            this.content += iter.value + '\n';
          }
          if (m || insideCodeblock) {
            this.addLineDecoration('cm-codeblock', lineDecorations, pos);
          }
        } else if (insideCodeblock) {
          // For line breaks (empty lines), we also want to add line decoration.
          this.addLineDecoration('cm-codeblock', lineDecorations, pos);
        }
        pos += iter.value.length;
      }

      for (let cp of codePos) {
        let shouldHide = false;
        if (!update) {
          shouldHide = true;
        }
        if (update && !isCursorInside(update, cp.from, cp.to, true)) {
          shouldHide = true;
        }
        if (shouldHide) {
          this.addLineDecoration('cm-line-hidden', lineDecorations, cp.from);
          // 3 is the length of ``` or ~~~, to is the end position of the line so we need to minus 3 to get to the starting point of the line.
          this.addLineDecoration('cm-line-hidden', lineDecorations, cp.to - 3);
        }
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class CopyCodeWidget extends WidgetType {
  constructor(readonly text: string) {
    super();
  }

  eq(other: CopyCodeWidget) {
    return other.text == this.text;
  }

  toDOM() {
    let span = document.createElement('span');
    span.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
</svg>`;
    span.className = `cm-codeblock-copy`;
    span.addEventListener('mousedown', async () => {
      try {
        await navigator.clipboard.writeText(this.text);
        console.log('Copy successfully');
      } catch (err) {
        console.log('Copy failed');
      }
    });
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-codeblock': {
    paddingLeft: '10px',
    fontSize: '0.9em',
    ...codeFontFamily,
  },
  '.cm-codeblock-start': {
    borderTopLeftRadius: '0.4em',
    borderTopRightRadius: '0.4em',
  },
  '.cm-codeblock-end': {
    borderBottomLeftRadius: '0.4em',
    borderBottomRightRadius: '0.4em',
  },
  '.cm-codeblock-copy': {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '1.2em',
    display: 'inline-flex',
  },
  '.cm-codeblock-copy:hover': {
    opacity: 0.6,
    cursor: 'pointer',
  },
  '.cm-codeblock-copy rect,.cm-codeblock-copy path': {
    stroke: '#aaa',
  },
  // Hide code block front matters when blur.
  '.cm-line-hidden .tok-meta, .cm-line-hidden .tok-labelName': {
    opacity: 0,
  },
});
