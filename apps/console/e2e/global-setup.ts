import { chromium, type BrowserContext, type FullConfig } from '@playwright/test'
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { BASE_URL, PASSWORD, RUN_ID, emailFor } from './utils/constants'
import { registerAndVerify } from './utils/registerUser'
import { loginViaForm } from './utils/login'
import { saveStorageState } from './utils/session'
import { completeOnboarding } from './utils/onboarding'
import {
  loginViaApi,
  getSharedOrgs,
  getSelf,
  addOrgMember,
  memberSeesOrg,
  setDefaultOrg,
  createControl,
  createSubprocessor,
  createStandard,
  getTrustCenterId,
  completeOnboardingTasks,
  type ApiSession,
  type SeedRole,
} from './utils/api'

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

const saveAuthState = (context: BrowserContext, role: string): Promise<void> => saveStorageState(context, path.join(AUTH_DIR, `${role}.json`))

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
  // Whether the trust-center org session (demo.json) is available. That org is
  // provisioned by this setup (or supplied via E2E_DEMO_EMAIL) and — unlike the
  // e2e org, which deliberately has none — holds a TrustCenter row, so specs
  // covering trust-center surfaces run against it.
  hasDemoSession: boolean
  demoEmail?: string
  demoPassword?: string
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

  try {
    // Having two orgs (personal + shared), the user skips onboarding and lands
    // on /dashboard scoped to the shared org. Two things can go wrong here, and
    // a throw kills the whole run before a single test executes: the session
    // cookie is written a beat after login, so middleware may still be bouncing;
    // and the login itself can fail outright under load, which leaves us on
    // /login where re-navigating is futile. Re-drive whichever applies.
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (/\/dashboard/.test(page.url())) break

      if (attempt === 0 || /\/login/.test(page.url())) {
        await loginViaForm(page, email, PASSWORD).catch(() => {})
        await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 20_000 }).catch(() => {})
      } else {
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {})
      }

      if (/\/dashboard/.test(page.url())) break
      await page.waitForTimeout(2_500)
    }

    if (!/\/dashboard/.test(page.url())) {
      throw new Error(`global-setup: ${role} (${email}) never reached /dashboard (stuck at ${page.url()})`)
    }

    await saveAuthState(context, role)
  } finally {
    await browser.close()
  }

  return email
}

// Every run seeds fresh sessions by default.
//
// The old behaviour reused .auth for 30 minutes on the strength of the
// manifest's mtime alone, which is not evidence of anything: auth.ts's signOut
// event POSTs /v1/logout and revokes the access + refresh tokens SERVER-SIDE.
// All workers share one captured session, so a single test that trips the
// session-expired modal revokes it for the whole run — and a stale .auth set
// then poisons every subsequent run inside the reuse window too. Both failure
// modes look like mass flakiness and cost hours to diagnose.
//
// A fresh seed costs ~40s against a full-suite runtime of several minutes, so
// paying it every time is the right default. Opt into reuse with
// E2E_REUSE_AUTH=1 for tight iteration on a single spec; that path proves the
// session actually works rather than trusting a timestamp.
const ROLE_FILES = ['owner', 'admin', 'member', 'readonly']

/**
 * Reaching /dashboard proves nothing on its own: middleware.ts decides you are
 * logged in from the AuthJS session alone, so a REVOKED core session still
 * renders the shell. The probe therefore requires real authenticated data back
 * from core, and no session-expired modal.
 */
const capturedSessionWorks = async (): Promise<boolean> => {
  const browser = await chromium.launch()
  try {
    for (const role of ROLE_FILES) {
      const context = await browser.newContext({ baseURL: BASE_URL, storageState: path.join(AUTH_DIR, `${role}.json`) })
      const page = await context.newPage()
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 30_000 })
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 })

      const authed = await page.evaluate(async () => {
        const res = await fetch('/api/onboarding/questions')
        return res.ok
      })
      const expired = await page
        .getByText('Session expired')
        .isVisible()
        .catch(() => false)
      await context.close()
      if (!authed || expired) return false
    }
    return true
  } catch {
    return false
  } finally {
    await browser.close()
  }
}

