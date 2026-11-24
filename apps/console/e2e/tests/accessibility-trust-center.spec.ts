import { test } from '../fixtures/auth'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle } from '../utils/accessibility'
import { scanCasesFor } from '../utils/accessibility-routes'

const TRUST_CENTER_ROUTES = scanCasesFor('trust-center')

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — trust center (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme, authProfile: 'demo' })

    for (const { name, path, ready } of TRUST_CENTER_ROUTES) {
      test(`${name} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        test.slow()
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
