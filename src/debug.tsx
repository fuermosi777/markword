import { defaultKeymap } from '@codemirror/next/commands';
import { EditorState } from '@codemirror/next/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  keymap,
  Range,
  themeClass,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/next/view';

const hrRE = /^( ?[-_*]){3,} ?[\t]*$/;

// A simple plugin replace "---" with a horizontal line.
const hrDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      console.log(1);
      let decorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations);
      }

      this.decorations = Decoration.set(decorations, true);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.recompute(update);
      }
    }

    getDecorationsFor(from: number, to: number, decorations: Range<Decoration>[]) {
      let { doc } = this.view.state;

      for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let m = cursor.value.match(hrRE);
          if (m) {
            const hrDeco = Decoration.replace({
              widget: new HrIndicatorWidget(),
              inclusive: true,
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

// A horizontal line widget.
class HrIndicatorWidget extends WidgetType {
  constructor() {
    super();
  }

  eq(other: HrIndicatorWidget) {
    return false;
  }

  toDOM() {
    let span = document.createElement('span');
    span.className = themeClass('hr');
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

// The CSS theme used to make <hr> looks like a horizontal line.
const hrTheme = EditorView.baseTheme({
  $hr: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    height: '1px',
    backgroundColor: '#ccc',
    transform: 'translateY(10px)',
  },
});

// Start the editor.
let view = new EditorView({
  state: EditorState.create({
    extensions: [keymap(defaultKeymap), hrDecorationPlugin, hrTheme],
  }),
  parent: document.getElementById('container')!,
});
