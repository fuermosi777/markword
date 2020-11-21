import { Extension } from '@codemirror/next/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/next/view';
import { isCursorInside } from './utils';
import * as assert from 'assert';

// TODO: reference style
// ![Alt text][id]
const imageRE = /!\[([^\[\]]*)\]\(([^\)\(\s]+)(?:\s"([^\"]+)")?\)/g;

export function image(): Extension {
  return [imageDecorationPlugin];
}

const imageDecorationPlugin = ViewPlugin.fromClass(
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
          if (update && isCursorInside(update, from, to, /* inclusive= */ false)) {
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

      for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          while ((m = imageRE.exec(cursor.value))) {
            const linkDecoration = Decoration.replace({
              widget: new ImageWidget({
                altText: m[1],
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
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

interface ImageWidgetSpec {
  readonly altText?: string;
  readonly url?: string;
  readonly title?: string;
  // ![Alt text][id] reference style link
  readonly ref?: string;
}

class ImageWidget extends WidgetType {
  constructor(readonly spec: ImageWidgetSpec) {
    super();
    assert.ok(spec.url || spec.ref);
  }

  eq(other: ImageWidget) {
    return (
      this.spec.altText === other.spec.altText &&
      this.spec.title === other.spec.title &&
      this.spec.ref === other.spec.ref
    );
  }

  toDOM() {
    let image = document.createElement('img');
    if (this.spec.url) {
      image.src = this.spec.url;
    }
    if (this.spec.title) {
      image.title = this.spec.title;
    }
    image.addEventListener('loadstart', function (e) {
      console.log('Image load started');
    });
    image.addEventListener('loadend', function (e) {
      console.log('Image load finished');
    });
    return image;
  }

  ignoreEvent(): boolean {
    return false;
  }
}
