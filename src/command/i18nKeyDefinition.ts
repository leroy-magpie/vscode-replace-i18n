import * as vscode from 'vscode';

import { IDisposableContext, IGetDisposable } from '../common/type';
import { getWorkspaceState, getI18nMap, getRelUri } from '../common/utils';

const { fs } = vscode.workspace;

class I18nKeyDefinition implements vscode.DefinitionProvider {
  constructor(private context: IDisposableContext) {}

  public provideDefinition = async (
    document: vscode.TextDocument,
    position: vscode.Position,
  ) => {
    const { i18nJsonPath, translateFnName } = getWorkspaceState(
      this.context.context,
    );
    if (!i18nJsonPath) {
      console.log('definition none path');
      return;
    }

    const reg = new RegExp(`${translateFnName}\\(\\s*'[^']+`);
    let range = document.getWordRangeAtPosition(position, reg);
    if (!range) {
      range = document.getWordRangeAtPosition(position, new RegExp(`'[^']+`));
      if (!range) {
        console.log('definition none range');
        return;
      }

      const preLineNum = position.line - 1;
      const preLine = document.lineAt(preLineNum);
      const preRange = document.getWordRangeAtPosition(
        new vscode.Position(preLineNum, preLine.text.length),
        new RegExp(`${translateFnName}\\($`),
      );
      if (!preRange) {
        console.log('definition none range');
        return;
      }
    }

    const word = document
      .getText(range)
      .replace(/^'/, '')
      .replace(new RegExp(`${translateFnName}\\('`), '');
    const i18nMap = await getI18nMap(i18nJsonPath);
    const flag = Object.keys(i18nMap).some((key) => key === word);
    if (!flag) {
      console.log('definition none key', word);
      return;
    }

    const i18nUri = getRelUri(i18nJsonPath)!;
    const i18nContent = await fs.readFile(i18nUri);
    const lines = i18nContent.toString().split('\n');

    let lineNum = 0;
    lines.find((line, index) => {
      if (line.includes(`"${word}":`)) {
        lineNum = index;
        return true;
      }
    });

    return new vscode.Location(i18nUri, new vscode.Position(lineNum, 3));
  };
}

const getI18nKeyDefinitionDisposable: IGetDisposable = (context) => {
  return vscode.languages.registerDefinitionProvider(
    ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    new I18nKeyDefinition(context),
  );
};

export default getI18nKeyDefinitionDisposable;
