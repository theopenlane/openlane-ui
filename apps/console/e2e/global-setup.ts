import { chromium, type FullConfig } from '@playwright/test'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { BASE_URL, PASSWORD, RUN_ID, emailFor } from './utils/constants'
import { registerAndVerify } from './utils/registerUser'
import { loginViaForm } from './utils/login'
import { completeOnboarding } from './utils/onboarding'
import { loginViaApi, getSharedOrgs, getSelf, addOrgMember, memberSeesOrg, setDefaultOrg, createControl, type ApiSession, type SeedRole } from './utils/api'

/**
 * Runs once per `playwright test` invocation. Seeds the Owner user, drives the
 * real onboarding UI (which creates the shared, non-personal org), and saves
 * the authenticated cookies to e2e/.auth/owner.json so specs can skip the
 * login UI via `test.use({ storageState })`.
 *
 * The shared org id + the run's emails are written to e2e/.auth/manifest.json
 * for specs (and the role-seeding step) to consume. See AUTH_STRATEGY.md.
 */

export const AUTH_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.auth')

export interface AuthManifest {
  runId: string
  ownerEmail: string
  password: string
  sharedOrgId: string
  sharedOrgName: string
  roleEmails: Record<'admin' | 'member' | 'readonly', string>
  // A control seeded in the shared org, for detail-page view/edit gating specs.
  sharedControlId: string
  sharedControlRefCode: string
}

// Console-side role -> backend OrgMembershipRole. "readonly" maps to AUDITOR,
// the backend's restricted/read-only role.
const ROLE_MAP: Record<'admin' | 'member' | 'readonly', SeedRole> = {
  admin: 'ADMIN',
  member: 'MEMBER',
  readonly: 'AUDITOR',
}

interface SeedRoleArgs {
  role: 'admin' | 'member' | 'readonly'
  ownerApi: ApiSession
  sharedOrgId: string
}

/**
 * Register a role user, add them to the shared org with the mapped role, point
 * their default org at the shared org, then drive the login UI and save their
 * storage state. Returns the user's email.
 */
const seedRoleUser = async ({ role, ownerApi, sharedOrgId }: SeedRoleArgs): Promise<string> => {
  const email = emailFor(role)
  await registerAndVerify({ email })

  const userApi = await loginViaApi(email)
  const { id: userId, settingId } = await getSelf(userApi)

  await addOrgMember(ownerApi, sharedOrgId, userId, ROLE_MAP[role])
  const joined = await memberSeesOrg(userApi, sharedOrgId)
  if (!joined) {
    throw new Error(`global-setup: ${role} (${email}) never showed membership in shared org ${sharedOrgId}`)
  }

  // Make their next login land in the shared org rather than their personal one.
  await setDefaultOrg(userApi, settingId, sharedOrgId)

  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL: BASE_URL })
  const page = await context.newPage()
  await loginViaForm(page, email, PASSWORD)
  // Having two orgs (personal + shared), the user skips onboarding and lands
  // on /dashboard scoped to the shared org.
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  await context.storageState({ path: path.join(AUTH_DIR, `${role}.json`) })
  await browser.close()

  return email
}

// Reuse an existing .auth set if it's recent enough that the captured sessions
// (refresh tokens live ~60 min) are still valid. Keeps the per-invocation cost
// to a one-time ~40s seed instead of paying it every run. Force a re-seed with
// E2E_RESEED=1 (e.g. after wiping the backend DB).
const REUSE_WINDOW_MS = 30 * 60 * 1000
const ROLE_FILES = ['owner', 'admin', 'member', 'readonly']

const canReuseAuth = (): boolean => {
  if (process.env.E2E_RESEED) return false
  const manifestPath = path.join(AUTH_DIR, 'manifest.json')
  if (!existsSync(manifestPath)) return false
  if (!ROLE_FILES.every((r) => existsSync(path.join(AUTH_DIR, `${r}.json`)))) return false
  return Date.now() - statSync(manifestPath).mtimeMs < REUSE_WINDOW_MS
}

const globalSetup = async (_config: FullConfig): Promise<void> => {
  mkdirSync(AUTH_DIR, { recursive: true })

  if (canReuseAuth()) {
    console.log('[global-setup] reusing existing e2e/.auth (set E2E_RESEED=1 to force a fresh seed)')
    return
  }

  const ownerEmail = emailFor('owner')
  const companyName = `E2E Org ${RUN_ID}`

  // 1. Register + verify the Owner via the backend (dev-mode token).
  await registerAndVerify({ email: ownerEmail })

  // 2. Drive the real login + onboarding UI. Onboarding creates the shared,
  //    non-personal org and parks the owner on /dashboard.
  const browser = await chromium.launch()
  const context = await browser.newContext({ baseURL: BASE_URL })
  const page = await context.newPage()
  await loginViaForm(page, ownerEmail, PASSWORD)
  await completeOnboarding(page, { companyName })
  await context.storageState({ path: path.join(AUTH_DIR, 'owner.json') })
  await browser.close()

  // 3. Resolve the shared org id via the API so later steps / specs can use it.
  const ownerApi0 = await loginViaApi(ownerEmail)
  const sharedOrgs = await getSharedOrgs(ownerApi0)
  const shared = sharedOrgs.find((o) => o.name === companyName) ?? sharedOrgs[0]
  if (!shared) {
    throw new Error('global-setup: owner has no non-personal org after onboarding')
  }

  // Scope the owner's API token to the shared org. updateOrgMembership (used to
  // elevate seeded members above MEMBER) only authorizes when the owner's
  // active org IS this org.
  const ownerSelf = await getSelf(ownerApi0)
  await setDefaultOrg(ownerApi0, ownerSelf.settingId, shared.id)
  const ownerApi = await loginViaApi(ownerEmail)

  // 4. Seed a control in the shared org for detail-page gating specs.
  const sharedControlRefCode = `E2E-CTRL-${RUN_ID}`
  const sharedControlId = await createControl(ownerApi, sharedControlRefCode)

  // 5. Seed admin / member / readonly into the shared org and save their state.
  const roles = ['admin', 'member', 'readonly'] as const
  const roleEmails = {} as AuthManifest['roleEmails']
  for (const role of roles) {
    roleEmails[role] = await seedRoleUser({ role, ownerApi, sharedOrgId: shared.id })
  }

  const manifest: AuthManifest = {
    runId: RUN_ID,
    ownerEmail,
    password: PASSWORD,
    sharedOrgId: shared.id,
    sharedOrgName: shared.name,
    roleEmails,
    sharedControlId,
    sharedControlRefCode,
  }
  writeFileSync(path.join(AUTH_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
}

export default globalSetup
