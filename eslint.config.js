import js from '../Anima-react/node_modules/@eslint/js/src/index.js'
import globals from '../Anima-react/node_modules/globals/index.js'
import reactHooks from '../Anima-react/node_modules/eslint-plugin-react-hooks/index.js'
import reactRefresh from '../Anima-react/node_modules/eslint-plugin-react-refresh/index.js'

export default [
  { ignores: ['dist', 'public', 'node_modules'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
]
