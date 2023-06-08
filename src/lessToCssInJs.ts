import postcssLess from 'postcss-less';
import postcss, { Root, ChildNode } from 'postcss';
import prettier from 'prettier/standalone';
import babelPLugin from 'prettier/parser-babel';
import babelTsPlugin from 'prettier/parser-typescript';
/**
 * 将lesscode 转化为 ast
 * @returns ASR
 */
const less2AST = (code: string) =>
  postcss.parse(code, {
    //@ts-ignore
    parser: postcssLess.parse,
  });

/**
 * 遍历AST的方法
 * @param ast
 * @param mapFunction
 */
const mapAst = (ast: Root, mapFunction: (node: ChildNode) => void) => {
  ast.walk((node) => {
    mapFunction(node);
  });
};

/**
 * 常见的 antd 隐射关系
 */
const tokenMap = {
  '@tag-default-bg': '#F9F9F9',
  '@bg': 'colorBgContainer',
  '@highlight-color': 'colorBgTextActive',
  '@item-active-bg': 'colorBgTextActive',
  '@descriptions-bg': 'colorBgContainer',
  '@item-hover-bg': 'colorBgElevated',
  '@select-item-selected-bg': 'colorBgElevated',
  '@box-shadow-base': 'boxShadow',
  '@avatar-size-sm': 'controlHeightSM',
  '@avatar-size-lg': 'controlHeightLG',
  '@avatar-size-base': 'controlHeight',
  '@disabled-color': 'colorTextDisabled',
  '@btn-height-lg': 'controlHeight',
  '@warning-color': 'colorWarning',
  '@error-color': 'colorError',
  '@success-color': 'colorSuccess',
  '@border-radius-base': 'borderRadius',
  '@menu-bg': 'colorBgContainer',
  '@border-width-base': 'lineWidth',
  '@border-style-base': 'solid',
  '@font-size-base': 'fontSize',
  '@border-color-split': 'colorSplit',
  '@text-color': 'colorText',
  '@heading-color': 'colorTextHeading',
  '@text-color-secondary': 'colorTextSecondary',
  '@border-color-base': 'colorBorder',
  '@component-background': 'colorBgContainer',
  '@screen-lg': 'screenLG',
  '@screen-md': 'screenMD',
  '@screen-xl': 'screenXL',
  '@screen-sm': 'screenSM',
  '@screen-xs': 'screenXS',
  '@input-bg': 'colorBgContainer',
  '@screen-md-min': 'screenMDMin',
  '@primary-color': 'colorPrimary',
  '@layout-body-background': 'colorBgLayout',
};

/**
 * 该函数使用正则表达式将字符串中的连字符 (-) 替换为它后面的字符的大写版本。
 * 例如，"-b" 会替换为 "B"，从而将连字符转化为空格，并将下一个单词的首字母大写。
 * @param str
 * @returns
 */
function toCamelCase(str: string) {
  return str.replace(/-([a-z]|[0-9])/g, (match, p1) => p1.toUpperCase());
}

const getValueName = (cssString: string) => {
  const pattern = /@([a-z|A-Z|-]*)/; // 匹配括号中以@开头的变量
  const match = cssString.match(pattern);
  if (match) {
    const variableName = match[0]; // 获取变量名
    return variableName; // 输出: screen-md-min
  }
  return '';
};
function hasMultipleAtSymbols(str: string) {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str.charAt(i) === '@') {
      count++;
    }
    if (count > 1) {
      return count;
    }
  }
  return count;
}
/**
 * 解析节点的值, 如果是变量, 则返回 token.变量名
 * @param node
 * @returns  string
 */
