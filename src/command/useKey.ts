import * as vscode from 'vscode';

import { IGetDisposable } from '../common/type';
import { COMMAND_MAP } from '../common/const';
import { getWorkspaceState, selectI18nKey } from '../common/utils';

export const getUseKeyDisposable: IGetDisposable = (context) => {
  return vscode.commands.registerCommand(COMMAND_MAP.useKey, () => {
    const { i18nJsonPath, translateFnName, isIgnoreCase } = getWorkspaceState(
      context.context,
    );

    selectI18nKey({
      i18nJsonPath,
      translateFnName,
      isIgnoreCase,
    });
  });
};

export const getUseBracketsKeyDisposable: IGetDisposable = (context) => {
  return vscode.commands.registerCommand(COMMAND_MAP.useBracketsKey, () => {
    const { i18nJsonPath, translateFnName, isIgnoreCase } = getWorkspaceState(
      context.context,
    );

    selectI18nKey({
      i18nJsonPath,
      translateFnName,
      isIgnoreCase,
      callback(str: string) {
        return `{${str}}`;
      },
    });
  });
};
