import { EditorState, Extension, Range, StateField, Transaction } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';

export function table(): Extension {
  return [tableField, baseTheme];
}

interface TableData {
  from: number;
  to: number;
  head: string[];
  rows: string[][];
}

function parseTables(state: EditorState): TableData[] {
  const tables: TableData[] = [];
  const tree = syntaxTree(state);
  const doc = state.doc;

  tree.cursor().iterate((node) => {
    if (node.name !== 'Table') return;

    const tableFrom = node.from;
    const tableTo = node.to;
    let head: string[] = [];
    const rows: string[][] = [];

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

function buildDecorations(state: EditorState): DecorationSet {
  const decorations: Range<Decoration>[] = [];
  const cursorHead = state.selection.main.head;
  const tables = parseTables(state);

  for (const t of tables) {
    // Show raw markdown when cursor is anywhere inside the table block.
    if (cursorHead >= t.from && cursorHead <= t.to) continue;

    decorations.push(
      Decoration.replace({
        widget: new TableWidget(t),
        block: true,
        inclusive: true,
      }).range(t.from, t.to),
    );
  }

  return Decoration.set(decorations, true);
}

// StateField is required for block decorations — ViewPlugin cannot produce them.
const tableField = StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(decorations, tr: Transaction) {
    if (tr.docChanged || tr.selection) {
      return buildDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide(field) {
    return [
      EditorView.decorations.from(field),
      // Treat each rendered table as one atomic unit so arrow keys and
      // mouse click coordinates don't get confused by the hidden lines.
      EditorView.atomicRanges.of((view) => {
        const decos = view.state.field(field, false);
        return decos ?? Decoration.none;
      }),
    ];
  },
});

class TableWidget extends WidgetType {
  constructor(readonly data: TableData) {
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

  toDOM(view: EditorView) {
    const wrap = document.createElement('div');
    wrap.className = 'cm-table-wrap';

    const tbl = document.createElement('table');
    tbl.className = 'cm-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const cell of this.data.head) {
      const th = document.createElement('th');
      th.textContent = cell;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    tbl.appendChild(thead);

    if (this.data.rows.length > 0) {
      const tbody = document.createElement('tbody');
      for (const row of this.data.rows) {
        const tr = document.createElement('tr');
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
      view.dispatch({
        selection: { anchor: this.data.from },
        scrollIntoView: true,
      });
      view.focus();
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
