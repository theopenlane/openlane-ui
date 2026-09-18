import type { Page } from '@playwright/test'

import { installRecaptchaShim } from './recaptcha'

/** Submit the login form via the UI. */
export const loginViaForm = async (page: Page, email: string, password: string): Promise<void> => {
  await installRecaptchaShim(page)
  await page.goto('/login')

  const webfingerResponse = page.waitForResponse(/\/api\/auth\/webfinger/)
  await page.getByPlaceholder(/Enter your email/i).fill(email)
  await webfingerResponse

  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /^login$/i }).click()
}
