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
import { isCursorInsideLine } from './utils';

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

      for (
        let pos = from, iter = doc.iterRange(from, to);
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(headingRE);
          if (m) {
            let level = (m[0].match(/#/g) || []).length;
            level = Math.min(level, MaxHeadingLevel);

            // If the cursor is inside the heading line, don't draw indicator widget.
            let lineLength = iter.value.length;
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
  '.cmt-heading': { textDecoration: 'none', fontWeight: 500, fontSize: '24px' },
  '.cm-h1 .cmt-heading': { fontSize: '28px' },
  '.cm-h2 .cmt-heading': { fontSize: '24px' },
  '.cm-h3 .cmt-heading': { fontSize: '18px' },
  '.cm-h4 .cmt-heading': { fontSize: '16px' },
  '.cm-h5 .cmt-heading': { fontSize: '14px' },
  '.cm-h6 .cmt-heading': { fontSize: '14px' },
});