const praseNodeValue = (value: string): string => {
  if (hasMultipleAtSymbols(value) > 1) {
    return `\`${value
      .split(' ')
      .map((item) => {
        if (item.startsWith('@')) {
          const parseNodeString = praseNodeValue(item);
          if (parseNodeString.endsWith('Width')) {
            return `\${${parseNodeString}}px`;
          }
          if (parseNodeString.startsWith('token.')) {
            return `\${${parseNodeString}}`;
          }

          return parseNodeString;
        }
        return item;
      })
      .join(' ')}\``;
  }

  if (value.startsWith('@')) {
    const itemToken = tokenMap[value as '@input-bg'];
    if (itemToken) {
      if (itemToken.startsWith('#')) {
        return itemToken;
      }

      if (itemToken === 'solid') {
        return itemToken;
      }

      return `token.${itemToken}`;
    }
    return `token.${toCamelCase(value.replace('@', ''))}`;
  }

  if (hasMultipleAtSymbols(value) === 1) {
    return `\`${value
      .split(' ')
      .map((item) => {
        if (item.startsWith('@')) {
          const parseNodeString = praseNodeValue(item);
          if (parseNodeString.endsWith('Width')) {
            return `\${${parseNodeString}}px`;
          }
          if (parseNodeString.startsWith('token.')) {
            return `\${${parseNodeString}}`;
          }

          return parseNodeString;
        }
        return item;
      })
      .join(' ')}\``;
  }

  return value;
};
/**
 * @title 解析节点参数
 * @param selector - 选择器字符串
 * @returns 解析后的选择器字符串
 */
const praseNodeParams = (selector: string) => {
  if (selector.includes('@')) {
    const value = getValueName(selector);
    if (tokenMap[value as '@input-bg']) {
      return selector.replaceAll(
        value,
        `\${token.${tokenMap[value as '@input-bg']}}px`
      );
    }
    return selector.replaceAll('@', 'token.');
  }
  return selector;
};

const getGlobalSelector = (selector: string) => {
  const regex = /\.([\w-]+)/;
  return selector.match(regex)?.[0] || selector;
};

/**
 * 转化节点的选择器，去除括号
 * @param selector
 * @returns
 */
const parseNodeSelector = (selector: string) => {
  // 处理行内注释
  if (selector.startsWith('/')) {
    return selector.split('\n').pop()?.replace(/\s+/g, ' ').trim();
  }

  if (selector.startsWith(':global(')) {
    return selector;
  }

  if (selector.startsWith(':global')) {
    return selector;
  }

  // 处理媒体查询
  if (!selector.includes('@media')) {
    const reg = /^.+\(.+\)$/g;
    if (reg.test(selector)) return '';
  }

  const pattern = /\((.*?)\)/;
  const matches = selector.match(pattern);
  if (matches) return matches[1];

  if (selector.startsWith('.ant')) {
    return selector.replaceAll('\n', ' ').replace(/\s+/g, ' ');
  }

  if (selector.startsWith('.')) {
    if (selector.split('.').length > 1) {
      if (selector.includes('>')) {
        return selector;
      }
      return selector
        .replaceAll('\n', ' ')
        .replaceAll(',', ' ')
        .split(' ')
        .map((item) => item.replace(',', ''))
        .filter(Boolean);
    }
    return selector;
  }
  return selector.replaceAll('\n', '').replace(/\s+/g, ' ').trim();
};

/**
 * 转换 CSS 节点为 CSS 对象
 * 在参数和返回值的 JSDoc 中加入注释，清楚说明参数和返回值的类型和作用。
 * 给 selector 变量添加类型注释，说明其为字符串类型。
 * 将 CSS 对象的值类型声明为 string | Map<string, string>，即可以为字符串，也可以为嵌套的 CSS 对象 Map。
 * @param node - CSS 节点
 * @returns CSS 对象 Map
 */
