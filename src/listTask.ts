import { Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  themeClass,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { eachLineMatchRe, isCursorInside } from './utils';

// An ordered list or unordered list. Starting with a dash, followed by a whitespace, and not followed by something like "[ ]", which is a task bullet.
const listRE = /^\s*([\*\-\+]|[0-9]+([.)]))\s(?!(?:\[.\]))(?![\*\-])/g;
const taskRE = /^\s*([*\-+])\s\[(x| )\]\s/g;

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
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations);
      }

      this.decorations = Decoration.set(decorations, true);

      this.decorations = this.decorations.update({
        filter: (from, to) => {
          if (update && isCursorInside(update, from, to, /*inclusive=*/ false)) {
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

      eachLineMatchRe(doc, from, to, listRE, (m, pos) => {
        let deco = Decoration.replace({ widget: new BulletWidget() });
        decorations.push(deco.range(pos + m.index, pos + m.index + m[0].length));
      });

      eachLineMatchRe(doc, from, to, taskRE, (m, pos) => {
        let deco = Decoration.replace({ widget: new CheckWidget(m[2] !== ' ', this.view) });
        decorations.push(deco.range(pos + m.index, pos + m.index + m[0].length));
      });
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class BulletWidget extends WidgetType {
  constructor(readonly order?: string) {
    super();
  }

  eq(other: BulletWidget) {
    return true;
  }

  toDOM() {
    let span = document.createElement('span');
    span.textContent = this.order ? this.order : '•';
    span.className = themeClass(`list-bullet`);
    span.style.marginRight = '5px';
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
    return this.checked === other.checked;
  }

  toDOM() {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = themeClass('checkbox');
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
  // '$list-bullet': { fontSize: '24px' },
  $checkbox: {
    border: '1px solid #C1C3C6',
    borderRadius: '4px',
    display: 'inline-block',
    marginRight: '5px',
    transition: 'all 0.2s',
    position: 'relative',
  },
});