const canReuseAuth = async (): Promise<boolean> => {
  if (process.env.E2E_REUSE_AUTH !== '1') return false
  if (process.env.E2E_RESEED === '1') return false
  if (!existsSync(path.join(AUTH_DIR, 'manifest.json'))) return false
  if (!ROLE_FILES.every((r) => existsSync(path.join(AUTH_DIR, `${r}.json`)))) return false
  return capturedSessionWorks()
}

let demoEmail: string | undefined
let demoPassword: string | undefined

const DEMO_EMAIL = process.env.E2E_DEMO_EMAIL ?? 'peter.parker@theopenlane.io'
const DEMO_PASSWORD = process.env.E2E_DEMO_PASSWORD ?? 'mattisthebest!'

const seedTrustCenterFixtures = async (email: string, password: string): Promise<void> => {
  const api = await loginViaApi(email, password)
  await getTrustCenterId(api)
  await createSubprocessor(api, `E2E Subprocessor ${RUN_ID}`)
  await createStandard(api, `E2E Framework ${RUN_ID}`)
}

const captureExternalDemoSession = async (): Promise<boolean> => {
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ baseURL: BASE_URL })
    const page = await context.newPage()
    await loginViaForm(page, DEMO_EMAIL, DEMO_PASSWORD)
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
    await saveAuthState(context, 'demo')
    await seedTrustCenterFixtures(DEMO_EMAIL, DEMO_PASSWORD)
    demoEmail = DEMO_EMAIL
    demoPassword = DEMO_PASSWORD
    console.log(`[global-setup] using the seeded trust-center org (${DEMO_EMAIL})`)
    return true
  } catch (err) {
    console.log(`[global-setup] no seeded trust-center org for ${DEMO_EMAIL} (${String(err).slice(0, 160)}) — trust-center specs will skip`)
    return false
  } finally {
    await browser.close()
  }
}

const globalSetup = async (_config: FullConfig): Promise<void> => {
  mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 })
  chmodSync(AUTH_DIR, 0o700)

  if (await canReuseAuth()) {
    console.log('[global-setup] E2E_REUSE_AUTH set and the captured session still works — reusing e2e/.auth')
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
  await saveAuthState(context, 'owner')
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

  // 4. Clear the onboarding checklist so /dashboard renders the compliance
  //    overview branch deterministically (see completeOnboardingTasks).
  const completed = await completeOnboardingTasks(ownerApi)
  console.log(`[global-setup] completed ${completed} onboarding checklist task(s)`)

  // 5. Seed a control in the shared org for detail-page gating specs.
  const sharedControlRefCode = `E2E-CTRL-${RUN_ID}`
  const sharedControlId = await createControl(ownerApi, sharedControlRefCode)

  // 6. Seed admin / member / readonly into the shared org and save their state.
  const roles = ['admin', 'member', 'readonly'] as const
  const roleEmails = {} as AuthManifest['roleEmails']
  for (const role of roles) {
    roleEmails[role] = await seedRoleUser({ role, ownerApi, sharedOrgId: shared.id })
  }

  // Trust centers are created by the backend seeder, never by the console or
  // these tests, so trust-center specs run against the seeded org rather than
  // the deliberately-empty e2e org (whose missing trust center trust-center.spec.ts
  // asserts). Absent that seed, those specs skip.
  const hasDemoSession = await captureExternalDemoSession()

  const manifest: AuthManifest = {
    runId: RUN_ID,
    ownerEmail,
    password: PASSWORD,
    sharedOrgId: shared.id,
    sharedOrgName: shared.name,
    roleEmails,
    sharedControlId,
    sharedControlRefCode,
    hasDemoSession,
    demoEmail,
    demoPassword,
  }
  const manifestPath = path.join(AUTH_DIR, 'manifest.json')
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), { mode: 0o600 })
  chmodSync(manifestPath, 0o600)
}

export default globalSetup
