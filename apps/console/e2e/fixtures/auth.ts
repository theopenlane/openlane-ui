import { test as base, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AuthManifest } from '../global-setup'

/**
 * Auth fixtures backed by the storage-state files written in global-setup.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/auth'   // logged in as Owner
 *
 *   test.describe('admin view', () => {
 *     test.use({ storageState: authFile('admin') })   // switch role
 *     test('...', async ({ page }) => { ... })
 *   })
 *
 * The default storage state is the Owner. Specs that exercise the login UI
 * itself (auth.spec.ts) must NOT import this — use the bare @playwright/test
 * `test` with `test.use({ storageState: { cookies: [], origins: [] } })`.
 */

export type Role = 'owner' | 'admin' | 'member' | 'readonly'

const AUTH_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth')

export const authFile = (role: Role): string => path.join(AUTH_DIR, `${role}.json`)

/** Read the run manifest (emails, shared org id) written by global-setup. */
export const readManifest = (): AuthManifest => JSON.parse(readFileSync(path.join(AUTH_DIR, 'manifest.json'), 'utf-8')) as AuthManifest

export const test = base.extend({
  storageState: authFile('owner'),
})

export { expect }
