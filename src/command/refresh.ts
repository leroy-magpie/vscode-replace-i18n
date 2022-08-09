import * as vscode from 'vscode';

import { IGetDisposable } from '../common/type';
import { COMMAND_MAP } from '../common/const';

const getRefreshDisposable: IGetDisposable = (context) => {
  const { viewProvider, multipleKeyView, noneKeyView } = context;
  return vscode.commands.registerCommand(COMMAND_MAP.refresh, async () => {
    await viewProvider.reset();
    multipleKeyView.reset();
    noneKeyView.reset();
  });
};

export default getRefreshDisposable;
