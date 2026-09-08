import type { Page } from '@playwright/test'

/** Local dev sets NEXT_PUBLIC_RECAPTCHA_SITE_KEY, so signup/forgot-password call grecaptcha — stub it out. */
export const installRecaptchaShim = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
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

  await page.route(/^https:\/\/(www\.google\.com|www\.gstatic\.com)\/recaptcha\//, (route) => route.abort())
}
