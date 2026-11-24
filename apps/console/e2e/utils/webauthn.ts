import { expect, type Page } from '@playwright/test'

import { waitForPath } from './login'

export const attachVirtualAuthenticator = async (page: Page): Promise<void> => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('WebAuthn.enable')
  await cdp.send('WebAuthn.addVirtualAuthenticator', {
    options: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  })
}

export const registerPasskeyFromProfile = async (page: Page): Promise<void> => {
  await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
  await expect(page.getByText('Passkeys and Security Keys', { exact: true })).toBeVisible({ timeout: 30_000 }) // 30s

  const registered = waitForPath(page, '/api/auth/registration-verification')
  await page.getByRole('button', { name: 'Add passkey' }).click()
  expect((await registered).ok()).toBe(true)
  await expect(page.getByText('Passkeys successfully setup')).toBeVisible({ timeout: 15_000 }) // 15s
}
