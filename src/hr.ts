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

    getDecorationsFor(from: number, to: number, decorations: Range<Decoration>[]) {
      let { doc } = this.view.state;

      for (let pos = from, cursor = doc.iterRange(from, to); !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let m = cursor.value.match(hrRE);
          if (m) {
            const hrDeco = Decoration.replace({
              widget: new HrIndicatorWidget(m[0]),
              inclusive: false,
            });
            decorations.push(hrDeco.range(pos, pos + m[0].length));
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
    display: 'flex',
    alignItems: 'center',
    height: '1px',
    backgroundColor: '#ccc',
    transform: 'translateY(10px)',
  },
});
