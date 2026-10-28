import { nextJsConfig } from '@repo/eslint-config/next-js'

/** @type {import("eslint").Linter.Config} */
export default [
  ...nextJsConfig,
  {
    files: ['src/components/shared/sanitized-html/sanitized-html.tsx', 'src/components/pages/protected/policies/view/fields/integration-document-view.tsx'],
    rules: {
      '@eslint-react/dom-no-dangerously-set-innerhtml': 'off',
    },
  },
]
