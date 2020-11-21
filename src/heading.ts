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
import { isCursorInside } from './utils';

export function heading(): Extension {
  return [headingDecorationPlugin, baseTheme];
}

const headingRE = /^#{1,6}\s{1}/;
const MaxHeadingLevel = 6;

const headingDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;
    lineDecorations: DecorationSet = Decoration.none;

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
        filter: (from, to, value: Decoration) => {
          if (update && isCursorInside(update, from, to)) {
            return false;
          }

          return true;
        },
        add: lineDecorations,
      });
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.recompute(update);
      }
    }

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
      lineDecorations: Range<Decoration>[],
    ) {
      let { doc } = this.view.state;

      for (let pos = from, cursor = doc.iterRange(from, to); !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let m = cursor.value.match(headingRE);
          if (m) {
            let level = (m[0].match(/#/g) || []).length;
            level = level > MaxHeadingLevel ? MaxHeadingLevel : level;

            let deco = Decoration.replace({
              widget: new HeaderIndicatorWidget(level),
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + m[0].length));

            const heading = Decoration.line({
              attributes: {
                class: themeClass(`h${level}`),
              },
            });
            lineDecorations.push(heading.range(pos));
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

class HeaderIndicatorWidget extends WidgetType {
  constructor(readonly level: number) {
    super();
  }

  eq(other: HeaderIndicatorWidget) {
    return other.level == this.level;
  }

  toDOM() {
    let span = document.createElement('span');
    span.textContent = 'H' + this.level;
    span.className = themeClass(`h${this.level}-indicator`);
    span.style.marginRight = '5px';
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  $h1: { fontSize: '24px' },
  '$h1-indicator': { fontSize: '12px', color: '#6E6E6E' },
  $h2: { fontSize: '20px' },
  '$h2-indicator': { fontSize: '12px', color: '#6E6E6E' },
  $h3: { fontSize: '18px' },
  '$h3-indicator': { fontSize: '12px', color: '#6E6E6E' },
  $h4: { fontSize: '16px' },
  '$h4-indicator': { fontSize: '12px', color: '#6E6E6E' },
  $h5: { fontSize: '14px' },
  '$h5-indicator': { fontSize: '12px', color: '#6E6E6E' },
  $h6: { fontSize: '14px' },
  '$h6-indicator': { fontSize: '12px', color: '#6E6E6E' },
});
