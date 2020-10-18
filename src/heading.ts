import { Extension, StateField } from '@codemirror/next/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/next/view';

export function heading(): Extension {
  return [headingDecorationPlugin];
}

//   const imageRE = /!\[([^\]]*)]\(([^)" ]+)(?: ("[^"=]+"))?(?: =(\d+)x?(\d*))?\)/g;
//   const linkRE = /\[([^\[\]]+)\]\([^\)\(]+\)/g;
//   const listRE = /([*\-+]|[0-9]+([.)]))\s/g;
//   const taskRE = /([*\-+]|[0-9]+([.)]))\s\[(x| )\]\s/g;
//   const tableRE = /^\|.*\|$/g;

const headingRE = /^#{1,6}\s{1}/g;

const headingDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute() {
      let decorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations);
      }
      decorations.sort((deco1, deco2) => (deco1.from > deco2.from ? 1 : -1));
      this.decorations = Decoration.set(decorations);
    }

    update(update: ViewUpdate) {
      if (update.changes.length || update.viewportChanged) {
        this.recompute();
      }
    }

    getDecorationsFor(from: number, to: number, target: Range<Decoration>[]) {
      let { doc } = this.view.state;

      for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let headingIndicator = headingRE.exec(cursor.value);
          //   let heading = headingRE.exec(cursor.value);
          //   if (heading) {
          //     let deco = Decoration.mark({ class: 'wordmark-heading' });
          //     target.push(deco.range(pos + heading.index, pos + heading.index + heading[0].length));
          //   }
          if (headingIndicator) {
            let deco = Decoration.replace({
              widget: new HeaderIndicatorWidget(1),
              inclusive: true,
            });
            target.push(
              deco.range(
                pos + headingIndicator.index,
                pos + headingIndicator.index + headingIndicator[0].length,
              ),
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

class HeaderIndicatorWidget extends WidgetType {
  constructor(readonly level: number) {
    super();
  }

  eq(other: HeaderIndicatorWidget) {
    return other.level == this.level;
  }

  toDOM() {
    let span = document.createElement('span');
    span.textContent = 'H' + this.level;
    span.className = '';
    span.style.marginRight = '5px';
    return span;
  }

  ignoreEvent(): boolean {
    console.log(1);
    return false;
  }
}
