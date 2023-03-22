import { defineConfig } from 'father';

export default defineConfig({
  esm: { input: 'src/index' },
  cjs: { input: 'src/index' },
});
