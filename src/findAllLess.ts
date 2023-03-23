import fs from 'fs';
import path from 'path';
import { lessToCssInJs } from './lessToCssInJs';
import { stylesImportToCssInJs } from './stylesImportToCssinjs';

/**
 * 搜索目录下所有的less文件
 * @param dir
 * @returns
 */
export const findAllLessFiles = (dir: string) => {
  const files = fs.readdirSync(dir);
  const lessFiles: string[] = [];
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (filePath.includes('.umi')) return;
      lessFiles.push(...findAllLessFiles(filePath));
    } else if (stat.isFile() && file.endsWith('.less')) {
      lessFiles.push(filePath);
    }
  });
  return lessFiles;
};

export const findAllTsxFiles = (dir: string) => {
  const files = fs.readdirSync(dir);
  const lessFiles: string[] = [];
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (filePath.includes('.umi')) return;
      lessFiles.push(...findAllTsxFiles(filePath));
    } else if (stat.isFile() && file.endsWith('.tsx')) {
      lessFiles.push(filePath);
    }
  });
  return lessFiles;
};
// const dirPath = '/Users/shuaichen/Documents/github/ant-design-pro/src/';

// findAllLessFiles(dirPath).map((item) => {
//   if (item.endsWith('global.less')) {
//     return;
//   }
//   const content = fs.readFileSync(item, 'utf-8');
//   const ts = lessToCssInJs(
//     content
//       .replaceAll(
//         '.textOverflowMulti();',
//         ` overflow: hidden;
//       white-space: nowrap;
//       text-overflow: ellipsis;
//       word-break: break-all;`
//       )
//       .replaceAll(
//         '.clearfix();',
//         ` zoom: 1;
//           &::before,
//           &::after {
//             display: table;
//             content: ' ';
//           }
//           &::after {
//             clear: both;
//             height: 0;
//             font-size: 0;
//             visibility: hidden;
//           }`
//       )
//       .replaceAll(
//         '.textOverflow();',
//         ` position: relative;
//       max-height: 4.5em;
//       margin-right: -1em;
//       padding-right: 1em;
//       overflow: hidden;
//       line-height: 1.5em;
//       text-align: justify;
//       &::before {
//         position: absolute;
//         right: 14px;
//         bottom: 0;
//         padding: 0 1px;
//         background: @bg;
//         content: '...';
//       }
//       &::after {
//         position: absolute;
//         right: 14px;
//         width: 1em;
//         height: 1em;
//         margin-top: 0.2em;
//         background: white;
//         content: '';
//       }`
//       )
//   );
//   // console.log(item.replaceAll(dirPath, '') + ' ' + '😁 编译成功');
//   fs.writeFileSync(item.replace('.less', '.style.ts'), ts);

//   findAllTsxFiles(path.parse(item).dir).map((jsFileItem) => {
//     const tsxContent = fs.readFileSync(jsFileItem, 'utf-8');
//     if (tsxContent.includes(".less'")) {
//       try {
//         fs.writeFileSync(jsFileItem, stylesImportToCssInJs(tsxContent));
//       } catch (error) {
//         console.log(error, jsFileItem);
//       }
//     }
//   });
// });

/**
 * 转换 less 和 tsx文件
 * @param dir 文件夹目录，最好是 src
 */
export const transformCssAndTsx = (dir: string) => {
  findAllLessFiles(dir).map((item) => {
    if (item.endsWith('global.less')) {
      return;
    }
    const content = fs.readFileSync(item, 'utf-8');
    const ts = lessToCssInJs(
      content
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
          ` position: relative;
        max-height: 4.5em;
        margin-right: -1em;
        padding-right: 1em;
        overflow: hidden;
        line-height: 1.5em;
        text-align: justify;
        &::before {
          position: absolute;
          right: 14px;
          bottom: 0;
          padding: 0 1px;
          background: @bg;
          content: '...';
        }
        &::after {
          position: absolute;
          right: 14px;
          width: 1em;
          height: 1em;
          margin-top: 0.2em;
          background: white;
          content: '';
        }`
        )
    );
    // console.log(item.replaceAll(dirPath, '') + ' ' + '😁 编译成功');
    fs.writeFileSync(item.replace('.less', '.style.ts'), ts);

    findAllTsxFiles(path.parse(item).dir).map((jsFileItem) => {
      const tsxContent = fs.readFileSync(jsFileItem, 'utf-8');
      if (tsxContent.includes(".less'")) {
        try {
          fs.writeFileSync(jsFileItem, stylesImportToCssInJs(tsxContent));
        } catch (error) {
          console.log(error, jsFileItem);
        }
      }
    });
  });
};
