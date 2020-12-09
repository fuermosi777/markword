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

      // Not used due to lack of widget.
      // this.decorations = this.decorations.update({
      //   filter: (from, to, value: Decoration) => {
      //     if (update && isCursorInside(update, from, to, false)) {
      //       return false;
      //     }

      //     return true;
      //   },
      // });
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
            const hrDeco = Decoration.mark({
              class: themeClass('hr'),
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

// Not used due to https://github.com/codemirror/codemirror.next/issues/340
// class HrIndicatorWidget extends WidgetType {
//   constructor() {
//     super();
//   }

//   eq(other: HrIndicatorWidget) {
//     return false;
//   }

//   toDOM() {
//     let span = document.createElement('span');
//     span.className = themeClass('hr');
//     return span;
//   }

//   ignoreEvent(): boolean {
//     return false;
//   }
// }

const baseTheme = EditorView.baseTheme({
  $hr: {
    color: '#ccc',
  },
});
