import type { Browser, BrowserContext } from '@playwright/test'
import { chmodSync, writeFileSync } from 'node:fs'

import { BASE_URL } from './constants'
import { loginViaForm } from './login'

const SAVED_SESSION_TTL_MS = 2 * 60 * 60 * 1000

/** Capture a context's storage state, extending any short-lived cookie so the browser still sends it for the length of a run. */
export const saveStorageState = async (context: BrowserContext, outPath: string): Promise<void> => {
  const state = await context.storageState()
  const minExpiry = Math.floor((Date.now() + SAVED_SESSION_TTL_MS) / 1000)
  for (const cookie of state.cookies) {
    if (cookie.expires > 0 && cookie.expires < minExpiry) cookie.expires = minExpiry
  }
  writeFileSync(outPath, JSON.stringify(state, null, 2), { mode: 0o600 })
  chmodSync(outPath, 0o600)
}

/** Log a user in through the real login UI and write the resulting storage state. */
export const loginAndSaveState = async (browser: Browser, email: string, password: string, outPath: string): Promise<void> => {
  const context = await browser.newContext({ baseURL: BASE_URL })
  try {
    const page = await context.newPage()
    await loginViaForm(page, email, password)
    await page.waitForURL(/\/dashboard/, { timeout: 60_000 })
    await saveStorageState(context, outPath)
  } finally {
    await context.close()
  }
}
