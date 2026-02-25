import { nextJsConfig } from '@repo/eslint-config/next-js'

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    ignores: ['node_modules/**', '.storybook/generated/**', 'storybook-static/**'],
  },
  ...nextJsConfig,
  {
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]
