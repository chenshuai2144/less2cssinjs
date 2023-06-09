import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import prettier from 'prettier/standalone';
import babelPLugin from 'prettier/parser-babel';
import babelTsPlugin from 'prettier/parser-typescript';

export const stylesImportToCssInJs = (jsCode: string) => {
  const ast = parse(jsCode, {
    sourceType: 'module',
    allowImportExportEverywhere: true,
    plugins: ['jsx', 'decorators-legacy', 'typescript'],
  });
  let stylesName = 'styles';
  traverse(ast, {
    ImportDeclaration(path) {
      // 这里只处理 import 语句
      // 把 .less 后缀的文件替换成 .style.ts，并且把引入的变量名改成 useStyles
      if (path.type === 'ImportDeclaration') {
        const value = path.node.source.value;
        if (value.includes('.less')) {
          const specifier = path.node.specifiers.at(0);
          if (specifier) {
            stylesName = specifier.local.name;
            // 把引入的变量名改成 useStyles
            specifier.local.name = 'useStyles';
          }
          // 把 .less 后缀的文件替换成 .style.ts
          path.node.source.value = value.replace('.less', '.style');
        }
      }
    },
    VariableDeclaration(path) {
      if (path.type === 'VariableDeclaration') {
        // @ts-ignore
        const name = path.node.declarations[0].id.name;

        if (/^[A-Z]/.test(name)) {
          if (
            path.parent.type === 'Program' ||
            path.parent.type === 'ExportNamedDeclaration'
          ) {
            const init = path.node.declarations[0].init;
            const initCode = generate(path.node).code;
            if (
              init &&
              initCode.includes(stylesName) &&
              init.type === 'ArrowFunctionExpression'
            ) {
              const codeBody = init.body;
              const importStyleString =
                stylesName !== 'styles'
                  ? `const {styles:${stylesName}} = useStyles();`
                  : `const {styles} = useStyles();`;
              if (codeBody.type === 'BlockStatement') {
                codeBody.body.unshift(parse(importStyleString).program.body[0]);
              }

              if (codeBody.type === 'JSXElement') {
                // @ts-ignore
                init.body = t.blockStatement([
                  parse(importStyleString).program.body[0],
                  t.returnStatement(codeBody),
                ]);
              }
            }
          }
        }
      }
    },
  });

  const { code } = generate(
    ast,
    {
      comments: true,
      compact: true,
      retainLines: true,
    },
    jsCode
  );
  return prettier.format(code, {
    parser: 'babel-ts',
    singleQuote: true,
    trailingComma: 'all',
    printWidth: 100,
    proseWrap: 'never',
    endOfLine: 'lf',
    plugins: [babelPLugin, babelTsPlugin],
  });
};
