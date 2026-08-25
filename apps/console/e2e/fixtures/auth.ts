import { test as base, expect } from '@playwright/test'
import { mkdtempSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AuthManifest } from '../global-setup'
import { loginAndSaveState } from '../utils/session'

/**
 * Auth fixtures backed by per-worker logins.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/auth'   // logged in as Owner
 *
 *   test.describe('admin view', () => {
 *     test.use({ authProfile: 'admin' })              // switch role
 *     test('...', async ({ page }) => { ... })
 *   })
 *
 * Specs that exercise the login UI itself (auth.spec.ts) must NOT import this —
 * use the bare @playwright/test `test` with an empty storageState.
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

const emailForProfile = (profile: Role): string => {
  const manifest = readManifest()
  return profile === 'owner' ? manifest.ownerEmail : manifest.roleEmails[profile]
}

type SessionFor = (profile: AuthProfile) => Promise<string>

/**
 * Every worker logs its own profiles in, rather than all workers replaying the
 * single storage state global-setup captured.
 *
 * That shared state was a catastrophic single point of failure: a transient
 * GraphQL 401 makes the console attempt a token refresh, and while the refresh
 * token is still before its `nbf` core answers 400. The console reads that as a
 * dead session, opens the session-expired modal, and the modal calls signOut()
 * — whose NextAuth event POSTs /v1/logout and REVOKES the tokens and session
 * server-side (auth.ts events.signOut). With one shared session that revocation
 * killed every other worker in the run, present and future.
 *
 * A separate login per worker mints a separate token pair and server session,
 * so a false expiry is contained to the worker that hit it. Logins happen
 * lazily on first use and are cached for the worker's lifetime; a replacement
 * worker spawned after a failure logs in fresh, which is exactly what the
 * previous file-based scheme could not do.
 */
export const test = base.extend<{ authProfile: AuthProfile }, { sessionFor: SessionFor }>({
  authProfile: ['owner', { option: true }],

  sessionFor: [
    async ({ browser }, provide) => {
      const dir = mkdtempSync(path.join(os.tmpdir(), 'openlane-e2e-auth-'))
      const cache = new Map<AuthProfile, string>()

      const sessionFor: SessionFor = async (profile) => {
        // The demo org is seeded outside this run and has its own credentials,
        // so it keeps using the session global-setup captured.
        if (profile === 'demo') return authFile('demo')

        const cached = cache.get(profile)
        if (cached) return cached

        const outPath = path.join(dir, `${profile}.json`)
        await loginAndSaveState(browser, emailForProfile(profile), readManifest().password, outPath)
        cache.set(profile, outPath)
        return outPath
      }

      await provide(sessionFor)
    },
    { scope: 'worker' },
  ],

  storageState: async ({ authProfile, sessionFor }, provide) => {
    await provide(await sessionFor(authProfile))
  },
})

export { expect }
