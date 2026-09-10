import { test as base, expect } from '@playwright/test'
import { mkdtempSync, readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { AuthManifest } from '../global-setup'
import { loginAndSaveState } from '../utils/session'

/** Auth fixtures backed by per-worker logins. */

export type Role = 'owner' | 'admin' | 'superadmin' | 'member' | 'readonly'

/** The demo organization seeded by harmonize. */
export type AuthProfile = Role | 'demo'

const AUTH_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.auth')

export const authFile = (profile: AuthProfile): string => path.join(AUTH_DIR, `${profile}.json`)

export const readManifest = (): AuthManifest => JSON.parse(readFileSync(path.join(AUTH_DIR, 'manifest.json'), 'utf-8')) as AuthManifest

interface Credentials {
  email: string
  password: string
}

const credentialsForProfile = (profile: AuthProfile): Credentials | undefined => {
  const manifest = readManifest()
  if (profile === 'demo') {
    if (!manifest.demoEmail || !manifest.demoPassword) return undefined
    return { email: manifest.demoEmail, password: manifest.demoPassword }
  }
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
        if (!credentials) return authFile(profile)

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
