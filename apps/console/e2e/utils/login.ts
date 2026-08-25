import type { Page } from '@playwright/test'

import { installRecaptchaShim } from './recaptcha'

/**
 * Submit the login form via the UI. Caller is responsible for asserting
 * the post-submit state (redirect, error, etc.) — this just performs the
 * keystrokes and click.
 *
 * The reCAPTCHA shim is installed unconditionally: login.tsx gates the submit
 * on `recaptchaSiteKey`, and the dev `.env` ships a real key. The shim stubs
 * grecaptcha + mocks /api/recaptchaVerify; it's a no-op when the key is unset.
 */
export const loginViaForm = async (page: Page, email: string, password: string): Promise<void> => {
  await installRecaptchaShim(page)
  await page.goto('/login')

  // Webfinger fires 500ms after email-input change. Wait for it to settle
  // so the password field actually renders before we try to fill it.
  const webfingerResponse = page.waitForResponse(/\/api\/auth\/webfinger/)
  await page.getByPlaceholder(/Enter your email/i).fill(email)
  await webfingerResponse

  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /^login$/i }).click()
}
