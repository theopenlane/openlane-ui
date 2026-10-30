import { chromium, type BrowserContext, type FullConfig } from '@playwright/test'
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { DEFAULT_PAGINATION } from '@/constants/pagination'

import { BASE_URL, BROWSER_ARGS, PASSWORD, RUN_ID, emailFor, isolatedEmailFor } from './utils/constants'
import { AUTH_DIR, MANIFEST_PATH, readManifest, type AuthManifest, type SeededRoleKey } from './utils/manifest'
import { registerAndVerify } from './utils/registerUser'
import { loginViaForm } from './utils/login'
import { saveStorageState } from './utils/session'
import { completeOnboarding } from './utils/onboarding'
import { ensureSystemFixtures } from './utils/system-fixtures'
import {
  loginViaApi,
  getSharedOrgs,
  getSelf,
  createSharedOrg,
  addOrgMember,
  memberSeesOrg,
  setDefaultOrg,
  createControl,
  createSubprocessor,
  createStandard,
  getTrustCenterId,
  ensureTrustCenter,
  ensureTrustCenterDocs,
  completeOnboardingTasks,
  type ApiSession,
  type SeedRole,
} from './utils/api'

/** Runs once per `playwright test` invocation. */

const saveAuthState = (context: BrowserContext, role: string): Promise<void> => saveStorageState(context, path.join(AUTH_DIR, `${role}.json`))

const ROLE_MAP: Record<SeededRoleKey, SeedRole> = {
  admin: 'ADMIN',
  superadmin: 'SUPER_ADMIN',
  member: 'MEMBER',
  readonly: 'AUDITOR',
}

interface SeedRoleArgs {
  role: SeededRoleKey
  ownerApi: ApiSession
  sharedOrgId: string
}

/** Register a role user, add them to the shared org with the mapped role, point their default org at the shared org. */
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

  await setDefaultOrg(userApi, settingId, sharedOrgId)

  const browser = await chromium.launch({ args: BROWSER_ARGS })
  const context = await browser.newContext({ baseURL: BASE_URL })
  const page = await context.newPage()

  try {
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

const ROLE_FILES = ['owner', 'admin', 'member', 'readonly']

/** Reaching /dashboard proves nothing on its own: middleware.ts decides you are logged in from the AuthJS session alone. */
const capturedSessionWorks = async (): Promise<boolean> => {
  const browser = await chromium.launch({ args: BROWSER_ARGS })
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
  if (!existsSync(MANIFEST_PATH)) return false
  if (!readManifest().demoEmail) return false
  if (!ROLE_FILES.every((r) => existsSync(path.join(AUTH_DIR, `${r}.json`)))) return false
  return capturedSessionWorks()
}

const seedTrustCenterFixtures = async (email: string, password: string): Promise<void> => {
  const api = await loginViaApi(email, password)
  await getTrustCenterId(api)
  await createSubprocessor(api, `E2E Subprocessor ${RUN_ID}`)
  await createStandard(api, `E2E Framework ${RUN_ID}`)
  await ensureTrustCenterDocs(api, DEFAULT_PAGINATION.pageSize + 1, 'E2E Category')
}

/** Logs the demo profile in through the form, saves its session, and seeds the trust-center fixtures. */
const captureDemoSession = async (email: string, password: string): Promise<void> => {
  const browser = await chromium.launch({ args: BROWSER_ARGS })
  try {
    const context = await browser.newContext({ baseURL: BASE_URL })
    const page = await context.newPage()
    await loginViaForm(page, email, password)
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  } finally {
    await browser.close()
  }

  await seedTrustCenterFixtures(email, password)
}

/**
 * Registers a demo user for this run with its own org and gives that org a trust center.
 * The user gets its own `.invalid` domain (as seedLoggedInUser does): the shared org allows the
 * e2e email domain, so an emailFor() address would be joined to the shared org as a member,
 * which can't create a trust center.
 */
const provisionDemoAccount = async (): Promise<string> => {
  const email = isolatedEmailFor('demo', 'trust-center')

  await registerAndVerify({ email })

  const api0 = await loginViaApi(email)
  const { settingId } = await getSelf(api0)
  const orgId = await createSharedOrg(api0, `E2E Trust Center ${RUN_ID}`)
  await setDefaultOrg(api0, settingId, orgId)

  // a fresh login so the token carries the new org, which this user owns
  const api = await loginViaApi(email)
  await completeOnboardingTasks(api)
  await ensureTrustCenter(api)

  await captureDemoSession(email, PASSWORD)
  console.log(`[global-setup] provisioned a trust-center org for ${email}`)
  return email
}

const globalSetup = async (_config: FullConfig): Promise<void> => {
  mkdirSync(AUTH_DIR, { recursive: true, mode: 0o700 })
  chmodSync(AUTH_DIR, 0o700)

  if (await canReuseAuth()) {
    const reused = readManifest()
    await ensureSystemFixtures(await loginViaApi(reused.ownerEmail, reused.password))
    console.log('[global-setup] E2E_REUSE_AUTH set and the captured session still works — reusing e2e/.auth')
    return
  }

  const ownerEmail = emailFor('owner')
  const companyName = `E2E Org ${RUN_ID}`

  await registerAndVerify({ email: ownerEmail })

  const browser = await chromium.launch({ args: BROWSER_ARGS })
  const context = await browser.newContext({ baseURL: BASE_URL })
  const page = await context.newPage()
  await loginViaForm(page, ownerEmail, PASSWORD)
  await completeOnboarding(page, { companyName })
  await saveAuthState(context, 'owner')
  await browser.close()

  const ownerApi0 = await loginViaApi(ownerEmail)
  const sharedOrgs = await getSharedOrgs(ownerApi0)
  const shared = sharedOrgs.find((o) => o.name === companyName) ?? sharedOrgs[0]
  if (!shared) {
    throw new Error('global-setup: owner has no non-personal org after onboarding')
  }

  const ownerSelf = await getSelf(ownerApi0)
  await setDefaultOrg(ownerApi0, ownerSelf.settingId, shared.id)
  const ownerApi = await loginViaApi(ownerEmail)

  await ensureSystemFixtures(ownerApi)

  const completed = await completeOnboardingTasks(ownerApi)
  console.log(`[global-setup] completed ${completed} onboarding checklist task(s)`)

  const sharedControlRefCode = `E2E-CTRL-${RUN_ID}`
  const sharedControlId = await createControl(ownerApi, sharedControlRefCode)

  const roles = ['admin', 'superadmin', 'member', 'readonly'] as const
  const roleEmails = {} as AuthManifest['roleEmails']
  for (const role of roles) {
    roleEmails[role] = await seedRoleUser({ role, ownerApi, sharedOrgId: shared.id })
  }

  const demoEmail = await provisionDemoAccount()

  const manifest: AuthManifest = {
    runId: RUN_ID,
    ownerEmail,
    password: PASSWORD,
    sharedOrgId: shared.id,
    sharedOrgName: shared.name,
    roleEmails,
    sharedControlId,
    sharedControlRefCode,
    demoEmail,
    demoPassword: PASSWORD,
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), { mode: 0o600 })
  chmodSync(MANIFEST_PATH, 0o600)
}

export default globalSetup
