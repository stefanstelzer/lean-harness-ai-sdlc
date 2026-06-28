import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // `.archgate/**/*.rules.ts` are archgate rule modules: tooling validated by
    // the archgate CLI against `.archgate/rules.d.ts` (triple-slash reference),
    // not part of the library source — so they are not linted here.
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.archgate/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Node scripts and config files run outside the TS source layer.
    files: ['scripts/**/*.mjs', '*.config.js', '*.config.cjs', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
  },
);
