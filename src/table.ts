import { Extension, Range } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export function table(): Extension {
  return [tablePlugin, baseTheme];
}

interface TableData {
  from: number;
  to: number;
  head: string[];
  rows: string[][];
}

function parseTables(view: EditorView): TableData[] {
  const tables: TableData[] = [];
  const tree = syntaxTree(view.state);
  const doc = view.state.doc;

  tree.cursor().iterate((node) => {
    if (node.name !== 'Table') return;

    const tableFrom = node.from;
    const tableTo = node.to;
    let head: string[] = [];
    const rows: string[][] = [];

    // Walk children of the Table node.
    const cursor = node.node.cursor();
    if (cursor.firstChild()) {
      do {
        if (cursor.name === 'TableHeader') {
          head = extractCells(cursor.node, doc);
        } else if (cursor.name === 'TableRow') {
          rows.push(extractCells(cursor.node, doc));
        }
      } while (cursor.nextSibling());
    }

    if (head.length > 0) {
      tables.push({ from: tableFrom, to: tableTo, head, rows });
    }
  });

  return tables;
}

function extractCells(node: any, doc: any): string[] {
  const cells: string[] = [];
  const cursor = node.cursor();
  if (cursor.firstChild()) {
    do {
      if (cursor.name === 'TableCell') {
        cells.push(doc.sliceString(cursor.from, cursor.to).trim());
      }
    } while (cursor.nextSibling());
  }
  return cells;
}

function isCursorInTable(view: EditorView, from: number, to: number): boolean {
  const head = view.state.selection.main.head;
  return head >= from && head <= to;
}

const tablePlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet = Decoration.none;

    constructor(public view: EditorView) {
      this.recompute();
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.recompute();
      }
    }

    recompute() {
      const decorations: Range<Decoration>[] = [];
      const tables = parseTables(this.view);

      for (const t of tables) {
        if (isCursorInTable(this.view, t.from, t.to)) continue;

        const deco = Decoration.replace({
          widget: new TableWidget(t, this.view),
          block: true,
          inclusive: true,
        });
        decorations.push(deco.range(t.from, t.to));
      }

      this.decorations = Decoration.set(decorations, true);
    }
  },
  {
    decorations: (v) => v.decorations,
  },
);

class TableWidget extends WidgetType {
  constructor(
    readonly data: TableData,
    readonly view: EditorView,
  ) {
    super();
  }

  eq(other: TableWidget) {
    return (
      other.data.from === this.data.from &&
      other.data.to === this.data.to &&
      JSON.stringify(other.data.head) === JSON.stringify(this.data.head) &&
      JSON.stringify(other.data.rows) === JSON.stringify(this.data.rows)
    );
  }

  toDOM() {
    const wrap = document.createElement('div');
    wrap.className = 'cm-table-wrap';

    const tbl = document.createElement('table');
    tbl.className = 'cm-table';

    // Header.
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const cell of this.data.head) {
      const th = document.createElement('th');
      th.textContent = cell;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    tbl.appendChild(thead);

    // Body rows.
    if (this.data.rows.length > 0) {
      const tbody = document.createElement('tbody');
      for (const row of this.data.rows) {
        const tr = document.createElement('tr');
        // Pad or trim to header column count.
        for (let i = 0; i < this.data.head.length; i++) {
          const td = document.createElement('td');
          td.textContent = row[i] ?? '';
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      tbl.appendChild(tbody);
    }

    wrap.appendChild(tbl);

    // Click anywhere on the widget to reveal the raw markdown for editing.
    wrap.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.view.dispatch({
        selection: { anchor: this.data.from },
        scrollIntoView: true,
      });
      this.view.focus();
    });

    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

const baseTheme = EditorView.baseTheme({
  '.cm-table-wrap': {
    display: 'block',
    overflowX: 'auto',
    margin: '0.5em 0',
    cursor: 'text',
  },
  '.cm-table': {
    borderCollapse: 'collapse',
    width: '100%',
    fontSize: '0.95em',
  },
  '.cm-table th, .cm-table td': {
    borderWidth: '1px',
    borderStyle: 'solid',
    padding: '6px 12px',
    textAlign: 'left',
    whiteSpace: 'nowrap',
  },
  '.cm-table thead th': {
    fontWeight: '600',
  },
});