const nodeToCssOject = (
  node: ChildNode,
  globalCssMap: Map<string, string | Map<string, string>>
): Map<string, string | Map<string, string>> => {
  const finCssMap = new Map();
  if (node.type === 'comment') {
    node.remove();
  }
  if (node.type === 'atrule') {
    if (node.name === 'import') {
      return finCssMap;
    }
    if (node.name === 'media') {
      const mediaMap = new Map();
      node.nodes?.forEach((node) => {
        const mewMediaMap = nodeToCssOject(node, globalCssMap);
        mewMediaMap.forEach((value, key) => {
          mediaMap.set(key, value);
        });
        return;
      });
      mediaMap.forEach((value, key) => {
        if (!finCssMap.has(key)) {
          finCssMap.set(key, new Map<string, string>());
        }

        let mediaKey = `@media ${praseNodeParams(node.params)}`;

        if (mediaKey.includes('token.')) {
          mediaKey = `[\`${mediaKey}\`]`;
        }
        finCssMap.get(key).set(mediaKey, value);
      });
    }
  }

  if (node.type === 'rule') {
    /**
     * @type {string} - 选择器名
     */
    let selector = parseNodeSelector(node.selector);
    if (!selector) {
      return finCssMap;
    }

    node.nodes?.forEach((node) => {
      if (node.type === 'decl') {
        [selector].flat(1).forEach((selectorItem) => {
          if (selectorItem === ':global') {
            finCssMap.set(toCamelCase(node.prop), praseNodeValue(node.value));
          } else {
            if (!finCssMap.has(selectorItem)) {
              finCssMap.set(selectorItem, new Map<string, string>());
            }
            finCssMap
              .get(selectorItem)
              ?.set(toCamelCase(node.prop), praseNodeValue(node.value));
          }
        });
        return;
      }

      const nodeMap = nodeToCssOject(node, globalCssMap);
      nodeMap.forEach((value, key) => {
        // & 开头,伪类，或者是 &:hover 之类的
        if (key.startsWith('&')) {
          [selector].flat(1).forEach((selectorItem) => {
            if (!key.startsWith('&.')) {
              if (!finCssMap.has(selectorItem)) {
                finCssMap.set(selectorItem, new Map<string, string>());
              }
              finCssMap.get(selectorItem)?.set(key, value);
            } else {
              globalCssMap.set(key.replaceAll('&.', ''), value);
            }
          });
          return;
        }

        if (key.startsWith(':global') && !key.includes(':global(')) {
          if (typeof value === 'string') {
            finCssMap.set(key.replaceAll(':global', ''), value);
          }

          if (value instanceof Map) {
            value.forEach((value, key) => {
              if (!key.startsWith('.ant-')) {
                finCssMap.set(key, value);
              } else {
                [selector].flat(1).forEach((selectorItem) => {
                  if (!finCssMap.has(selectorItem)) {
                    finCssMap.set(selectorItem, new Map<string, string>());
                  }
                  finCssMap.get(selectorItem)?.set(key, value);
                });
              }
            });
          }
          return;
        }
        if (
          key.startsWith('.') &&
          !key.startsWith('.ant-') &&
          !key.startsWith(':global(')
        ) {
          finCssMap.set(key, value);
        }
        // span 或者是 div 之类的
        if (
          key.startsWith('.ant-') ||
          key.startsWith(':global(') ||
          !key.startsWith('.')
        ) {
          [selector].flat(1).forEach((selectorItem) => {
            if (selectorItem?.startsWith(':global(')) {
              selectorItem = getGlobalSelector(selectorItem);
            }

            if (!finCssMap.has(selectorItem)) {
              finCssMap.set(selectorItem, new Map<string, string>());
            }
            finCssMap.get(selectorItem)?.set(key, value);
          });
          return;
        }
      });
    });
  }
  return finCssMap;
};
/**
 * 转换 Less 代码为 CSS 对象映射
 * @param code - Less 代码
 * @returns CSS 对象映射
 **/
export const less2CssObjectMap = (
  code: string
): Map<string, Map<string, Map<string, any>>> => {
  const ast = less2AST(code);
  const cssMap = new Map();
  mapAst(ast, (node) => {
    if (node.type === 'comment') {
      node.remove();
      return;
    }
    if (node?.parent?.type !== 'root') return;
    if (node.type === 'atrule' && node.name === 'import') return;

    if (
      node.type === 'atrule' ||
      node.type === 'decl' ||
      node.type === 'rule'
    ) {
      const globalCssMap = new Map();
      const map = nodeToCssOject(node, globalCssMap);
      map?.forEach((value, key) => {
        if (cssMap.has(key)) {
          const cssMapValue = cssMap.get(key);
          if (cssMapValue instanceof Map) {
            if (value instanceof Map) {
              value.forEach((subValue, subKey) => {
                cssMapValue.set(subKey, subValue);
              });
            } else {
              cssMapValue.set(key, value);
            }
          }
          return;
        }
        cssMap.set(key, value);
      });
      globalCssMap?.forEach((value, key) => {
        if (cssMap.has(key)) {
          const cssMapValue = cssMap.get(key);
          if (cssMapValue instanceof Map) {
            if (value instanceof Map) {
              value.forEach((subValue, subKey) => {
                cssMapValue.set(subKey, subValue);
              });
            } else {
              cssMapValue.set(key, value);
            }
          }
          return;
        }
        cssMap.set(key, value);
      });
    }
  });
  return cssMap;
};
/**
 * @title 解析 Js 代码的 key
 * @param key - 字符串 key
 * @returns 若 key 包含 "token." 则返回带反引号的字符串，否则返回带双引号的字符串
 */
