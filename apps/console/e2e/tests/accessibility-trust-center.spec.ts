import { test } from '../fixtures/auth'
import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle, type ScannedRoute } from '../utils/accessibility'

const TRUST_CENTER_ROUTES: ScannedRoute[] = [
  { path: '/trust-center/overview' },
  { path: '/trust-center/analytics' },
  { path: '/trust-center/branding' },
  { path: '/trust-center/domain' },
  { path: '/trust-center/controls' },
  { path: '/trust-center/frameworks' },
  { path: '/trust-center/documents' },
  { path: '/trust-center/reports-and-certifications' },
  { path: '/trust-center/NDAs' },
  { path: '/trust-center/faqs' },
  { path: '/trust-center/updates' },
  { path: '/trust-center/customer-logos' },
  { path: '/trust-center/subprocessors' },
  { path: '/trust-center/subprocessors/from-vendors' },
  { path: '/trust-center/subscribers' },
]

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — trust center (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme, authProfile: 'demo' })

    for (const { path, ready } of TRUST_CENTER_ROUTES) {
      test(`${path} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        test.slow()
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
