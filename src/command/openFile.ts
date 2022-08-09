import * as vscode from 'vscode';

import { COMMAND_MAP } from '../common/const';

export default function getOpenFileDisposable() {
  return vscode.commands.registerCommand(
    COMMAND_MAP.openFile,
    (resource, options) => {
      vscode.workspace.openTextDocument(resource).then(() => {
        vscode.window.showTextDocument(resource, options);
      });
    },
  );
}
