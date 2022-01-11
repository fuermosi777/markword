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

const hashSvg = require('./hash.svg') as string;

export function heading(): Extension {
  return [headingDecorationPlugin, baseTheme];
}

export const headingRE = /^#{1,6}\s{1}/;
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

            let deco = Decoration.replace({
              widget: new HeaderIndicatorWidget(level, m[0]),
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + m[0].length));

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
    this.level = Math.min(level, 3);
  }

  eq(other: HeaderIndicatorWidget) {
    return other.rawValue == this.rawValue;
  }

  toDOM() {
    let span = document.createElement('span');
    span.className = `cm-h-indicator cm-h${this.level}-indicator`;
    span.innerHTML = hashSvg;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  // For headings created by horizontal line below.
  '.cmt-heading': {
    textDecoration: 'none',
    fontWeight: 500,
    fontSize: `${24 / 16}em`,
  },
  // For headings starting with #
  '.cm-h1 *': { fontSize: `${28 / 16}em` },
  '.cm-h2 *': { fontSize: `${24 / 16}em` },
  '.cm-h3 *': { fontSize: `${18 / 16}em` },
  '.cm-h4 *': { fontSize: `${16 / 16}em` },
  '.cm-h5 *': { fontSize: `${14 / 16}em` },
  '.cm-h6 *': { fontSize: `${14 / 16}em` },
  // For indicators.
  '.cm-h-indicator': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '50px',
    position: 'absolute',
    top: '0',
    right: '100%',
    bottom: '0',
  },
  '.cm-h-indicator svg': {
    width: '60%',
    height: '60%',
  },
});
