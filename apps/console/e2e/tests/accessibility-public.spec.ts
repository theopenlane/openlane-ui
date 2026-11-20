import { test } from '@playwright/test'

import { A11Y_TAG, COLOR_SCHEMES, expectNoA11yViolations, waitForPageToSettle, type ScannedRoute } from '../utils/accessibility'
import { LOGIN_EMAIL_INPUT, SIGNUP_EMAIL_INPUT } from '../utils/constants'
import { installRecaptchaShim } from '../utils/recaptcha'

const PUBLIC_ROUTES: ScannedRoute[] = [
  { path: '/login', ready: (page) => page.locator(LOGIN_EMAIL_INPUT) },
  { path: '/signup', ready: (page) => page.locator(SIGNUP_EMAIL_INPUT) },
  { path: '/forgot-password', ready: (page) => page.locator(SIGNUP_EMAIL_INPUT) },
  { path: '/password-reset', ready: (page) => page.getByText(/^Choose a new password$/) },
  { path: '/resend-verify' },
  { path: '/verify', ready: (page) => page.getByText(/Thank you for signing up/) },
  { path: '/questionnaire', ready: (page) => page.getByText(/unable to load questionnaire/i) },
]

test.describe.configure({ retries: 0 })

for (const colorScheme of COLOR_SCHEMES) {
  test.describe(`accessibility — public pages (${colorScheme})`, { tag: A11Y_TAG }, () => {
    test.use({ colorScheme })

    for (const { path, ready } of PUBLIC_ROUTES) {
      test(`${path} has no WCAG 2.2 AA violations`, async ({ page }, testInfo) => {
        await installRecaptchaShim(page)
        await page.goto(path, { waitUntil: 'domcontentloaded' })
        await waitForPageToSettle(page, ready)

        await expectNoA11yViolations(page, testInfo)
      })
    }
  })
}
