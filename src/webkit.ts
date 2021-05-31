import { Extension } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate } from '@codemirror/view';

export function webkitPlugins(): Extension {
  return [webkitPlugin];
}

const webkitPlugin = ViewPlugin.fromClass(
  class {
    constructor(public view: EditorView) {}

    update(update: ViewUpdate) {
      if (update.docChanged) {
        let webkit = (<any>window).webkit;
        if (webkit) {
          webkit.messageHandlers.DocChanged.postMessage(
            update.state.toJSON().doc,
          );
        }
      }
    }
  },
  {},
);
