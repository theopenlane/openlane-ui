import { loginViaApi, type ApiSession } from './api'

export type SeededRole = 'owner' | 'admin' | 'member' | 'readonly'

export interface SeededUser {
  email: string
  password: string
}

const ENV_KEY: Record<SeededRole, string> = {
  owner: 'OWNER',
  admin: 'ADMIN',
  member: 'MEMBER',
  readonly: 'READONLY',
}

const HARMONIZE_DEFAULTS: Record<SeededRole, SeededUser> = {
  owner: { email: 'peter.parker@theopenlane.io', password: 'mattisthebest!' },
  admin: { email: 'e2e.admin@theopenlane.io', password: 'qR7_vTm2Xd@LpK9wZs4!' },
  member: { email: 'e2e.member@theopenlane.io', password: 'hN3@bWq8Yc_zF6tJr5Dx!' },
  readonly: { email: 'e2e.auditor@theopenlane.io', password: 'kP5!dLs9Vn_wG2mBx7Ct!' },
}

export const SEEDED_ROLES: SeededRole[] = ['owner', 'admin', 'member', 'readonly']

export const seededUser = (role: SeededRole): SeededUser => ({
  email: process.env[`E2E_${ENV_KEY[role]}_EMAIL`] ?? HARMONIZE_DEFAULTS[role].email,
  password: process.env[`E2E_${ENV_KEY[role]}_PASSWORD`] ?? HARMONIZE_DEFAULTS[role].password,
})

export const seededOrgId = (): string => process.env.E2E_SEEDED_ORG_ID ?? ''

const SEED_HINT = 'run `task seed:test-users` in theopenlane/harmonize, or set E2E_<ROLE>_EMAIL / E2E_<ROLE>_PASSWORD for this environment'

export const loginSeeded = async (role: SeededRole): Promise<ApiSession> => {
  const { email, password } = seededUser(role)
  try {
    return await loginViaApi(email, password)
  } catch (cause) {
    throw new Error(`seeded ${role} user (${email}) could not log in — the environment is expected to be seeded before the suite runs: ${SEED_HINT}`, { cause })
  }
}
