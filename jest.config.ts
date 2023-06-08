const { readdirSync } = require('fs');
const { join } = require('path');

module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': ['esbuild-jest', { sourcemap: true }],
  },
  cacheDirectory: './.jest/cache',
  transformIgnorePatterns: [`/node_modules/(?!${[].join('|')})`],
  unmockedModulePathPatterns: ['node_modules/react/'],
  verbose: true,
};
