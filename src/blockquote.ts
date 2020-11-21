import { Extension } from '@codemirror/next/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  themeClass,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/next/view';
import { EmptyWidget, isCursorInside } from './utils';

export function blockquote(): Extension {
  return [blockquoteDecorationPlugin, baseTheme];
}

const blockquoteRE = /^>\s{1}/;

const blockquoteDecorationPlugin = ViewPlugin.fromClass(
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
      this.decorations = Decoration.set(decorations, true);

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
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.recompute(update);
      }
    }

    getDecorationsFor(from: number, to: number, decorations: Range<Decoration>[]) {
      let { doc } = this.view.state;
      let insideBlockquote = false;
      let isLastLineBreak = false;

      for (let pos = from, cursor = doc.iterRange(from, to); !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let m = cursor.value.match(blockquoteRE);
          if (m) {
            insideBlockquote = true;
            let deco = Decoration.replace({
              widget: new EmptyWidget(),
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + m[0].length));
            const bq = Decoration.line({
              attributes: {
                class: themeClass(`blockquote`),
              },
            });
            decorations.push(bq.range(pos));
          } else if (insideBlockquote) {
            const bq = Decoration.line({
              attributes: {
                class: themeClass(`blockquote`),
              },
            });
            decorations.push(bq.range(pos));
          }
          isLastLineBreak = false;
        } else {
          if (isLastLineBreak) {
            insideBlockquote = false;
          }
          isLastLineBreak = true;
        }
        pos += cursor.value.length;
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

const baseTheme = EditorView.baseTheme({
  $blockquote: {
    backgroundColor: '#F9F9F9',
    paddingLeft: '10px',
    borderLeft: '4px solid gray',
  },
});
