import * as vscode from 'vscode';

import { getI18nMap, getRootUri, selectFile } from '../common/utils';
import replaceValueCore from '../assets/js/core';
import { IValueNode } from '../common/type';
import { WORKSPACE_SETTING_NAME } from '../common/const';

interface IState {
  isInit: boolean;
  isReset: boolean;
  replaceFilePath: string;
  i18nJsonPath: string;
  translateFnName: string;
  allowFileExt: string;
  isIgnoreCase: boolean;
}

interface IData {
  targetUri: vscode.Uri;
  multipleKeyValue: IValueNode[];
  noneKeyValue: IValueNode[];
}

export class ReplaceI18nViewProvider implements vscode.WebviewViewProvider {
  private version = 1;

  private webviewView?: vscode.WebviewView;

  private state: IState = {
    isInit: false,
    isReset: false,
    replaceFilePath: '',
    i18nJsonPath: '',
    translateFnName: 'trans',
    allowFileExt: 'tsx',
    isIgnoreCase: false,
  };

  public onDidChange: vscode.EventEmitter<IData> =
    new vscode.EventEmitter<IData>();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly extensionUri = context.extensionUri,
  ) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView) {
    this.webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.onDidReceiveMessage(async ({ type, value }) => {
      switch (type) {
        case 'init': {
          this.setState({
            ...value,
            isInit: true,
          });
          break;
        }

        case 'changeReplaceFilePath': {
          this.setState({ replaceFilePath: value });
          break;
        }

        case 'changeI18nJsonPath': {
          this.setState({ i18nJsonPath: value });
          break;
        }

        case 'selectReplaceFile': {
          const fileUri = await selectFile();
          const rootUri = getRootUri();
          if (fileUri && rootUri) {
            const filePath = fileUri.path.replace(rootUri.path, '');
            this.setState({ replaceFilePath: filePath });
          }
          break;
        }

        case 'selectI18nFile': {
          const fileUri = await selectFile({
            canSelectFolders: false,
            filters: {
              json: ['json'],
            },
          });
          const rootUri = getRootUri();
          if (fileUri && rootUri) {
            const filePath = fileUri.path.replace(rootUri.path, '');
            this.setState({ i18nJsonPath: filePath });
          }
          break;
        }

        case 'changeTranslateFnName': {
          this.setState({ translateFnName: value }, false);
          break;
        }

        case 'changeAllowFileExt': {
          this.setState({ allowFileExt: value }, false);
          break;
        }

        case 'changeIsIgnoreCase': {
          this.setState({ isIgnoreCase: value }, false);
          break;
        }

        case 'replaceFile': {
          const rootUri = getRootUri();
          if (!rootUri) {
            return;
          }

          try {
            const {
              replaceFilePath,
              i18nJsonPath,
              translateFnName,
              isIgnoreCase,
              allowFileExt,
            } = value;
            const replaceFileAbsPath = vscode.Uri.joinPath(
              rootUri,
              replaceFilePath,
            );
            const i18nMap = await getI18nMap(i18nJsonPath);
            const res = await replaceValueCore.replaceValueInTargetPath({
              targetUri: replaceFileAbsPath,
              i18nMap,
              translateFnName,
              isIgnoreCase,
              allowFileExt,
            });
            this.onDidChange.fire(res);
          } catch (error) {
            vscode.window.showErrorMessage(`${error}`);
          }
          break;
        }

        case 'reseted': {
          this.setState({ isReset: false });
          break;
        }
      }
    });

    await this.render();
  }

  private getHtml = async (webview: vscode.Webview) => {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src/assets/css', 'reset.css'),
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src/assets/css', 'vscode.css'),
    );
    const styleMainUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src/assets/css', 'main.css'),
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src/assets/js', 'main.js'),
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Replace I18n ${this.version++}</title>
          <link href="${styleResetUri}" rel="stylesheet">
          <link href="${styleVSCodeUri}" rel="stylesheet">
          <link href="${styleMainUri}" rel="stylesheet">
        </head>
        <body>
          <div class="replace-file-path">
            <label>
              <h4>替换文件:</h4>
              <input class="replace-file-path-input" placeholder="请输入要替换文件的路径" />
              <button class="replace-file-path-btn">选择文件</button>
            </label>
          </div>
          <div class="i18n-json-path">
            <label>
              <h4>国际化 json 文件:</h4>
              <input class="i18n-json-path-input" placeholder="请输入国际化 json 文件的路径" />
              <button class="i18n-json-path-btn">选择文件</button>
            </label>
          </div>
          <div class="translate-fn-name">
            <label>
              <h4>翻译函数名称:</h4>
              <input class="translate-fn-name-input" placeholder="请输入翻译函数名称" />
            </label>
          </div>
          <div class="allow-file-ext">
            <label>
              <h4>包含的文件:</h4>
              <input class="allow-file-ext-input" placeholder="例如 tsx" />
            </label>
          </div>
          <div class="checkbox-wrapper">
            <div class="ignore-text-case">
              <label>
                <input class="ignore-text-case-checkbox" type="checkbox" />
                <span>忽略大小写</span>
              </label>
            </div>
          </div>
          <button class="replace-btn">替换</button>
          <script>
            var state = ${JSON.stringify(this.state)}
          </script>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
  };

  private async render() {
    this.webviewView!.webview.html = await this.getHtml(
      this.webviewView!.webview,
    );
  }

  public getState() {
    return { ...this.state };
  }

  private async setState(state: Partial<IState>, needRender = true) {
    this.state = {
      ...this.state,
      ...state,
    };

    this.updateGlobalState();

    if (needRender) {
      await this.render();
    }
  }

  private updateGlobalState() {
    const { i18nJsonPath, translateFnName, allowFileExt, isIgnoreCase } =
      this.state;

    this.context.workspaceState.update(WORKSPACE_SETTING_NAME, {
      i18nJsonPath,
      translateFnName,
      allowFileExt,
      isIgnoreCase,
    });
  }

  public async reset() {
    await this.setState({
      isReset: true,
      replaceFilePath: '',
      i18nJsonPath: '',
      translateFnName: 'trans',
      allowFileExt: 'tsx',
      isIgnoreCase: false,
    });
  }
}
