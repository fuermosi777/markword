import { Extension } from '@codemirror/next/state';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/next/view';

export function webkit(): Extension {
  return [webkitPlugin];
}

const webkitPlugin = ViewPlugin.fromClass(
  class {
    constructor(public view: EditorView) {}

    update(update: ViewUpdate) {
      if (update.docChanged) {
        (<any>window).webkit.messageHandlers.jsHandler.postMessage('hi from js!');
      }
    }
  },
  {},
);