const parseJsCodeKey = (key: string): string => {
  if (key.includes('token.')) {
    return `[\`${key}\`]`;
  }
  return `"${key}"`;
};

const transformSelector = (selector: string) => {
  if (selector.startsWith('.ant-')) {
    return selector;
  }
  if (selector.startsWith(':global(')) {
    return selector.replace(':global(', '').replace(')', '');
  }
  if (selector.startsWith('.')) {
    return selector.replace('.', '');
  }
  return selector;
};

/**
 * @title 解析 JS 代码
 * @param key - 键名
 * @returns 如果键名包含 `token.` 则返回原始值，否则返回字符串类型的参数值
 */
const parseJsCodeValue = (key: string): string => {
  if (key.includes('token.')) {
    return key;
  }
  if (key.includes("'")) {
    return `"${key}"`;
  }
  return `'${key}'`;
};
/**
 * @title 将 Map 转为 js 代码
 * @param cssMap - 需要转换的 Map
 * @returns 返回转换后的 js 代码字符串
 */
export const cssMapToJsCode = (
  cssMap: Map<string, Map<string, Map<string, any>>>
) => {
  let code = '';
  cssMap.forEach((value, mapKey) => {
    let key = parseJsCodeKey(transformSelector(mapKey));
    if (value instanceof Map) {
      const valueString = Array.from(value.entries())
        .map(([mapSubKey, subValue]) => {
          const subKey = transformSelector(mapSubKey);
          if (subValue instanceof Map) {
            if (subValue.size < 1) {
              return ``;
            }
            //   [`@media screen and (max-width: ${token.screenXL}px)`]: {}
            if (subKey.includes('token.')) {
              return `${subKey}: {${cssMapToJsCode(subValue)}}`;
            }
            // left: {}
            return `"${subKey}": {${cssMapToJsCode(subValue)}}`;
          }
          //  width: "144px",
          return `${subKey}: ${parseJsCodeValue(subValue)}`;
        })
        .filter(Boolean)
        .join(',');

      if (valueString && !key.endsWith('()"')) {
        code += `${key}: {
          ${valueString}
        },`;
      }

      return;
    }

    if (typeof value === 'string') {
      code += `${key}: ${parseJsCodeValue(value)},`;
      return;
    }
  });
  return code;
};

export const lessToCssInJs = (lessCode: string) => {
  const cssMap = less2CssObjectMap(
    lessCode
      .replaceAll(
        '.textOverflowMulti();',
        ` overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  word-break: break-all;`
      )
      .replaceAll(
        '.clearfix();',
        ` zoom: 1;
      &::before,
      &::after {
        display: table;
        content: ' ';
      }
      &::after {
        clear: both;
        height: 0;
        font-size: 0;
        visibility: hidden;
      }`
      )
      .replaceAll(
        '.textOverflow();',
        `overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        word-break: break-all;
 `
      )
  );
  const code = cssMapToJsCode(cssMap);
  if (code.includes('token.')) {
    return prettier.format(
      `import { createStyles } from 'antd-style';
  
      const useStyles = createStyles(({ token }) => { return {${code}}});
      
      export default useStyles;`,
      { parser: 'babel', plugins: [babelPLugin] }
    );
  }
  return prettier.format(
    `import { createStyles } from 'antd-style';

    const useStyles = createStyles(() => { return {${code}}});
    export default useStyles;`,
    {
      parser: 'babel-ts',
      singleQuote: true,
      trailingComma: 'all',
      printWidth: 100,
      proseWrap: 'never',
      endOfLine: 'lf',
      plugins: [babelPLugin, babelTsPlugin],
    }
  );
};
