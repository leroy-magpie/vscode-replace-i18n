import * as vscode from 'vscode';

import { debounce, getWorkspaceState, getI18nMap } from '../common/utils';

const textEditorDecorationType = vscode.window.createTextEditorDecorationType(
  {},
);

const unUseDecorationType = vscode.window.createTextEditorDecorationType({
  opacity: '0.6',
});

export class I18nValueDecoration {
  constructor(private context: vscode.ExtensionContext) {
    const debounceUpdate = debounce(() => this.update(), 500);

    vscode.window.onDidChangeActiveTextEditor(debounceUpdate);
    vscode.workspace.onDidChangeTextDocument(debounceUpdate);

    debounceUpdate();
  }

  private async update() {
    const { activeTextEditor } = vscode.window;
    if (!activeTextEditor) {
      return;
    }

    const { document } = activeTextEditor;
    const text = document.getText();

    activeTextEditor.setDecorations(unUseDecorationType, []);
    if (!text) {
      activeTextEditor.setDecorations(textEditorDecorationType, []);
    }

    const { i18nJsonPath, translateFnName } = getWorkspaceState(this.context);
    const reg = new RegExp(`${translateFnName}\\(\\s*'([^']+)'[^)]*\\)`, 'g');
    const i18nMap = await getI18nMap(i18nJsonPath);

    const decorations: vscode.DecorationOptions[] = [];
    const unUseDecorations: vscode.DecorationOptions[] = [];

    let match = null;

    while ((match = reg.exec(text))) {
      const { index } = match;
      const [matchKey, key] = match;

      const value = i18nMap[key];

      const range = new vscode.Range(
        document.positionAt(index),
        document.positionAt(index + matchKey.length),
      );

      if (value !== undefined) {
        decorations.push({
          range,
          renderOptions: {
            after: {
              color: 'rgba(153, 153, 153, .7)',
              contentText: value ? `›${value}` : '',
              fontWeight: 'normal',
              fontStyle: 'normal',
            },
          },
        });
      } else {
        unUseDecorations.push({ range });
      }
    }

    activeTextEditor.setDecorations(unUseDecorationType, unUseDecorations);
    activeTextEditor.setDecorations(textEditorDecorationType, decorations);
  }
}
