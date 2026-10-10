import type { Page } from '@playwright/test'

import { installRecaptchaShim } from './recaptcha'

export const waitForLoginMethodCheck = (page: Page) =>
  page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/login' && Boolean(response.request().headers()['next-action']))

/** Submit the login form via the UI. */
export const loginViaForm = async (page: Page, email: string, password: string): Promise<void> => {
  await installRecaptchaShim(page)
  await page.goto('/login')

  const loginMethodCheck = waitForLoginMethodCheck(page)
  await page.getByPlaceholder(/Enter your email/i).fill(email)
  await loginMethodCheck

  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /^login$/i }).click()
}
