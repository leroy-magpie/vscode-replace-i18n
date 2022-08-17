import * as vscode from 'vscode';

import { VIEW_MAP } from './common/const';

import { getDisposables } from './command';

import { ReplaceI18nViewProvider } from './view/webview';
import { TreeView } from './view/TreeView';
import { I18nValueDecoration } from './view/I18nValueDecoration';

export function activate(context: vscode.ExtensionContext) {
  const viewProvider = new ReplaceI18nViewProvider(context);

  const multipleKeyView = new TreeView(VIEW_MAP.multiple, context);
  const noneKeyView = new TreeView(VIEW_MAP.none, context);

  new I18nValueDecoration(context);

  viewProvider.onDidChange.event((data) => {
    console.log('aaadata', data);

    const { targetUri, multipleKeyValues, noneKeyValues } = data;
    multipleKeyView.render(targetUri, multipleKeyValues);
    noneKeyView.render(targetUri, noneKeyValues);
  });

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_MAP.webview, viewProvider),
  );

  context.subscriptions.push(
    ...getDisposables({
      context,
      viewProvider,
      multipleKeyView,
      noneKeyView,
    }),
  );
}

export function deactivate() {}
