import { EditorState, Extension } from '@codemirror/state';
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

// An ordered list or unordered list. Starting with a dash, followed by a whitespace, and not followed by something like "[ ]", which is a task bullet.
const listRE = /^(\s*)([\*\-\+])\s(?!(?:\[.\]))(?![\*\-])/;
const taskRE = /^\s*([*\-+])\s\[(x| )\]\s/;

export function listTask(): Extension {
  return [listTaskPlugin, baseTheme];
}

const listTaskPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      // let taskDecorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations);
      }

      this.decorations = Decoration.set(decorations, true);
      this.decorations = this.decorations.update({
        filter: (from, to, decor) => {
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

      for (let pos = from, iter = doc.iterRange(from, to); !iter.next().done; ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(listRE);
          if (m) {
            console.log(m);
            let deco = Decoration.replace({
              widget: new BulletWidget(),
              inclusive: true,
            });
            decorations.push(deco.range(pos + m[1].length, pos + m[1].length + m[2].length));
          }
        }
        pos += iter.value.length;
      }

      for (let pos = from, iter = doc.iterRange(from, to); !iter.next().done; ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(taskRE);
          if (m) {
            let checked = m[2] !== ' ';
            let deco = Decoration.replace({
              widget: new CheckWidget(checked, this.view),
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + m[0].length));
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

class BulletWidget extends WidgetType {
  constructor() {
    super();
  }

  eq(other: BulletWidget) {
    return false;
  }

  toDOM() {
    let span = document.createElement('span');
    span.className = 'cm-list-ul';

    let bullet = document.createElement('span');
    bullet.className = 'cm-bullet';

    span.appendChild(bullet);
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

class CheckWidget extends WidgetType {
  constructor(public checked: boolean, readonly view: EditorView) {
    super();
  }

  eq(other: CheckWidget) {
    return false;
  }

  toDOM() {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'cm-checkbox';
    if (this.checked) {
      cb.checked = true;
    }

    cb.addEventListener('mousedown', (e) => {
      const pos = this.view.posAtDOM(cb);
      if (!this.checked) {
        this.view.dispatch({
          changes: { from: pos + 3, to: pos + 4, insert: 'x' },
          // selection: { anchor: pos + 4 },
        });
      } else {
        this.view.dispatch({
          changes: { from: pos + 3, to: pos + 4, insert: ' ' },
        });
      }
    });
    return cb;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-list-ul': {
    width: '20px',
    verticalAlign: 'middle',
    display: 'inline-flex',
    justifyContent: 'center',
  },
  '.cm-bullet': {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  '.cm-checkbox': {
    border: '1px solid #C1C3C6',
    borderRadius: '4px',
    display: 'inline-block',
    marginRight: '15px',
    transition: 'all 0.2s',
    position: 'relative',
    verticalAlign: 'middle',
  },
});
