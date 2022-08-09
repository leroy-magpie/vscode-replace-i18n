import * as vscode from 'vscode';

import { ReplaceI18nViewProvider } from '../view/webview';
import { TreeView } from '../view/TreeView';

export interface IValueNode {
  key: string;
  uri: vscode.Uri;
  path: string;
  lineIndex: number;
  charIndex: number;
  charEndIndex: number;
  value: string;
}

export interface ITreeNode {
  id: string;
  label: string;
  path: string;
  children?: string[];
  node?: IValueNode;
}

export type IStringMap = Record<string, string>;

export type INumberMap = Record<string, number>;

export interface IReplaceParam {
  content: string;
  key: string;
  value: string;
  isIgnoreCase: boolean;
}

export interface IDisposableContext {
  context: vscode.ExtensionContext
  viewProvider: ReplaceI18nViewProvider;
  multipleKeyView: TreeView;
  noneKeyView: TreeView;
}

export interface IWorkspaceSetting {
  i18nJsonPath: string;
  translateFnName: string;
  allowFileExt: string;
  isIgnoreCase: boolean;
}

export type IGetDisposable = (context: IDisposableContext) => vscode.Disposable;
