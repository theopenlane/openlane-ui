import { test } from '@playwright/test'

import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle } from '../utils/accessibility'
import { scanCasesFor } from '../utils/accessibility-routes'
import { installRecaptchaShim } from '../utils/recaptcha'

const PUBLIC_ROUTES = scanCasesFor('public')

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — public pages (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme })

    for (const { name, path, ready } of PUBLIC_ROUTES) {
      test(`${name} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        await installRecaptchaShim(page)
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
