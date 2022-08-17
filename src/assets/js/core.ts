import * as vscode from 'vscode';

import {
  IValueNode,
  INumberMap,
  IStringMap,
  IReplaceParam,
} from '../../common/type';
import {
  BLOCK_FN,
  BLOCK_KEYWORD,
  TRANSLATE_FN_NAME,
  MULTIPLE,
} from '../../common/const';
import { forEachFile, getExt } from '../../common/utils';

const { fs } = vscode.workspace;

interface ReplaceValueCoreParam {
  i18nMap: IStringMap;
  isIgnoreCase: boolean;
  translateFnName?: string;
  allowFileExt?: string;
}

class ReplaceValueCore {
  private translateFnName?: string;

  private singleKeyI18nMap: Record<string, string | symbol> = {};

  private allowFileExts: string[] = [];

  constructor(private param: ReplaceValueCoreParam) {
    const { i18nMap, isIgnoreCase, translateFnName, allowFileExt = '' } = param;

    this.singleKeyI18nMap = this.getSingleKeyI18nMap(i18nMap, isIgnoreCase);

    this.translateFnName = translateFnName;

    this.allowFileExts = allowFileExt.split(',');
  }

  public async replaceValue(targetUri: vscode.Uri) {
    const multipleKeyValues: IValueNode[] = [];
    const noneKeyValues: IValueNode[] = [];

    await forEachFile(targetUri, async (fileUri: vscode.Uri) => {
      const ext = getExt(fileUri.path);
      if (!this.allowFileExts.includes(ext)) {
        return;
      }

      const fileBuffer = await fs.readFile(fileUri);
      const fileContent = fileBuffer.toString();

      const newFileContent = this.replaceValueFromContent(fileContent);

      const log = this.logValue(fileUri, newFileContent);
      multipleKeyValues.push(...log.multipleKeyValues);
      noneKeyValues.push(...log.noneKeyValues);

      if (fileContent.toString() !== newFileContent) {
        await fs.writeFile(fileUri, Buffer.from(newFileContent));
      }
    });

    return {
      targetUri,
      multipleKeyValues,
      noneKeyValues,
    };
  }

  public replaceValueFromContent(fileContent: string) {
    const { isIgnoreCase } = this.param;
    let newFileContent = fileContent;

    Object.entries(this.singleKeyI18nMap).forEach(([key, value]) => {
      if (value === MULTIPLE) {
        return;
      }

      value = value as string;

      const isContainsValue = isIgnoreCase
        ? newFileContent.toLocaleLowerCase().includes(value.toLocaleLowerCase())
        : newFileContent.includes(value);

      // 文件不存在 value
      if (!isContainsValue) {
        return;
      }

      const formateValue = this.formatValue(value);
      this.replaceValueFnList.forEach((fn) => {
        newFileContent = fn({
          content: newFileContent,
          key,
          value: formateValue,
          isIgnoreCase,
        });
      });
    });

    return newFileContent;
  }

  // ============================ log =================================
  private logValueWhenMultipleKey(
    fileUri: vscode.Uri,
    fileContent: string,
    key: string,
    i18nMap: IStringMap,
    isIgnoreCase: boolean,
  ): IValueNode[] {
    const res: IValueNode[] = [];
    const originValue = i18nMap[key];
    const formateValue = this.formatValue(originValue);

    const inJsxReg = this.getInJsxReg(formateValue, isIgnoreCase);
    const inSingleQuoteReg = this.getInSingleQuoteReg(
      formateValue,
      isIgnoreCase,
    );
    const inPropsQuoteReg = this.getInPropsReg(formateValue, isIgnoreCase);

    if (
      inJsxReg.test(fileContent) ||
      inSingleQuoteReg.test(fileContent) ||
      inPropsQuoteReg.test(fileContent)
    ) {
      const fileLine = fileContent.split('\n');
      fileLine.forEach((line, index) => {
        if (this.isAnnotationLine(line)) {
          return;
        }

        const jsxRegFlag = new RegExp(
          `(>${originValue}<)|(^[\\s]${originValue}[\\s]*$)`,
          isIgnoreCase ? 'gi' : 'g',
        ).test(line);
        const singleQuoteRegFlag = inSingleQuoteReg.test(line);
        const propsQuoteRegFlag = inPropsQuoteReg.test(line);

        if (jsxRegFlag || singleQuoteRegFlag || propsQuoteRegFlag) {
          const lineIndex = index;

          let matchValue = originValue;
          if (singleQuoteRegFlag) {
            matchValue = `'${originValue}'`;
          } else if (propsQuoteRegFlag) {
            matchValue = `"${originValue}"`;
          } else if (matchValue === '') {
            return;
          }

          const charIndex = this.formatNum(
            this.ignoreCaseIndexOf(line, matchValue, isIgnoreCase),
          );

          const codePath = `${fileUri.path}:${lineIndex}:${charIndex}`;
          const endIndex = charIndex + matchValue.length;

          let codeValue = line.slice(charIndex, endIndex);
          codeValue =
            singleQuoteRegFlag || propsQuoteRegFlag
              ? codeValue.slice(1, -1)
              : codeValue;

          res.push({
            key: codePath,
            uri: fileUri,
            path: fileUri.path,
            lineIndex,
            charIndex,
            charEndIndex: endIndex,
            value: codeValue,
          });
        }
      });
    }

    return res;
  }

