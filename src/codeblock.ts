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
import { codeFontFamily } from './theme';
import { isCursorInside, Position } from './utils';

export function codeblock(): Extension {
  return [codeblockDecorationPlugin, baseTheme];
}

const codeblockRE = /^[`~]{3}([a-zA-Z]*)/;

const codeblockDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let lineDecorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        // Start from 0 because we want to make sure the ``` always starts from top to bottom to avoid a case when the ending indicator becomes the starting one.
        this.getDecorationsFor(0, to, lineDecorations, update);
      }
      this.decorations = Decoration.set(lineDecorations, true);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.recompute(update);
      }
    }

    addLineDecoration(
      className: string,
      decos: Range<Decoration>[],
      pos: number,
    ) {
      const heading = Decoration.line({
        attributes: {
          class: className,
        },
      });
      decos.push(heading.range(pos));
    }

    getDecorationsFor(
      from: number,
      to: number,
      lineDecorations: Range<Decoration>[],
      update?: ViewUpdate,
    ) {
      let { doc } = this.view.state;
      let codePos: Position[] = [];

      for (
        let pos = from,
          iter = doc.iterRange(from, to),
          codeFrom = -1,
          insideCodeblock = false;
        !iter.next().done;

      ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(codeblockRE);
          if (m && !insideCodeblock) {
            // Start the codeblock.
            insideCodeblock = true;
            codeFrom = pos;
            this.addLineDecoration('cm-codeblock-start', lineDecorations, pos);
          } else if (m && insideCodeblock) {
            insideCodeblock = false;
            let lineLength = iter.value.length;
            codePos.push({ from: codeFrom, to: pos + lineLength });
            this.addLineDecoration('cm-codeblock-end', lineDecorations, pos);
          }
          if (m || insideCodeblock) {
            this.addLineDecoration('cm-codeblock', lineDecorations, pos);
          }
        } else if (insideCodeblock) {
          // For line breaks (empty lines), we also want to add line decoration.
          this.addLineDecoration('cm-codeblock', lineDecorations, pos);
        }
        pos += iter.value.length;
      }

      for (let cp of codePos) {
        let shouldHide = false;
        if (!update) {
          shouldHide = true;
        }
        if (update && !isCursorInside(update, cp.from, cp.to, true)) {
          shouldHide = true;
        }
        if (shouldHide) {
          this.addLineDecoration('cm-line-hidden', lineDecorations, cp.from);
          // 3 is the length of ``` or ~~~, to is the end position of the line so we need to minus 3 to get to the starting point of the line.
          this.addLineDecoration('cm-line-hidden', lineDecorations, cp.to - 3);
        }
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class CodeBlockIndicatorWidget extends WidgetType {
  constructor(readonly lang?: string) {
    super();
  }

  eq(other: CodeBlockIndicatorWidget) {
    return other.lang == this.lang;
  }

  toDOM() {
    let span = document.createElement('span');
    span.className = `cm-codeblock-indicator`;
    return span;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-codeblock': {
    paddingLeft: '10px',
    fontSize: '0.9em',
    ...codeFontFamily,
  },
  '.cm-codeblock-start': {
    borderTopLeftRadius: '4px',
    borderTopRightRadius: '4px',
  },
  '.cm-codeblock-end': {
    borderBottomLeftRadius: '4px',
    borderBottomRightRadius: '4px',
  },
  '.cm-codeblock-indicator': {
    color: '#CCC',
  },
  '.cm-line-hidden': {
    display: 'none',
  },
});
