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
import { isCursorInsideLine } from './utils';

export function codeblock(): Extension {
  return [codeblockDecorationPlugin, baseTheme];
}

const codeblockRE = /^`{3}([a-zA-Z]*)/;

const codeblockDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    recompute(update?: ViewUpdate) {
      let decorations: Range<Decoration>[] = [];
      let lineDecorations: Range<Decoration>[] = [];
      // This is for determine whether the cursor is inside the current codeblock, won't be used for actual decoration.
      let indicatorDecorations: Range<Decoration>[] = [];
      for (let { from, to } of this.view.visibleRanges) {
        // Start from 0 because we want to make sure the ``` always starts from top to bottom to avoid a case when the ending indicator becomes the starting one.
        this.getDecorationsFor(0, to, decorations, lineDecorations, indicatorDecorations);
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
      indicatorDecorations: Range<Decoration>[],
    ) {
      let { doc } = this.view.state;
      let insideCodeblock = false;

      for (let pos = from, iter = doc.iterRange(from, to); !iter.next().done; ) {
        if (!iter.lineBreak) {
          let m = iter.value.match(codeblockRE);
          if (m && !insideCodeblock) {
            // Start the codeblock.
            insideCodeblock = true;
            let lineLength = iter.value.length;
            if (!isCursorInsideLine(this.view.state, pos, pos + lineLength)) {
              let deco = Decoration.replace({
                widget: new CodeBlockIndicatorWidget(m[1]),
                inclusive: true,
              });
              decorations.push(deco.range(pos, pos + lineLength));
            }
            this.addLineDecoration('cm-codeblock-start', lineDecorations, pos);
          } else if (m && insideCodeblock) {
            insideCodeblock = false;
            let lineLength = iter.value.length;
            if (!isCursorInsideLine(this.view.state, pos, pos + lineLength)) {
              let deco = Decoration.replace({
                widget: new CodeBlockIndicatorWidget(m[1]),
                inclusive: true,
              });
              decorations.push(deco.range(pos, pos + lineLength));
            }
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
