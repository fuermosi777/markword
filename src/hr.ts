import { Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginField,
  Range,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { codeFontFamily } from './theme';
import { isCursorInside, Position } from './utils';

export function hr(): Extension {
  return [hrDecorationPlugin, baseTheme];
}

const hrRE = /^( ?[-_*]){3,} ?[\t]*$/;

const hrDecorationPlugin = ViewPlugin.fromClass(
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

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
      update?: ViewUpdate,
    ) {
      let { view } = this;
      let { doc } = view.state;
      let frontMatterPos: Position[] = [];

      for (
        let pos = from,
          iter = doc.iterRange(from, to),
          frontMatterFrom = -1,
          insideFrontMatter = false;
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          // Handle front matters
          if (pos === 0 && iter.value !== '---') break;
          if (pos === 0 && iter.value === '---') {
            insideFrontMatter = true;
            frontMatterFrom = pos;
            this.addLineDecoration('cm-front-matter-start', decorations, pos);
          }
          if (insideFrontMatter) {
            this.addLineDecoration('cm-front-matter', decorations, pos);
          }

          // Create horizontal lines.
          let m = iter.value.match(hrRE);
          if (m && !insideFrontMatter) {
            const hrDeco = Decoration.replace({
              widget: new HrIndicatorWidget(m[0]),
              inclusive: false,
            });
            decorations.push(hrDeco.range(pos, pos + m[0].length));
          }

          if (pos > 0 && iter.value === '---' && insideFrontMatter) {
            insideFrontMatter = false;
            frontMatterPos.push({
              from: frontMatterFrom,
              to: pos + iter.value.length,
            });
            this.addLineDecoration('cm-front-matter-end', decorations, pos);
          }
        }
        pos += iter.value.length;
      }

      for (let fp of frontMatterPos) {
        let shouldHide = false;
        if (!update) {
          shouldHide = true;
        }
        if (update && !isCursorInside(update, fp.from, fp.to, true)) {
          shouldHide = true;
        }
        if (shouldHide) {
          this.addLineDecoration('cm-line-hidden', decorations, fp.from);
          this.addLineDecoration('cm-line-hidden', decorations, fp.to - 3);
        }
      }
    }

    addLineDecoration(
      className: string,
      decos: Range<Decoration>[],
      pos: number,
    ) {
      const heading = Decoration.line({
        class: className,
      });
      decos.push(heading.range(pos));
    }
  },
  {
    decorations: (v) => v.decorations,
    provide: PluginField.atomicRanges.from((v) => v.decorations),
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
  '.cm-line-hidden': {
    display: 'none',
  },
  '.cm-front-matter .cmt-heading': {
    fontSize: '0.9em',
  },
});
