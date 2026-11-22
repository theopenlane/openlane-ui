import { expect } from '@playwright/test'

import { test } from '../fixtures/auth'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle } from '../utils/accessibility'
import { ROUTE_TABLE_PROBLEMS, scanCasesFor } from '../utils/accessibility-routes'

const APP_ROUTES = scanCasesFor('app')

test.describe.configure({ retries: 0 })

test('accessibility route tables cover every page in src/app', { tag: A11Y_TAG }, () => {
  expect(ROUTE_TABLE_PROBLEMS, 'update e2e/utils/accessibility-routes.ts').toEqual([])
})

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — app pages (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme })

    for (const { name, path, ready } of APP_ROUTES) {
      test(`${name} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        test.slow()
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
