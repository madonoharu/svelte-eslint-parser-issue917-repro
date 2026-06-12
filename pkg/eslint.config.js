import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';

// Importing the root flat config is what triggers the bug.
// Removing this import (and inlining ts.configs.recommendedTypeChecked below)
// makes the errors disappear. Keeping it as a pure side-effect import
// (without using `rootConfig` in `extends`) still reproduces the errors.
import rootConfig from '../eslint.config.js';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(
  {
    extends: [rootConfig, svelte.configs.recommended],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir,
        extraFileExtensions: ['.svelte']
      }
    }
  },
  {
    files: ['eslint.config.js'],
    extends: [ts.configs.disableTypeChecked]
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parserOptions: { parser: ts.parser }
    }
  }
);
