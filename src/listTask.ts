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
import { eachLineMatchRe, isCursorInside } from './utils';

// An ordered list or unordered list. Starting with a dash, followed by a whitespace, and not followed by something like "[ ]", which is a task bullet.
const listRE = /^\s*([*\-+]|[0-9]+([.)]))\s(?!(?:\[.\]))/g;
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
      decorations.sort((deco1, deco2) => (deco1.from > deco2.from ? 1 : -1));
      this.decorations = Decoration.set(decorations);

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
      if (update.changes.length || update.viewportChanged) {
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
        let deco = Decoration.replace({ widget: new CheckWidget(m[2] !== ' ') });
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
    return false;
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
  constructor(readonly checked: boolean) {
    super();
  }

  eq(other: CheckWidget) {
    return false;
  }

  toDOM() {
    let cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = this.checked;
    return cb;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '$list-bullet': { fontSize: '24px' },
});
