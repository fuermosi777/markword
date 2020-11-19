import { Extension } from '@codemirror/next/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  themeClass,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/next/view';
import { EmptyWidget, isCursorInside } from './utils';
import { codeFontFamily } from './theme';

export function codeblock(): Extension {
  return [codeblockDecorationPlugin, baseTheme];
}

const codeblockRE = /^```([a-zA-Z]*)/;

const codeblockDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations);
      }
      decorations.sort((deco1, deco2) => (deco1.from > deco2.from ? 1 : -1));
      this.decorations = Decoration.set(decorations);

      this.decorations = this.decorations.update({
        filter: (from, to, value: Decoration) => {
          if (update && isCursorInside(update, from, to)) {
            return false;
          }

          return true;
        },
      });
    }

    update(update: ViewUpdate) {
      if (update.changes.length || update.viewportChanged) {
        this.recompute(update);
      }
    }

    getDecorationsFor(from: number, to: number, decorations: Range<Decoration>[]) {
      let { doc } = this.view.state;
      let insideCodeblock = false;

      // Need to run two rounds. First round is to identify the codeblock and add line class. The second round is to highlight identified code.
      for (let pos = from, cursor = doc.iterRange(from, to); !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let m = cursor.value.match(codeblockRE);
          if (m && !insideCodeblock) {
            // Start the codeblock.
            insideCodeblock = true;
            const deco = Decoration.replace({
              widget: new EmptyWidget(),
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + cursor.value.length));
          } else if (m && insideCodeblock) {
            insideCodeblock = false;
            const deco = Decoration.replace({
              widget: new EmptyWidget(), // TODO: add a new widget.
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + cursor.value.length));
          }
          if (m || insideCodeblock) {
            const heading = Decoration.line({
              attributes: {
                class: themeClass(`codeblock`),
              },
            });
            decorations.push(heading.range(pos));
          }
        }
        pos += cursor.value.length;
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class CodeblockStartWidget extends WidgetType {
  constructor(readonly language: string) {
    super();
  }

  eq(other: CodeblockStartWidget) {
    return false;
  }

  toDOM() {
    let span = document.createElement('span');
    span.textContent = this.language || '';
    span.className = themeClass(`codeblock-start`);
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  $codeblock: {
    backgroundColor: '#F9F9F9',
    paddingLeft: '10px',
    ...codeFontFamily,
  },
  '$codeblock-start': {
    backgroundColor: '#F3F3F3',
    borderRadius: '2px',
    border: '1px solid #D0D0D0',
    padding: '4px',
    fontSize: '10px',
  },
});
