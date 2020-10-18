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

//   const imageRE = /!\[([^\]]*)]\(([^)" ]+)(?: ("[^"=]+"))?(?: =(\d+)x?(\d*))?\)/g;
//   const linkRE = /\[([^\[\]]+)\]\([^\)\(]+\)/g;
//   const listRE = /([*\-+]|[0-9]+([.)]))\s/g;
//   const taskRE = /([*\-+]|[0-9]+([.)]))\s\[(x| )\]\s/g;
//   const tableRE = /^\|.*\|$/g;
// quote
// codeblock
// horizontal lines
// backslash escape
// auto link: <http://example.com/>

const headingRE = /^#{1,6}\s{1}/g;
const MaxHeadingLevel = 6;

const headingDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;
    headerDeco?: Decoration;

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
          if (
            update &&
            isCursorInside(update, from, to) &&
            // Only check cursor is in the header widget, ignore line decoration.
            this.headerDeco &&
            value.eq(this.headerDeco)
          ) {
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

      for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          while ((m = headingRE.exec(cursor.value))) {
            let level = (m[0].match(/#/g) || []).length;
            level = level > MaxHeadingLevel ? MaxHeadingLevel : level;

            this.headerDeco = Decoration.replace({
              widget: new HeaderIndicatorWidget(level),
              inclusive: true,
            });
            decorations.push(this.headerDeco.range(pos + m.index, pos + m.index + m[0].length));
            const heading = Decoration.line({
              attributes: {
                class: themeClass(`h${level}`),
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
