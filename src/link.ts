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

const linkRE = /\[([^\[\]]+)\]\(([^\)\(\s]+)(?:\s"([^\"]+)")?\)/g;
const autoLinkRE = /<(https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&//=]*)>/g;

export function link(): Extension {
  return [linkDecorationPlugin];
}

const linkDecorationPlugin = ViewPlugin.fromClass(
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

      for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          while ((m = linkRE.exec(cursor.value))) {
            // An edge case where link should not preappend a "!", otherwise it would be an image.
            if (m.input[m.index - 1] === '!') continue;
            const linkDecoration = Decoration.replace({
              widget: new LinkWidget({
                displayText: m[1],
                url: m[2],
                title: m[3],
              }),
              inclusive: true,
            });
            decorations.push(linkDecoration.range(pos + m.index, pos + m.index + m[0].length));
          }
        }
        pos += cursor.value.length;
      }

      for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          while ((m = autoLinkRE.exec(cursor.value))) {
            const linkDecoration = Decoration.replace({
              widget: new LinkWidget({
                displayText: m[1],
                url: m[1],
              }),
              inclusive: true,
            });
            decorations.push(linkDecoration.range(pos + m.index, pos + m.index + m[0].length));
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

interface LinkWidgetSpec {
  readonly displayText: string;
  readonly url?: string;
  readonly title?: string;
  // [an example][id] reference style link
  readonly ref?: string;
}

class LinkWidget extends WidgetType {
  constructor(readonly spec: LinkWidgetSpec) {
    super();
  }

  eq(other: LinkWidget) {
    return this.spec.displayText === other.spec.displayText && this.spec.url === other.spec.url;
  }

  toDOM() {
    let link = document.createElement('a');
    link.textContent = this.spec.displayText;
    if (this.spec.url) {
      link.href = this.spec.url;
    }
    if (this.spec.title) {
      link.title = this.spec.title;
    }
    return link;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
