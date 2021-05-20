import { Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { isCursorInside, isCursorInsideLine } from './utils';

export function heading(): Extension {
  return [headingDecorationPlugin, baseTheme];
}

const headingRE = /^#{1,6}\s{1}/;
const MaxHeadingLevel = 6;

// The plugin reads all lines and adds heading indicators widget (#) and line decorations.
const headingDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      let lineDecorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations, lineDecorations);
      }

      this.decorations = Decoration.set(decorations, true);

      this.decorations = this.decorations.update({
        // filter: (from, to, _: Decoration) => {
        //   if (update && isCursorInsideLine(update.state, from, to)) {
        //     return false;
        //   }

        //   return true;
        // },
        add: lineDecorations,
      });
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.recompute(update);
      }
    }

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
      lineDecorations: Range<Decoration>[],
    ) {
      let { state } = this.view;
      let { doc } = state;

      for (let pos = from, iter = doc.iterRange(from, to); !iter.next().done; ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(headingRE);
          if (m) {
            let level = (m[0].match(/#/g) || []).length;
            level = Math.min(level, MaxHeadingLevel);

            // If the cursor is inside the heading line, don't draw indicator widget.
            let lineLength = m.input?.length || 0;
            if (!isCursorInsideLine(state, pos, pos + lineLength)) {
              let deco = Decoration.replace({
                widget: new HeaderIndicatorWidget(level, m[0]),
                inclusive: true,
              });
              decorations.push(deco.range(pos, pos + m[0].length));
            }

            const heading = Decoration.line({
              attributes: {
                class: `cm-h${level}`,
              },
            });
            lineDecorations.push(heading.range(pos));
          }
        }
        pos += iter.value.length;
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class HeaderIndicatorWidget extends WidgetType {
  constructor(readonly level: number, readonly rawValue: string) {
    super();
  }

  eq(other: HeaderIndicatorWidget) {
    return other.rawValue == this.rawValue;
  }

  toDOM() {
    let span = document.createElement('span');
    span.className = `cm-h${this.level}-indicator`;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-h1': { fontSize: '24px' },
  '.cm-h1-indicator': { fontSize: '12px', color: '#6E6E6E' },
  '.cm-h2': { fontSize: '20px' },
  '.cm-h2-indicator': { fontSize: '12px', color: '#6E6E6E' },
  '.cm-3': { fontSize: '18px' },
  '.cm-3-indicator': { fontSize: '12px', color: '#6E6E6E' },
  '.cm-4': { fontSize: '16px' },
  '.cm-4-indicator': { fontSize: '12px', color: '#6E6E6E' },
  '.cm-5': { fontSize: '14px' },
  '.cm-5-indicator': { fontSize: '12px', color: '#6E6E6E' },
  '.cm-6': { fontSize: '14px' },
  '.cm-6-indicator': { fontSize: '12px', color: '#6E6E6E' },
  '.cmt-heading': { textDecoration: 'none' },
});
