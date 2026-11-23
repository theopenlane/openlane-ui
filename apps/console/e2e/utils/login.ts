import type { Page, Response } from '@playwright/test'

import { LOGIN_EMAIL_INPUT, PASSWORD_INPUT } from './constants'
import { installRecaptchaShim } from './recaptcha'

export const waitForPath = (page: Page, pathname: string): Promise<Response> => page.waitForResponse((response) => new URL(response.url()).pathname === pathname)

export const waitForLoginMethodCheck = (page: Page) =>
  page.waitForResponse((response) => response.request().method() === 'POST' && new URL(response.url()).pathname === '/login' && Boolean(response.request().headers()['next-action']))

export const enterLoginEmail = async (page: Page, email: string): Promise<void> => {
  await installRecaptchaShim(page)
  await page.goto('/login')

  const loginMethodCheck = waitForLoginMethodCheck(page)
  await page.locator(LOGIN_EMAIL_INPUT).fill(email)
  await loginMethodCheck
}

/** Submit the login form via the UI. */
export const loginViaForm = async (page: Page, email: string, password: string): Promise<void> => {
  await enterLoginEmail(page, email)
  await page.locator(PASSWORD_INPUT).fill(password)
  await page.getByRole('button', { name: /^login$/i }).click()
}
