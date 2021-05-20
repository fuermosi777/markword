import { Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  Range,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';
import { isCursorInside } from './utils';
import { codeFontFamily } from './theme';

export function codeblock(): Extension {
  return [codeblockDecorationPlugin, baseTheme];
}

const codeblockRE = /^```([a-zA-Z]*)/;

const codeblockDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      let lineDecorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        this.getDecorationsFor(from, to, decorations, lineDecorations);
      }
      this.decorations = Decoration.set(decorations, true);

      this.decorations = this.decorations.update({
        add: lineDecorations,
      });
    }

    update(update: ViewUpdate) {
      if (update.changes.length || update.viewportChanged) {
        this.recompute(update);
      }
    }

    addLineDecoration(className: string, lineDecorations: Range<Decoration>[], pos: number) {
      const heading = Decoration.line({
        attributes: {
          class: className,
        },
      });
      lineDecorations.push(heading.range(pos));
    }

    getDecorationsFor(
      from: number,
      to: number,
      decorations: Range<Decoration>[],
      lineDecorations: Range<Decoration>[],
    ) {
      let { doc } = this.view.state;
      let insideCodeblock = false;

      // Need to run two rounds. First round is to identify the codeblock and add line class. The second round is to highlight identified code.
      for (let pos = from, cursor = doc.iterRange(from, to); !cursor.next().done; ) {
        if (!cursor.lineBreak) {
          let m = cursor.value.match(codeblockRE);
          if (m && !insideCodeblock) {
            // Start the codeblock.
            insideCodeblock = true;
            const deco = Decoration.mark({
              class: 'cm-codeblock-indicator',
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + cursor.value.length));
            this.addLineDecoration('cm-codeblock-start', lineDecorations, pos);
          } else if (m && insideCodeblock) {
            insideCodeblock = false;
            const deco = Decoration.mark({
              class: 'cm-codeblock-indicator',
              inclusive: true,
            });
            decorations.push(deco.range(pos, pos + cursor.value.length));
            this.addLineDecoration('cm-codeblock-end', lineDecorations, pos);
          }
          if (m || insideCodeblock) {
            this.addLineDecoration('cm-codeblock', lineDecorations, pos);
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

const baseTheme = EditorView.baseTheme({
  '.cm-codeblock': {
    paddingLeft: '10px',
    ...codeFontFamily,
  },
  '.cm-codeblock-start': {
    borderTopLeftRadius: '6px',
    borderTopRightRadius: '6px',
  },
  '.cm-codeblock-end': {
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
  },
  '.cm-codeblock-indicator': {
    color: '#CCC',
  },
});
