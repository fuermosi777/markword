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
import { isCursorInside } from './utils';

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
        this.getDecorationsFor(from, to, decorations);
      }

      this.decorations = Decoration.set(decorations, true);
      this.decorations = this.decorations.update({
        filter: (from, to, value: Decoration) => {
          if (update && isCursorInside(update, from, to, false)) {
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

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
    ) {
      let { view } = this;
      let { doc } = view.state;
      let insideFrontMatter = false;

      for (
        let pos = from, iter = doc.iterRange(from, to);
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          // Handle front matters
          if (pos === 0 && iter.value !== '---') break;
          if (pos === 0 && iter.value === '---') {
            insideFrontMatter = true;
            this.addFrontMatterLineDecoration(
              'cm-front-matter-start',
              decorations,
              pos,
            );
          }
          if (insideFrontMatter) {
            this.addFrontMatterLineDecoration(
              'cm-front-matter',
              decorations,
              pos,
            );
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

          if (pos > 0 && iter.value === '---') {
            this.addFrontMatterLineDecoration(
              'cm-front-matter-end',
              decorations,
              pos,
            );
            insideFrontMatter = false;
          }
        }
        pos += iter.value.length;
      }
    }

    addFrontMatterLineDecoration(
      className: string,
      lineDecorations: Range<Decoration>[],
      pos: number,
    ) {
      const heading = Decoration.line({
        attributes: {
          class: className,
        },
      });
      lineDecorations.push(heading.range(pos));
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
    span.className = 'cm-hr';
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-hr': {
    width: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    height: '1p x',
    transform: 'translateY(10px)',
    verticalAlign: 'top',
  },
  '.cm-front-matter': {},
  '.cm-front-matter .cmt-heading': {
    fontSize: '1em',
    fontWeight: '400',
    fontStyle: 'italic',
  },
});
