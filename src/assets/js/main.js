(function () {
  const vscode = acquireVsCodeApi();

  const DEFAULT_STATE = {
    replaceFilePath: '',
    i18nJsonPath: '',
    translateFnName: 'trans',
    allowFileExt: 'tsx',
    isIgnoreCase: false,
  };

  let preState = vscode.getState() || DEFAULT_STATE;
  if (preState && !state.isInit) {
    vscode.postMessage({
      type: 'init',
      value: preState,
    });
  }

  if (state.isReset) {
    vscode.setState(DEFAULT_STATE);
    preState = DEFAULT_STATE;

    return vscode.postMessage({
      type: 'reseted',
    });
  }

  const replaceFilePathInput = document.querySelector(
    '.replace-file-path-input',
  );
  const replaceFilePathBtn = document.querySelector('.replace-file-path-btn');
  const i18nJsonPathInput = document.querySelector('.i18n-json-path-input');
  const i18nJsonPathBtn = document.querySelector('.i18n-json-path-btn');
  const translateFnNameInput = document.querySelector(
    '.translate-fn-name-input',
  );
  const allowFileExtInput = document.querySelector('.allow-file-ext-input');

  const isIgnoreCaseCheckbox = document.querySelector(
    '.ignore-text-case-checkbox',
  );
  const replaceBtn = document.querySelector('.replace-btn');

  if (state.isInit) {
    const { replaceFilePath, i18nJsonPath } = state;
    replaceFilePathInput.value = replaceFilePath || '';
    i18nJsonPathInput.value = i18nJsonPath || '';

    vscode.setState({
      ...vscode.getState(),
      replaceFilePath,
      i18nJsonPath,
    });
  } else {
    replaceFilePathInput.value = preState.replaceFilePath || '';
    i18nJsonPathInput.value = preState.i18nJsonPath || '';
  }

  translateFnNameInput.value = preState.translateFnName || 'trans';
  allowFileExtInput.value = preState.allowFileExt || 'tsx';
  isIgnoreCaseCheckbox.checked = preState.isIgnoreCase || false;

  replaceFilePathInput?.addEventListener('change', (e) => {
    const { value } = e.target;

    vscode.setState({
      ...vscode.getState(),
      replaceFilePath: value,
    });
    vscode.postMessage({
      type: 'changeReplaceFilePath',
      value,
    });
  });

  i18nJsonPathInput?.addEventListener('change', (e) => {
    const { value } = e.target;

    vscode.setState({
      ...vscode.getState(),
      i18nJsonPath: value,
    });
    vscode.postMessage({
      type: 'changeI18nJsonPath',
      value,
    });
  });

  replaceFilePathBtn?.addEventListener('click', () => {
    vscode.postMessage({
      type: 'selectReplaceFile',
    });
  });

  i18nJsonPathBtn?.addEventListener('click', () => {
    vscode.postMessage({
      type: 'selectI18nFile',
    });
  });

  translateFnNameInput?.addEventListener('change', (e) => {
    const { value } = e.target;
    vscode.setState({
      ...vscode.getState(),
      translateFnName: value,
    });
    vscode.postMessage({
      type: 'changeTranslateFnName',
      value,
    });
  });

  allowFileExtInput?.addEventListener('change', (e) => {
    const { value } = e.target;
    vscode.setState({
      ...vscode.getState(),
      allowFileExt: value,
    });
    vscode.postMessage({
      type: 'changeAllowFileExt',
      value,
    });
  });

  isIgnoreCaseCheckbox?.addEventListener('change', (e) => {
    const { checked } = e.target;
    vscode.setState({
      ...vscode.getState(),
      isIgnoreCase: checked,
    });
    vscode.postMessage({
      type: 'changeIsIgnoreCase',
      value: checked,
    });
  });

  replaceBtn.addEventListener('click', () => {
    vscode.postMessage({
      type: 'replaceFile',
      value: {
        replaceFilePath: replaceFilePathInput.value,
        i18nJsonPath: i18nJsonPathInput.value,
        translateFnName: translateFnNameInput.value,
        allowFileExt: allowFileExtInput.value,
        isIgnoreCase: isIgnoreCaseCheckbox.checked,
      },
    });
  });
})();
