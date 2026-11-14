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
  {
    files: [
      'src/app/api/**',
      'src/lib/server/**',
      'src/lib/auth/auth.ts',
      'src/lib/auth/providers/**',
      'src/lib/auth/utils/refresh-token.ts',
      'src/lib/auth/utils/core-api-request.ts',
      'src/lib/auth/utils/register-oauth-user.ts',
    ],
    ignores: ['src/lib/server/core-fetch.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/secure-fetch'],
              importNames: ['secureFetch'],
              message: 'Server code calls core through serverSecureFetch (@/lib/server/core-fetch) so the visitor IP is forwarded.',
            },
          ],
        },
      ],
    },
  },
]
