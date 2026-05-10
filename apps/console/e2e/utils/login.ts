import type { Page } from '@playwright/test'

/**
 * Submit the login form via the UI. Caller is responsible for asserting
 * the post-submit state (redirect, error, etc.) — this just performs the
 * keystrokes and click.
 */
export const loginViaForm = async (page: Page, email: string, password: string): Promise<void> => {
  await page.goto('/login')

  // Webfinger fires 500ms after email-input change. Wait for it to settle
  // so the password field actually renders before we try to fill it.
  const webfingerResponse = page.waitForResponse(/\/api\/auth\/webfinger/)
  await page.getByPlaceholder(/Enter your email/i).fill(email)
  await webfingerResponse

  await page.locator('input[name="password"]').fill(password)
  await page.getByRole('button', { name: /^login$/i }).click()
}
