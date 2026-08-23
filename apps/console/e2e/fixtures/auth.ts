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

/**
 * The demo organization seeded by harmonize. Unlike the org global-setup
 * creates, it has a provisioned trust center — so specs covering trust-center
 * surfaces run against it. Guard with `readManifest().hasDemoSession`, which is
 * false in environments without the demo seed.
 */
export type AuthProfile = Role | 'demo'

const AUTH_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth')

export const authFile = (profile: AuthProfile): string => path.join(AUTH_DIR, `${profile}.json`)

/** Read the run manifest (emails, shared org id) written by global-setup. */
export const readManifest = (): AuthManifest => JSON.parse(readFileSync(path.join(AUTH_DIR, 'manifest.json'), 'utf-8')) as AuthManifest

export const test = base.extend({
  storageState: authFile('owner'),
})

export { expect }
