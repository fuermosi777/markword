import { ChangeDesc, Extension, StateEffect, StateField } from '@codemirror/next/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/next/view';

export function phraseEmphasis(): Extension {
  return [phraseEmphasisDecorationPlugin];
}

const emphasisRE = {
  bold: [/(?<!\*)\*\*([^\*]+?)\*\*(?!\*)/g, /(?<!_)__([^_]+?)__(?!_)/g],
  italic: [/(?<!\*)\*([^\*]+?)\*(?!\*)/g, /(?<!_)_([^_]+?)_(?!_)/g],
};

type NoValueRange = { from: number; to: number };

function mapRange(range: NoValueRange, mapping: ChangeDesc) {
  let from = mapping.mapPos(range.from, 1),
    to = mapping.mapPos(range.to, -1);
  return from >= to ? undefined : { from, to };
}

const boldEffect = StateEffect.define<NoValueRange>({ map: mapRange });

const emphasisState = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(value, tr) {
    if (tr.selection) {
      let onSelection = false,
        { head } = tr.selection.primary;
      console.log(head);
    }
    return value;
  },
});

const phraseEmphasisDecorationPlugin = ViewPlugin.fromClass(
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
        filter: (from, to) => {
          if (update) {
            let latestTr = update.transactions[update.transactions.length - 1];
            if (latestTr && latestTr.selection) {
              if (
                latestTr.selection.primary.head >= from &&
                latestTr.selection.primary.head <= to
              ) {
                return false;
              }
            }
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

      for (const r of emphasisRE.bold) {
        for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
          if (!cursor.lineBreak) {
            while ((m = r.exec(cursor.value))) {
              let deco = Decoration.replace({ widget: new BoldWidget(m[0], m[1]) });
              decorations.push(deco.range(pos + m.index, pos + m.index + m[0].length));
            }
          }
          pos += cursor.value.length;
        }
      }

      for (const r of emphasisRE.italic) {
        for (let pos = from, cursor = doc.iterRange(from, to), m; !cursor.next().done; ) {
          if (!cursor.lineBreak) {
            while ((m = r.exec(cursor.value))) {
              let deco = Decoration.mark({ class: 'wordmark-italic' });
              decorations.push(deco.range(pos + m.index, pos + m.index + m[0].length));
            }
          }
          pos += cursor.value.length;
        }
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class BoldWidget extends WidgetType {
  constructor(readonly rawValue: string, readonly visibleValue: string) {
    super();
  }
  eq(other: BoldWidget) {
    return this.rawValue === other.rawValue;
  }
  toDOM() {
    let span = document.createElement('span');
    span.textContent = this.visibleValue;
    span.style.fontWeight = 'bold';
    return span;
  }

  ignoreEvent() {
    return false;
  }
}
