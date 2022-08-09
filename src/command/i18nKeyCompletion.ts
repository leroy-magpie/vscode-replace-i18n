import * as vscode from 'vscode';

import { IDisposableContext, IGetDisposable } from '../common/type';
import { getWorkspaceState, getI18nMap } from '../common/utils';

class I18nKeyCompletion implements vscode.CompletionItemProvider {
  constructor(private context: IDisposableContext) {}

  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ) {
    const { i18nJsonPath, translateFnName } = getWorkspaceState(
      this.context.context,
    );
    if (!i18nJsonPath) {
      console.log('completion none path');
      return [];
    }

    const line = document.lineAt(position);
    const lineText = line.text.substring(0, position.character);
    const reg = new RegExp(`${translateFnName}\\(\\s*["|'][\\w- ]*$`);
    if (!reg.test(lineText)) {
      return [];
    }

    const i18nMap = await getI18nMap(i18nJsonPath);

    return Object.entries(i18nMap).map(([key, value]) => {
      const completionItem = new vscode.CompletionItem(
        key,
        vscode.CompletionItemKind.Variable,
      );

      completionItem.detail = value;

      return completionItem;
    });
  }
}

const getI18nKeyCompletionDisposable: IGetDisposable = (context) => {
  return vscode.languages.registerCompletionItemProvider(
    ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    new I18nKeyCompletion(context),
    '"',
    "'",
    '`',
    ' ',
  );
};

export default getI18nKeyCompletionDisposable;
