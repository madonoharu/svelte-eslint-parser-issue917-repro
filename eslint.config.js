import { defineConfig } from 'eslint/config';
import ts from 'typescript-eslint';

export default defineConfig({
  extends: [ts.configs.recommendedTypeChecked]
});
