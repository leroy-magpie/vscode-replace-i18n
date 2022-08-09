import * as vscode from 'vscode';
import * as path from 'path';
import { IWorkspaceSetting, IStringMap } from './type';
import { WORKSPACE_SETTING_NAME, DEFAULT_WORKSPACE_SETTING } from './const';

const fs = vscode.workspace.fs;

export async function forEachFile(
  targetUri: vscode.Uri,
  callback: (fileUri: vscode.Uri) => any,
  filter?: (filePath: string) => boolean,
) {
  const task = [targetUri];
  while (task.length) {
    const fileUri = task.pop() as vscode.Uri;

    const filePath = getFileName(fileUri.path);
    if (filter?.(filePath) === false) {
      continue;
    }

    const stat = await fs.stat(fileUri);

    if (stat.type === vscode.FileType.Directory) {
      const childFileNames = await fs.readDirectory(fileUri);

      const childFileUris = childFileNames
        .map(([childFileName]) => {
          const filePath = path.join(fileUri.path, childFileName);
          return vscode.Uri.file(filePath);
        })
        .reverse();
      task.push(...childFileUris);
    } else {
      await callback(fileUri);
    }
  }
}

export function debounce(fn: any, time: number) {
  let timer: any = 0;

  return (...rest: any) => {
    clearTimeout(timer);

    timer = setTimeout(() => fn(...rest), time);
  };
}

export function getFileName(filePath: string) {
  return filePath.split('/').slice(-1)[0];
}

export function getExt(filePath: string) {
  if (filePath.includes('.')) {
    return filePath.split('.').slice(-1)[0];
  }

  return '';
}

export function getRootUri() {
  return vscode.workspace.workspaceFolders?.[0].uri;
}

export function getRelUri(path: string) {
  const rootUri = getRootUri();
  if (rootUri) {
    return vscode.Uri.joinPath(rootUri, path);
  }
}

export async function getI18nMap(i18nJsonPath: string): Promise<IStringMap> {
  const rootUri = getRootUri();
  if (!rootUri) {
    return {};
  }

  const i18nJsonAbsPath = vscode.Uri.joinPath(rootUri, i18nJsonPath);
  const i18nJsonContent = await fs.readFile(i18nJsonAbsPath);
  const i18nMap = JSON.parse(i18nJsonContent.toString());
  return i18nMap;
}

export function getWorkspaceState(
  context: vscode.ExtensionContext,
): IWorkspaceSetting {
  return context.workspaceState.get<IWorkspaceSetting>(
    WORKSPACE_SETTING_NAME,
    DEFAULT_WORKSPACE_SETTING,
  );
}

export async function selectFile(options?: vscode.OpenDialogOptions) {
  const rootUri = getRootUri();
  const res = await vscode.window.showOpenDialog({
    openLabel: '确认',
    canSelectFiles: true,
    canSelectFolders: true,
    defaultUri: rootUri,
    ...options,
  });

  if (!res) {
    return;
  }

  const [fileUri] = res;
  return fileUri;
}

export async function selectI18nKey(param: {
  i18nJsonPath: string;
  translateFnName: string;
  isIgnoreCase: boolean;
  callback?: (str: string) => string;
}) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const {
      i18nJsonPath,
      isIgnoreCase,
      translateFnName,
      callback = (str: string) => str,
    } = param;
    const i18nMap = await getI18nMap(i18nJsonPath);

    const doc = editor.document;
    const selection = editor.selection;
    let word = doc.getText(selection);
    word = word.replace(/(^['"`])|(['"`]$)/g, '');

    const items = Object.entries(i18nMap)
      .filter(([key, value]) => {
        if (isIgnoreCase) {
          return value.toLocaleLowerCase() === word.toLocaleLowerCase();
        } else {
          return value === word;
        }
      })
      .map(([key]) => key);

    if (!items.length) {
      vscode.window.showInformationMessage('选中文本没有对应的 key');
      return;
    }

    let res: string | undefined;
    if (items.length === 1) {
      res = items[0];
    } else {
      res = await vscode.window.showQuickPick(items);
    }
    if (!res) {
      return;
    }

    editor.edit((eb) =>
      eb.replace(selection, callback(`${translateFnName}('${res}')`)),
    );
  }
}
