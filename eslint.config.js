export default (async () => {
  let compat;
  try {
    const { FlatCompat } = await import('@eslint/eslintrc');
    compat = new FlatCompat({
      baseDirectory: __dirname,
    });
  } catch {
    console.warn('@eslint/eslintrc not found, using minimal config');
    compat = { extends: () => [] };
  }

  let reactPlugin;
  let reactExtends = [];
  let importPlugin;
  try {
    const pkg = await import('eslint-plugin-react');
    reactPlugin = pkg.default ?? pkg;
    reactExtends = compat.extends('plugin:react/recommended');
  } catch {
    console.warn('eslint-plugin-react not found, skipping related rules');
  }
  try {
    const importPkg = await import('eslint-plugin-import');
    importPlugin = importPkg.default ?? importPkg;
  } catch {
    console.warn('eslint-plugin-import not found, skipping related rules');
  }

  return [
    ...compat.extends('eslint:recommended'),
    ...reactExtends,
    {
      files: ['**/*.{ts,tsx,js,jsx}'],
      plugins: {
        ...(reactPlugin ? { react: reactPlugin } : {}),
        ...(importPlugin ? { import: importPlugin } : {}),
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
})();
