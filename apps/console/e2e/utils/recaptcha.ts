import type { Page } from '@playwright/test'

/**
 * The local dev `.env` ships with NEXT_PUBLIC_RECAPTCHA_SITE_KEY set, which
 * makes signup/forgot-password forms call window.grecaptcha and POST to
 * /api/recaptchaVerify (which round-trips to Google). Neither path is
 * available in a clean Playwright context, so test runs would otherwise
 * fall into the form's outer try/catch and surface "Unknown error".
 *
 * This helper:
 *   1. Stubs window.grecaptcha so .execute() resolves with a deterministic
 *      token before the page script reads grecaptcha.
 *   2. Routes the local /api/recaptchaVerify endpoint to always return
 *      { success: true, score: 1 }, bypassing Google verification.
 *
 * Call this before page.goto() for any auth form whose component path
 * branches on `recaptchaSiteKey`.
 */
export const installRecaptchaShim = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    // Define a global grecaptcha that satisfies the call shape used in
    // signup.tsx and forgot-password.tsx: grecaptcha.execute(siteKey, opts).
    ;(window as unknown as { grecaptcha: { execute: (key: string, opts: { action: string }) => Promise<string> } }).grecaptcha = {
      execute: async () => 'e2e-fake-recaptcha-token',
    }
  })

  await page.route('**/api/recaptchaVerify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, score: 1, action: 'e2e' }),
    })
  })

  // Block Google's real reCAPTCHA bundle. If it loads it overwrites our
  // window.grecaptcha stub with the real invisible widget, whose .execute()
  // can hang — making login non-deterministic. Aborting these keeps our stub.
  await page.route(/https:\/\/(www\.google\.com|www\.gstatic\.com)\/recaptcha\//, (route) => route.abort())
}