  private logValueWhenNoneKey(
    fileUri: vscode.Uri,
    fileContent: string,
    i18nMap: IStringMap,
    isIgnoreCase: boolean,
  ) {
    const res: IValueNode[] = [];

    let values = Object.values(i18nMap);
    if (isIgnoreCase) {
      values = values.map((value) => value.toLocaleLowerCase());
    }

    const preRegStr = this.getBlockFnReg();
    const subRegStr = '(?!:)';
    const singleQuoteNoneKeyRegStr = `'([^']*)'`;
    const quoteRegNoneKeyStr = '`([^`]*)`';
    const flags = isIgnoreCase ? 'gi' : 'g';

    const singleQuoteNoneKeyReg = new RegExp(
      `${preRegStr}${singleQuoteNoneKeyRegStr}${subRegStr}`,
      flags,
    );
    const quoteNoneKeyReg = new RegExp(
      `${preRegStr}${quoteRegNoneKeyStr}${subRegStr}`,
      flags,
    );

    const fileLine = fileContent.split('\n');
    fileLine.forEach((line, index) => {
      const replaceFn = (
        $: string,
        $1: string,
        value: string,
        charIndex: number,
      ) => {
        if (
          !value ||
          values.includes(isIgnoreCase ? value.toLocaleLowerCase() : value)
        ) {
          return value;
        }

        const preLine = fileLine[index - 1];
        if (preLine) {
          const preRegStr = `${this.getTranslateFnName()}\\($`;
          const reg = new RegExp(preRegStr);
          if (reg.test(preLine)) {
            return value;
          }
        }

        const lineIndex = index;
        const codePath = `${fileUri.path}:${lineIndex}:${charIndex + 1}`;

        res.push({
          key: codePath,
          uri: fileUri,
          path: fileUri.path,
          lineIndex,
          charIndex: this.formatNum(charIndex),
          charEndIndex: charIndex + value.length + 2,
          value,
        });

        return value;
      };

      line.replace(singleQuoteNoneKeyReg, replaceFn);
      line.replace(quoteNoneKeyReg, replaceFn);
    });

    const jsxNoneKeyReg = /(?<!=)>\s*(?!\s+<)([^<{}=']+)\s*</g;
    fileContent.replace(jsxNoneKeyReg, ($: string, $1: string) => {
      const value = $1.trim();
      if (
        !value ||
        values.includes(isIgnoreCase ? value.toLocaleLowerCase() : value) ||
        ['(', ')', ') : ('].includes(value)
      ) {
        return $;
      }

      const lineIndex = fileLine.findIndex((line: string) => {
        if (line.includes(value)) {
          const formateValue = this.formatValue($1.trim());
          return new RegExp(
            `(>${formateValue}<)|([\\s]${formateValue}[\\s]*$)`,
            flags,
          ).test(line);
        }
      });
      if (lineIndex === -1) {
        return $;
      }

      const line = fileLine[lineIndex];
      const charIndex = this.ignoreCaseIndexOf(line, value, isIgnoreCase);
      const codePath = `${fileUri.path}:${lineIndex}:${charIndex}`;

      res.push({
        key: codePath,
        uri: fileUri,
        path: fileUri.path,
        lineIndex,
        charIndex: this.formatNum(charIndex),
        charEndIndex: charIndex + value.length,
        value,
      });

      return $;
    });

    return res;
  }

  private logValue(fileUri: vscode.Uri, fileContent: string) {
    const { i18nMap, isIgnoreCase } = this.param;

    const multipleKeyValues: IValueNode[] = [];
    const noneKeyValues: IValueNode[] = [];

    Object.entries(this.singleKeyI18nMap).forEach(([key, value]) => {
      if (value !== MULTIPLE) {
        return;
      }

      const res = this.logValueWhenMultipleKey(
        fileUri,
        fileContent,
        key,
        i18nMap,
        isIgnoreCase,
      );
      if (res.length) {
        multipleKeyValues.push(...res);
      }
    });

    const res = this.logValueWhenNoneKey(
      fileUri,
      fileContent,
      i18nMap,
      isIgnoreCase,
    );
    if (res.length) {
      noneKeyValues.push(...res);
    }

    return {
      multipleKeyValues,
      noneKeyValues,
    };
  }

  // ============================ utils =================================
  private getSingleKeyI18nMap(i18nMap: IStringMap, isIgnoreCase: boolean) {
    if (isIgnoreCase) {
      i18nMap = Object.entries(i18nMap).reduce((res, [key, value]) => {
        res[key] = value.toLocaleLowerCase();
        return res;
      }, {} as IStringMap);
    }

    const singleKeyI18nMap: Record<string, string | symbol> = { ...i18nMap };

    const i18nValueMap: INumberMap = {};
    Object.values(i18nMap).forEach((value) => {
      if (i18nValueMap[value]) {
        i18nValueMap[value]++;
      } else {
        i18nValueMap[value] = 1;
      }
    });
    Object.entries(i18nValueMap).forEach(([key, value]) => {
      if (value === 1) {
        delete i18nValueMap[key];
      }
    });

    Object.entries(singleKeyI18nMap).forEach(([key, value]) => {
      value = value as string;

      if (i18nValueMap[value]) {
        if (i18nValueMap[value] > 1) {
          delete singleKeyI18nMap[key];
          i18nValueMap[value]--;
        } else {
          singleKeyI18nMap[key] = MULTIPLE;
        }
      }
    });

    return singleKeyI18nMap;
  }

  private getTranslateFnName() {
    return this.translateFnName || TRANSLATE_FN_NAME;
  }

  private getBlockFn() {
    const translateFnName = this.getTranslateFnName();
    return [...BLOCK_FN, translateFnName];
  }

  private formatValue(value: string) {
    return value.replace(/\{|\}|\[|\]|\?|\.|\(|\)/g, ($) => `\\${$}`);
  }

  private formatNum(num: number) {
    return num < 0 ? 0 : num;
  }

  private ignoreCaseIndexOf(str: string, char: string, isIgnoreCase: boolean) {
    return isIgnoreCase
      ? str.toLocaleLowerCase().indexOf(char.toLocaleLowerCase())
      : str.indexOf(char);
  }

  private positionAt(fileContent: string, offset: number) {
    const fileLine = fileContent.split('\n');

    let len = 0;
    const lineIndex = fileLine.findIndex((line) => {
      if (len + line.length >= offset) {
        return true;
      }
      len += line.length;
    });

    const charIndex = offset - len;

    return {
      lineIndex,
      charIndex,
    };
  }

  private isAnnotationLine(line: string) {
    return line.trim().startsWith('//');
  }

  // ============================ replace value =================================
  private getInJsxReg(value: string, isIgnoreCase: boolean) {
    return new RegExp(
      `(?<!=)>[\\s]*(${value})[\\s]*<`,
      isIgnoreCase ? 'gi' : 'g',
    );
  }

  private replaceValueInJsx = ({
    content,
    key,
    value,
    isIgnoreCase,
  }: IReplaceParam) => {
    const inJsxReg = this.getInJsxReg(value, isIgnoreCase);
    if (inJsxReg.test(content)) {
      return content.replace(inJsxReg, ($: string, $1: string) => {
        return $.replace($1, `{${this.getTranslateFnName()}('${key}')}`);
      });
    }

    return content;
  };

  private getBlockFnReg() {
    const blockKeywordStr = BLOCK_KEYWORD.map((keyword) => `${keyword} `);
    const blockFn = this.getBlockFn();
    const blockFnStr = blockFn.map((fnName) => `${fnName}\\(\\s*`);
    const blockArr = [...blockKeywordStr, ...blockFnStr];
    return blockArr.length ? `(?<!(${blockArr.join('|')}))` : '';
  }

  private getInSingleQuoteReg(value: string, isIgnoreCase: boolean) {
    const preRegStr = this.getBlockFnReg();
    return new RegExp(`${preRegStr}'${value}'`, isIgnoreCase ? 'gi' : 'g');
  }

  private replaceValueInStr = ({
    content,
    key,
    value,
    isIgnoreCase,
  }: IReplaceParam) => {
    const inSingleQuoteReg = this.getInSingleQuoteReg(value, isIgnoreCase);
    if (inSingleQuoteReg.test(content)) {
      return content.replace(
        inSingleQuoteReg,
        () => `${this.getTranslateFnName()}('${key}')`,
      );
    }

    return content;
  };

  private getInPropsReg(value: string, isIgnoreCase: boolean) {
    return new RegExp(`="${value}"`, isIgnoreCase ? 'gi' : 'g');
  }

  private replaceValueInProps = ({
    content,
    key,
    value,
    isIgnoreCase,
  }: IReplaceParam) => {
    const inPropsReg = this.getInPropsReg(value, isIgnoreCase);
    if (inPropsReg.test(content)) {
      return content.replace(
        inPropsReg,
        () => `={${this.getTranslateFnName()}('${key}')}`,
      );
    }

    return content;
  };

  private replaceValueFnList = [
    this.replaceValueInJsx,
    this.replaceValueInStr,
    this.replaceValueInProps,
  ];
}

export default ReplaceValueCore;
