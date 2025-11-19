import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist','node_modules','.vite','coverage','.DS_Store','next-api/.next','next-api/node_modules']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow intentionally unused patterns:
      // - Unused UPPER_CASE vars (placeholders/constants)
      // - Unused function args prefixed with _
      // - Unused catch binding (we often use catch (_) {})
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_', caughtErrors: 'none' }],
      // Permit empty catch blocks (we add comments where helpful, but allow silent no-ops too)
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
])
