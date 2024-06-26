import { EditorSelection, Extension, Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { isCursorInside } from './utils';

const linkRE = /\[([^\[\]]+)\]\(([^\)\(\s]+)(?:\s"([^\"]+)")?\)/g;
const autoLinkRE =
  /<(https?:\/\/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)>/g;

export function link(): Extension {
  return [linkDecorationPlugin, baseTheme];
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

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
    ) {
      let { doc } = this.view.state;

      // For general link [name](url)
      for (
        let pos = from, cursor = doc.iterRange(from, to), m;
        !cursor.next().done;

      ) {
        if (!cursor.lineBreak) {
          while ((m = linkRE.exec(cursor.value))) {
            // An edge case where link should not preappend a "!", otherwise it would be an image.
            if (m.input[m.index - 1] === '!') continue;
            // On click move cursor inside link to expand it, the position is the starting position + 1;
            let cursorPos = pos + m.index + 1;
            const linkDecoration = Decoration.replace({
              widget: new LinkWidget(
                {
                  displayText: m[1],
                  url: m[2],
                  title: m[3],
                },
                () => {
                  this.view.dispatch({
                    selection: EditorSelection.cursor(cursorPos),
                  });
                },
              ),
              inclusive: true,
            });
            decorations.push(
              linkDecoration.range(pos + m.index, pos + m.index + m[0].length),
            );
          }
        }
        pos += cursor.value.length;
      }

      // For auto link <url>
      for (
        let pos = from, cursor = doc.iterRange(from, to), m;
        !cursor.next().done;

      ) {
        if (!cursor.lineBreak) {
          while ((m = autoLinkRE.exec(cursor.value))) {
            let cursorPos = pos + m.index + 1;
            const linkDecoration = Decoration.replace({
              widget: new LinkWidget(
                {
                  displayText: m[1],
                  url: m[1],
                },
                () => {
                  this.view.dispatch({
                    selection: EditorSelection.cursor(cursorPos),
                  });
                },
              ),
              inclusive: true,
            });
            decorations.push(
              linkDecoration.range(pos + m.index, pos + m.index + m[0].length),
            );
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
  constructor(readonly spec: LinkWidgetSpec, public onClick: () => void) {
    super();
  }

  eq(other: LinkWidget) {
    return (
      this.spec.displayText === other.spec.displayText &&
      this.spec.url === other.spec.url
    );
  }

  toDOM() {
    let link = document.createElement('span');
    link.className = 'cm-link';
    link.textContent = this.spec.displayText;
    if (this.spec.title) {
      link.title = this.spec.title;
    }
    link.addEventListener('mousedown', (e) => {
      if (!e.metaKey) {
        this.onClick();
        return;
      }
      let webkit = (<any>window).webkit;
      if (webkit) {
        webkit.messageHandlers.RequestURL.postMessage(this.spec.url);
      }
    });
    return link;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-link': {
    cursor: 'pointer',
  },
});
