import * as assert from 'assert';

import ReplaceValueCore from '../../assets/js/core';

import i18nMap from './en.json';
import { TSX_TEMPLATE, TSX_TEMPLATE_TRANS } from './const';

suite('Extension Test Suite', async () => {
  const replaceValueCore = new ReplaceValueCore({
    i18nMap,
    translateFnName: 'trans',
    isIgnoreCase: true,
  });

  test('replace value', async () => {
    const res = replaceValueCore.replaceValueFromContent(TSX_TEMPLATE);

    assert.strictEqual(res, TSX_TEMPLATE_TRANS);
  });
});
