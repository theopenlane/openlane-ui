import { test as base, expect } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { readManifest } from '../utils/manifest'
import { loginAndSaveState } from '../utils/session'

export { readManifest }

/** Auth fixtures backed by per-worker logins. */

export type Role = 'owner' | 'admin' | 'superadmin' | 'member' | 'readonly'

/** An externally seeded organization with a provisioned trust center. */
export type AuthProfile = Role | 'demo'

interface Credentials {
  email: string
  password: string
}

const credentialsForProfile = (profile: AuthProfile): Credentials => {
  const manifest = readManifest()
  if (profile === 'demo') return { email: manifest.demoEmail, password: manifest.demoPassword }
  return { email: profile === 'owner' ? manifest.ownerEmail : manifest.roleEmails[profile], password: manifest.password }
}

type SessionFor = (profile: AuthProfile) => Promise<string>

/** Every worker logs its own profiles in, rather than all workers replaying the single storage state global-setup captured. */
export const test = base.extend<{ authProfile: AuthProfile }, { sessionFor: SessionFor }>({
  authProfile: ['owner', { option: true }],

  sessionFor: [
    async ({ browser }, provide) => {
      const dir = mkdtempSync(path.join(os.tmpdir(), 'openlane-e2e-auth-'))
      const cache = new Map<AuthProfile, string>()

      const sessionFor: SessionFor = async (profile) => {
        const cached = cache.get(profile)
        if (cached) return cached

        const credentials = credentialsForProfile(profile)
        const outPath = path.join(dir, `${profile}.json`)
        await loginAndSaveState(browser, credentials.email, credentials.password, outPath)
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
