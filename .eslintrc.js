module.exports = {
  extends: ['eslint:recommended', 'plugin:react/recommended', 'plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint', 'react', 'import'],
  rules: {
    'max-lines': ['warn', 400],
    'max-lines-per-function': ['warn', 50],
    'complexity': ['warn', 10],
    'import/order': ['warn', { 'newlines-between': 'always', 'groups': ['builtin','external','internal','parent','sibling','index'] }],
    'react/jsx-max-depth': ['warn', { 'max': 3 }],
    '@typescript-eslint/explicit-function-return-type': ['warn'],
  },
};
