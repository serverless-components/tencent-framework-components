module.exports = {
  root: true,
  extends: ['prettier'],
  plugins: ['import', 'prettier'],
  env: {
    es6: true,
    jest: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  globals: {
    on: true, // for the Socket file
  },
  rules: {
    'array-bracket-spacing': [
      'error',
      'never',
      {
        objectsInArrays: false,
        arraysInArrays: false,
      },
    ],
    'arrow-parens': ['error', 'always'],
    'arrow-spacing': ['error', { before: true, after: true }],
    curly: 'error',
    'eol-last': 'error',
    'func-names': 'off',
    'id-length': [
      'error',
      {
        min: 1,
        max: 50,
        properties: 'never',
        exceptions: ['e', 'i', 'n', 't', 'x', 'y', 'z', '_', '$'],
      },
    ],
    'no-alert': 'error',
    'no-console': 'off',
    'no-const-assign': 'error',
    'no-else-return': 'error',
    'no-empty': 'off',
    'no-shadow': 'error',
    'no-undef': 'error',
    'no-unused-vars': 'error',
    'no-use-before-define': 'error',
    'no-useless-constructor': 'error',
    'object-curly-newline': 'off',
    'object-shorthand': 'off',
    'prefer-const': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
        avoidEscape: true,
      },
    ],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'spaced-comment': 'error',
    strict: ['error', 'global'],
    'prettier/prettier': 'error',
  },
};
