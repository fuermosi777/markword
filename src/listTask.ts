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

// An ordered list or unordered list. Starting with a dash, followed by a whitespace, and not followed by something like "[ ]", which is a task bullet.
export const ulistRE = /^(\s*)([\*\-\+]\s)(?!(?:\[.\]))(?![\*\-])/;
export const olistRE = /^(\s*)([0-9]+\.)\s/;
export const taskRE = /^(\s*)([*\-+]\s\[(x| )\]\s)/;

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
      let { doc } = this.view.state;

      for (
        let pos = from, iter = doc.iterRange(from, to);
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(ulistRE);
          if (m) {
            let deco = Decoration.replace({
              widget: new BulletWidget(),
              inclusive: true,
            });
            decorations.push(
              deco.range(pos + m[1].length, pos + m[1].length + m[2].length),
            );
          }
        }
        pos += iter.value.length;
      }

      for (
        let pos = from, iter = doc.iterRange(from, to);
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(taskRE);
          if (m) {
            let checked = m[3] !== ' ';
            let deco = Decoration.replace({
              widget: new CheckWidget(checked, this.view),
              inclusive: true,
            });
            decorations.push(
              deco.range(pos + m[1].length, pos + m[1].length + m[2].length),
            );
          }
        }
        pos += iter.value.length;
      }
    }
  },
  {
    decorations: (v) => v.decorations,
    provide: PluginField.atomicRanges.from((v) => v.decorations),
  },
);

class BulletWidget extends WidgetType {
  constructor() {
    super();
  }

  eq(other: BulletWidget) {
    return true;
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
    return this.checked === other.checked;
  }

  toDOM() {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'cm-checkbox';
    if (this.checked) {
      cb.checked = true;
    }

    const wrapper = document.createElement('span');
    wrapper.className = 'cm-checkbox-wrapper';
    wrapper.appendChild(cb);

    wrapper.addEventListener('mousedown', (e) => {
      const pos = this.view.posAtDOM(wrapper);
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
    return wrapper;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-list-ul': {
    width: '30px',
    verticalAlign: 'middle',
    display: 'inline-flex',
    justifyContent: 'center',
  },
  '.cm-bullet': {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
  },
  '.cm-checkbox-wrapper': {
    width: '30px',
    display: 'inline-flex',
    justifyContent: 'center',
  },
  '.cm-checkbox': {
    border: '1px solid #C1C3C6',
    borderRadius: '4px',
    display: 'inline-block',
    margin: '0',
    transition: 'all 0.2s',
    position: 'relative',
    verticalAlign: 'middle',
  },
});
