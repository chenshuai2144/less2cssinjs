#!/usr/bin/env node

const program = require('commander');
const package = require('../package.json');
const { transformCssAndTsx } = require('../dist/cjs/findAllLess');

program
  .version(package.version)
  .usage('[options] <file ...>')
  .option('-i, --input <n>', '一个路径', (inputPath) => {
    transformCssAndTsx(inputPath);
  });

program.on('--help', function () {
  console.log('');
  console.log('Examples:');
  console.log('  $ less2js --help');
  console.log('  $ less2js -h');
});

program.parse(process.argv);
