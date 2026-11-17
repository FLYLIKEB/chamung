import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'backend/**'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    // Runtime correctness rules; TypeScript owns name resolution and type checking.
    rules: {
      'constructor-super': 'error',
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-constant-condition': 'error',
      'no-dupe-args': 'error',
      'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error',
      'no-unsafe-finally': 'error',
      'no-unreachable': 'error',
      'valid-typeof': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
    },
  },
];
