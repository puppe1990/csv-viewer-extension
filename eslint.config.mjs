import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['vendor/**', 'node_modules/**', 'coverage/**']
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  {
    files: ['background.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        chrome: 'readonly'
      }
    }
  },
  {
    files: ['app.js', 'viewer.js', 'shared/**/*.js'],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        XLSX: 'readonly'
      }
    }
  }
];
