import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginImport from 'eslint-plugin-import';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends('eslint:recommended'),
  ...compat.extends('plugin:react/recommended'),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react: eslintPluginReact,
      import: eslintPluginImport,
    },
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        alias: {
          map: [
            ['@', './src'],
            ['@app', './src/app'],
            ['@pages', './src/pages'],
            ['@widgets', './src/widgets'],
            ['@features', './src/features'],
            ['@entities', './src/entities'],
            ['@shared', './src/shared'],
          ],
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
];
