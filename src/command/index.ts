import * as vscode from 'vscode';

import { IGetDisposable, IDisposableContext } from '../common/type';

import getRefreshDisposable from './refresh';
import getI18nKeyCompletionDisposable from './i18nKeyCompletion';
import getI18nKeyDefinitionDisposable from './i18nKeyDefinition';
import getOpenFileDisposable from './openFile';
import { getUseKeyDisposable, getUseBracketsKeyDisposable } from './useKey';

export function getDisposables(
  context: IDisposableContext,
): vscode.Disposable[] {
  const getDisposableList: IGetDisposable[] = [
    getRefreshDisposable,
    getI18nKeyCompletionDisposable,
    getI18nKeyDefinitionDisposable,
    getOpenFileDisposable,
    getUseKeyDisposable,
    getUseBracketsKeyDisposable,
  ];

  return getDisposableList.map((fn) => fn(context));
}
