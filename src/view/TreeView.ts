import * as vscode from 'vscode';

import { IValueNode } from '../common/type';
import { TreeDataProvider } from './TreeDataProvider';

export class TreeView {
  private viewType: string = '';

  private treeDataProvider: TreeDataProvider;

  constructor(viewType: string, context: vscode.ExtensionContext) {
    const treeDataProvider = new TreeDataProvider();
    const noneView = vscode.window.createTreeView(viewType, {
      treeDataProvider,
      showCollapseAll: true,
    });

    context.subscriptions.push(noneView);

    this.viewType = viewType;
    this.treeDataProvider = treeDataProvider;
  }

  public render(targetUri: vscode.Uri | undefined, nodes: IValueNode[]) {
    vscode.commands.executeCommand('setContext', `${this.viewType}.numberOfNodes`, nodes.length);
    this.treeDataProvider.render(targetUri, nodes);
  }

  public reset() {
    this.render(undefined, []);
  }
}
