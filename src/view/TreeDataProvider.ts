import * as vscode from 'vscode';

import { ITreeNode, IValueNode } from '../common/type';
import { getFileName } from '../common/utils';

export class TreeDataProvider implements vscode.TreeDataProvider<ITreeNode> {
  private tree: ITreeNode[] = [];

  private treeNodeMap: Record<string, ITreeNode> = {};

  private _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();

  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  public getTreeItem = (treeNode: ITreeNode): vscode.TreeItem => {
    const { path, node } = treeNode;

    const uri = vscode.Uri.file(path);
    const treeItem = new vscode.TreeItem(
      uri,
      node
        ? vscode.TreeItemCollapsibleState.None
        : vscode.TreeItemCollapsibleState.Collapsed,
    );

    const command: vscode.Command = {
      command: 'replace-i18n.openFile',
      title: 'Open File',
    };

    if (node) {
      const { path, lineIndex, charIndex, charEndIndex, value } = node;
      treeItem.label = value;

      command.arguments = [
        vscode.Uri.file(path),
        {
          selection: new vscode.Range(
            new vscode.Position(lineIndex, charIndex),
            new vscode.Position(lineIndex, charEndIndex),
          ),
        },
      ];
    } else {
      command.arguments = [uri];
    }

    treeItem.command = command;
    treeItem.contextValue = 'file';

    return treeItem;
  };

  public getChildren = (node: ITreeNode): undefined | ITreeNode[] => {
    if (!node) {
      return this.tree;
    }

    const treeNode = this.treeNodeMap[node.path];
    return treeNode.children?.map((item) => this.treeNodeMap[item]);
  };

  public render(targetUri: vscode.Uri | undefined, nodes: IValueNode[]) {
    this.genTree(targetUri, nodes);
    this._onDidChangeTreeData.fire(undefined);
  }

  private genTree(targetUri: vscode.Uri | undefined, nodes: IValueNode[]) {
    this.tree = [];
    this.treeNodeMap = {};

    if (!targetUri || !nodes.length) {
      return;
    }

    nodes.forEach((node) => this.setTreeNode(node.path, node.key, node));
  }

  private genTreeNode(path: string, node?: IValueNode): ITreeNode {
    return {
      id: path,
      path,
      label: getFileName(path),
      node,
      children: node ? [] : undefined,
    };
  }

  private setTreeNode(id: string, child: string, node: IValueNode) {
    const { treeNodeMap } = this;

    if (!treeNodeMap[child]) {
      treeNodeMap[child] = this.genTreeNode(child, node);
    }

    if (treeNodeMap[id]) {
      const treeNode = treeNodeMap[id];
      treeNode.children?.push(child);
    } else {
      const treeNode = this.genTreeNode(id);
      treeNode.children = [child];

      this.tree.push(treeNode);
      treeNodeMap[id] = treeNode;
    }
  }
}
