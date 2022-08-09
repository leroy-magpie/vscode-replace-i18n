import * as vscode from 'vscode';

import { IWorkspaceSetting } from './type';

export const VIEW_MAP = {
  webview: 'replace-i18n.webview',
  multiple: 'replace-i18n.multipleKey',
  none: 'replace-i18n.noneKey',
};

export const COMMAND_MAP = {
  refresh: 'replace-i18n.refresh',
  openFile: 'replace-i18n.openFile',
  useKey: 'replace-i18n.useKey',
  useBracketsKey: 'replace-i18n.useBracketsKey',
};

export const WORKSPACE_SETTING_NAME = 'setting';

export const DEFAULT_WORKSPACE_SETTING: IWorkspaceSetting = {
  i18nJsonPath: '',
  translateFnName: '',
  allowFileExt: '',
  isIgnoreCase: false,
};

export const DEFAULT_PATH = vscode.workspace.workspaceFolders?.[0];

export const TRANSLATE_FN_NAME = 'trans';

export const BLOCK_KEYWORD = ['import', 'from', 'require'];
export const BLOCK_FN = [
  'classnames',
  'classNames',
  'useState',
  'querySelector',
];

export const MULTIPLE = Symbol('multiple');
