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

// TODO: reference style
// ![Alt text][id]
const imageRE =
  /!\[([^\[\]]*)\]\(([^\)\(\s]+)(?:\s"([^\"]+)")?(?:\s=(\d+x\d*))?\)/g;

export function image(): Extension {
  return [imageDecorationPlugin, baseTheme];
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
          if (
            update &&
            isCursorInside(update, from, to, /* inclusive= */ false)
          ) {
            return false;
          }

          return true;
        },
      });
    }

    update(update: ViewUpdate) {
      if (update.viewportChanged) {
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
        let pos = from, cursor = doc.iterRange(from, to), m;
        !cursor.next().done;

      ) {
        if (!cursor.lineBreak) {
          while ((m = imageRE.exec(cursor.value))) {
            const linkDecoration = Decoration.replace({
              widget: new ImageWidget({
                altText: m[1],
                url: m[2],
                title: m[3],
                size: m[4],
              }),
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

interface ImageWidgetSpec {
  readonly altText?: string;
  readonly url?: string;
  readonly title?: string;
  // Could be 30x (only width) or 30x30 (width x height)
  readonly size?: string;
  // ![Alt text][id] reference style link
  readonly ref?: string;
}

class ImageWidget extends WidgetType {
  constructor(readonly spec: ImageWidgetSpec) {
    super();
  }

  eq(other: ImageWidget) {
    return (
      this.spec.altText === other.spec.altText &&
      this.spec.title === other.spec.title &&
      this.spec.ref === other.spec.ref &&
      this.spec.size === other.spec.size
    );
  }

  toDOM() {
    let image = document.createElement('img');
    image.className = 'cm-image';
    image.style.cursor = 'pointer';
    if (this.spec.url) {
      image.src = this.spec.url;
    }
    if (this.spec.title) {
      image.title = this.spec.title;
    }
    if (this.spec.size) {
      let [width, height] = this.spec.size.split('x');
      image.width = Number(width);
      if (!height) {
        height = width;
      }
      image.height = Number(height);
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

const baseTheme = EditorView.baseTheme({
  '.cm-image': {
    maxWidth: '100%',
  },
});
