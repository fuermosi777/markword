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
import { codeFontFamily } from './theme';
import { isCursorInside, Position } from './utils';

export function frontMatter(): Extension {
  return [frontMatterDecorationPlugin, baseTheme];
}

const frontMatterRE = /^[-]{3}/;
const hrRE = /^( ?[-_*]){3,} ?[\t]*$/;

const frontMatterDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations, update);
      }
      this.decorations = Decoration.set(decorations, true);
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
      update?: ViewUpdate,
    ) {
      let { doc } = this.view.state;
      let frontMatterPos: Position[] = [];

      for (
        let pos = from,
          iter = doc.iterRange(from, to),
          frontMatterFrom = -1,
          insideFrontMatter = false;
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(frontMatterRE);
          if (pos === 0 && m && !insideFrontMatter) {
            insideFrontMatter = true;
            frontMatterFrom = pos;
            this.addLineDecoration('cm-front-matter-start', decorations, pos);
          }
          if (insideFrontMatter) {
            this.addLineDecoration('cm-front-matter', decorations, pos);
          }

          // For horizontal lines.
          let n = iter.value.match(hrRE);
          if (n && !insideFrontMatter) {
            const hrDeco = Decoration.replace({
              widget: new HrIndicatorWidget(n[0]),
              inclusive: false,
            });
            decorations.push(hrDeco.range(pos, pos + n[0].length));
          }

          if (pos > 0 && m && insideFrontMatter) {
            insideFrontMatter = false;
            let lineLength = iter.value.length;
            frontMatterPos.push({
              from: frontMatterFrom,
              to: pos + lineLength,
            });
            this.addLineDecoration('cm-front-matter-end', decorations, pos);
            this.addLineDecoration('cm-front-matter', decorations, pos);
          }
        } else if (insideFrontMatter) {
          // For line breaks (empty lines), we also want to add line decoration.
          this.addLineDecoration('cm-front-matter', decorations, pos);
        }
        pos += iter.value.length;
      }

      for (let cp of frontMatterPos) {
        let shouldHide = false;
        if (!update) {
          shouldHide = true;
        }
        if (update && !isCursorInside(update, cp.from, cp.to, true)) {
          shouldHide = true;
        }
        if (shouldHide) {
          this.addLineDecoration('cm-line-hidden', decorations, cp.from);
          this.addLineDecoration('cm-line-hidden', decorations, cp.to - 3);
        }
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class HrIndicatorWidget extends WidgetType {
  constructor(readonly rawText: string) {
    super();
  }

  eq(other: HrIndicatorWidget) {
    return this.rawText === other.rawText;
  }

  toDOM() {
    let span = document.createElement('span');
    span.className = 'cm-hr-wrapper';
    let hr = document.createElement('span');
    hr.className = 'cm-hr';
    span.appendChild(hr);
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-hr-wrapper': {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    height: '1.4em', // Line height 23.5px / 16px.
  },
  '.cm-hr': {
    width: '100%',
    height: '1px',
  },

  '.cm-front-matter *': {
    ...codeFontFamily,
  },
  '.cm-front-matter .cmt-heading': {
    fontSize: '0.9em',
  },
  '.cm-front-matter-start': {
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
  },
  '.cm-front-matter-end': {
    borderBottomLeftRadius: '4px',
    borderBottomRightRadius: '4px',
  },
});
