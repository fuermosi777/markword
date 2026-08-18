import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

export function letterSpacing(value: number = 0): Extension {
  return EditorView.theme({
    '&.cm-editor': {
      letterSpacing: `${value}px`,
    },
  });
}

export function fontSize(value: number): Extension {
  return EditorView.theme({
    '&.cm-editor': {
      fontSize: `${value}px`,
    },
  });
}

export function fontFamily(
  name = '"SF Pro Text", "SF Pro Icons", "Helvetica Neue", Helvetica, Arial, sans-serif;',
): Extension {
  return EditorView.theme({
    '.cm-line': {
      fontFamily: name,
    },
  });
}

// When dynamic is true, the margin is a percentage of the viewport
// width with no cap, so it grows as the window widens. When dynamic is
// false, the margin is a fixed pixel value regardless of window width.
export function horizontalMargin(value: number = 10, dynamic: boolean = true): Extension {
  const padding = dynamic ? `${value}%` : `${value}px`;
  return EditorView.theme({
    '.cm-scroller': {
      paddingLeft: padding,
      paddingRight: padding,
    },
  });
}
