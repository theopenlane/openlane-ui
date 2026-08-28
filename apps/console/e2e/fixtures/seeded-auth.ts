import { test as base, expect } from '@playwright/test'
import { mkdtempSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { loginAndSaveState } from '../utils/session'
import { seededUser, type SeededRole } from '../utils/seeded-users'

export type { SeededRole }

type SessionFor = (role: SeededRole) => Promise<string>

export const test = base.extend<{ seededRole: SeededRole }, { seededSessionFor: SessionFor }>({
  seededRole: ['owner', { option: true }],

  seededSessionFor: [
    async ({ browser }, provide) => {
      const dir = mkdtempSync(path.join(os.tmpdir(), 'openlane-e2e-seeded-'))
      const cache = new Map<SeededRole, string>()

      const sessionFor: SessionFor = async (role) => {
        const cached = cache.get(role)
        if (cached) return cached

        const { email, password } = seededUser(role)
        const outPath = path.join(dir, `${role}.json`)
        try {
          await loginAndSaveState(browser, email, password, outPath)
        } catch (cause) {
          throw new Error(
            `seeded ${role} user (${email}) could not log in — the environment is expected to be seeded before the suite runs: run \`task seed:test-users\` in theopenlane/harmonize, or set E2E_${role.toUpperCase()}_EMAIL / E2E_${role.toUpperCase()}_PASSWORD`,
            { cause },
          )
        }
        cache.set(role, outPath)
        return outPath
      }

      await provide(sessionFor)
    },
    { scope: 'worker' },
  ],

  storageState: async ({ seededRole, seededSessionFor }, provide) => {
    await provide(await seededSessionFor(seededRole))
  },
})

export { expect }
