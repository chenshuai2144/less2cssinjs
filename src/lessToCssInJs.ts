import postcssLess from 'postcss-less';
import postcss, { Root, ChildNode } from 'postcss';
import prettier from 'prettier';

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
  '@font-size-base': 'fontSize',
  '@border-color-split': 'colorBorderSplit',
  '@text-color': 'colorText',
  '@heading-color': 'colorTextHeading',
  '@text-color-secondary': 'colorTextSecondary',
  '@border-color-base': 'colorBorder',
  '@component-background': 'colorBgContainer',
  '@screen-lg': 'screenLG',
  '@screen-md': 'screenMD',
  '@screen-xs': 'screenXD',
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
      return true;
    }
  }
  return false;
}
/**
 * 解析节点的值, 如果是变量, 则返回 token.变量名
 * @param node
 * @returns  string
 */
const praseNodeValue = (value: string): string => {
  if (hasMultipleAtSymbols(value)) {
    return `\`${value
      .split(' ')
      .map((item) => {
        if (item.startsWith('@')) {
          return `\${${praseNodeValue(item)}}`;
        }
        return item;
      })
      .join(' ')}\``;
  }
  if (value.startsWith('@')) {
    if (tokenMap[value as '@input-bg']) {
      return `token.${tokenMap[value as '@input-bg']}`;
    }
    return `token.${toCamelCase(value.replace('@', ''))}`;
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
        `\${token.${tokenMap[value as '@input-bg']}}`
      );
    }
    return selector.replaceAll('@', 'token.');
  }
  return selector;
};

/**
 * 转化节点的选择器，去除括号
 * @param selector
 * @returns
 */
const parseNodeSelector = (selector: string) => {
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
        .map((item) => item.replace('.', ''))
        .filter(Boolean);
    }
    return selector.replace('.', '');
  }
  if (!selector.includes('@media')) {
    const reg = /^.+\(.+\)$/g;
    if (reg.test(selector)) return '';
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
  node: ChildNode
): Map<string, string | Map<string, string>> => {
  const cssMap = new Map();
  if (node.type === 'comment') {
    node.remove();
  }
  if (node.type === 'atrule') {
    if (node.name === 'import') {
      return cssMap;
    }
    if (node.name === 'media') {
      const mediaMap = new Map();
      node.nodes?.forEach((node) => {
        nodeToCssOject(node).forEach((value, key) => {
          mediaMap.set(key, value);
        });
      });
      cssMap.set(`@media ${praseNodeParams(node.params)}`, mediaMap);
    }
  }
  if (node.type === 'rule') {
    /**
     * @type {string} - 选择器名
     */
    let selector = parseNodeSelector(node.selector);

    if (!selector) {
      return cssMap;
    }
    if (Array.isArray(selector)) {
      selector.map((selectorItem) => {
        cssMap.set(selectorItem, new Map<string, string>());
      });
    } else if (selector !== ':global') {
      cssMap.set(selector, new Map<string, string>());
    }

    node.nodes?.forEach((node) => {
      if (node.type === 'decl') {
        [selector].flat(1).forEach((selectorItem) => {
          if (selectorItem === ':global') {
            cssMap.set(toCamelCase(node.prop), praseNodeValue(node.value));
          } else {
            cssMap
              .get(selectorItem)
              ?.set(toCamelCase(node.prop), praseNodeValue(node.value));
          }
        });
      } else {
        nodeToCssOject(node)?.forEach((value, key) => {
          if (key.startsWith('&')) {
            [selector].flat(1).forEach((selectorItem) => {
              if (key.startsWith('&.')) {
                cssMap.set(key.replaceAll('&.', ''), value);
              } else {
                cssMap.get(selectorItem)?.set(key, value);
              }
            });
          } else {
            cssMap.set(key, value);
          }
        });
      }
    });
  }
  return cssMap;
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
    if (node?.parent?.type !== 'root') return;
    if (node.type === 'atrule' && node.name === 'import') return;
    nodeToCssOject(node)?.forEach((value, key) => {
      cssMap.set(key, value);
    });
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

/**
 * @title 解析 JS 代码
 * @param key - 键名
 * @returns 如果键名包含 `token.` 则返回原始值，否则返回字符串类型的参数值
 */
const parseJsCodeValue = (key: string): string => {
  if (key.includes('token.')) {
    return key;
  }
  return `"${key}"`;
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
    let key = parseJsCodeKey(mapKey);
    if (value instanceof Map) {
      const valueString = Array.from(value.entries())
        .map(([key, subValue]) => {
          if (subValue instanceof Map) {
            return `"${key}": {${cssMapToJsCode(subValue)}}`;
          }
          return `${key}: ${parseJsCodeValue(subValue)}`;
        })
        .join(',');
      code += `
      ${key}: {
        ${valueString}
      },`;
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
  const cssMap = less2CssObjectMap(lessCode);
  const code = cssMapToJsCode(cssMap);
  if (code.includes('token.')) {
    return prettier.format(
      `import { createStyles } from 'antd-style';
  
      const useStyles = createStyles(({ token }) => { return {${code}}});
      
      export default useStyles;`,
      { parser: 'babel' }
    );
  }
  return prettier.format(
    `import { createStyles } from 'antd-style';

    const useStyles = createStyles(() => { return {${code}}});
    export default useStyles;`,
    { parser: 'babel-ts' }
  );
};
