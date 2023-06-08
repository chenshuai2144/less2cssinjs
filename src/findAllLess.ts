import fs from 'fs';
import path from 'path';
import { lessToCssInJs } from './lessToCssInJs';
import { stylesImportToCssInJs } from './stylesImportToCssInJs';

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

/**
 * 转换 less 和 tsx文件
 * @param dir 文件夹目录，最好是 src
 */
export const transformCssAndTsx = (dir: string) => {
  const allLessFiles = findAllLessFiles(dir).filter((item) => {
    if (item.endsWith('global.less')) {
      return false;
    }
    return true;
  });

  if (allLessFiles.length < 1) {
    console.log('未找到less文件');
    return;
  }

  console.log('开始转化' + allLessFiles.length + '个文件');
  allLessFiles.map((item) => {
    console.log('转化文件：' + item);

    const content = fs.readFileSync(item, 'utf-8');
    const ts = lessToCssInJs(content);
    // console.log(item.replaceAll(dirPath, '') + ' ' + '😁 编译成功');
    fs.writeFileSync(item.replace('.less', '.style.ts'), ts);
    console.log('转化 tsx');
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
