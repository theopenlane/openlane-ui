import { expect, test, type Locator, type Page } from '@playwright/test'
import { randomBytes } from 'node:crypto'

import type { OrganizationSettingSsoProvider, UpdateOrganizationSettingInput } from '@repo/codegen/src/schema-types'

import { coreHeaders, gqlData, getSelf, loginViaApi, setDefaultOrg, type ApiSession } from './api'
import { API_BASE, BASE_URL, CONFIRM_PASSWORD_INPUT, CORE_CONSOLE_ORIGIN, PASSWORD, PASSWORD_INPUT, RUN_ID, SIGNUP_EMAIL_INPUT } from './constants'
import { waitForPath } from './login'
import { installRecaptchaShim } from './recaptcha'
import { registerAndVerify } from './registerUser'
import { previousWindowTotpCode, totpCode, unusedTotpCode } from './totp'

type OrgAuthSettingKey =
  | 'allowedEmailDomains'
  | 'allowMatchingDomainsAutojoin'
  | 'multifactorAuthEnforced'
  | 'identityProviderClientID'
  | 'identityProviderClientSecret'
  | 'oidcDiscoveryEndpoint'
  | 'identityProviderLoginEnforced'
  | 'identityProviderJitProvisioning'
  | 'jitAllowedEmailDomains'
  | 'ssoExemptDomains'

export type OrgAuthSettings = Pick<UpdateOrganizationSettingInput, OrgAuthSettingKey> & { identityProvider?: `${OrganizationSettingSsoProvider}` }

export interface ScenarioUser {
  id: string
  email: string
}

export interface ScenarioOrg {
  id: string
  slug: string
}

export interface TotpEnrollment {
  secret: string
  recoveryCodes: string[]
  spentCodes: Set<string>
}

const SETUP_KEY = /^[A-Z2-7]{16,}$/

export const uniqueAuthDomain = (slug: string): string => `${slug}-${RUN_ID}-${randomBytes(3).toString('hex')}.invalid`.toLowerCase()

export const userAt = (domain: string, local = 'user'): string => `${local}@${domain}`

const createOrg = async (owner: ApiSession, name: string, settings: OrgAuthSettings): Promise<ScenarioOrg> => {
  const [data, { settingId }] = await Promise.all([
    gqlData<{ createOrganization: { organization: { id: string; slugName: string } } }>(
      owner,
      'createOrganization',
      `mutation($input: CreateOrganizationInput!){ createOrganization(input: $input){ organization { id slugName } } }`,
      { input: { name, createOrgSettings: settings } },
    ),
    getSelf(owner),
  ])
  const org = data.createOrganization.organization
  await setDefaultOrg(owner, settingId, org.id)
  return { id: org.id, slug: org.slugName }
}

export const updateOrgSettings = async (owner: ApiSession, orgId: string, settings: OrgAuthSettings): Promise<void> => {
  await gqlData(owner, 'updateOrganization', `mutation($id: ID!, $input: UpdateOrganizationInput!){ updateOrganization(id: $id, input: $input){ organization { id } } }`, {
    id: orgId,
    input: { updateOrgSettings: settings },
  })
}

export const createOwnedOrg = async (domain: string, settings: OrgAuthSettings = {}): Promise<{ owner: ScenarioUser; org: ScenarioOrg; api: ApiSession }> => {
  const { multifactorAuthEnforced, ...createSettings } = settings
  const owner = await registerAndVerify({ email: userAt(domain, 'owner') })
  const org = await createOrg(await loginViaApi(owner.email), `E2E Auth ${domain.split('.')[0]}`, createSettings)
  const api = await loginViaApi(owner.email)
  if (multifactorAuthEnforced) await updateOrgSettings(api, org.id, { multifactorAuthEnforced })
  return { owner, org, api }
}

export const addMember = async (owner: ApiSession, orgId: string, user: ScenarioUser): Promise<ApiSession> => {
  const memberApi = await loginViaApi(user.email)
  const [{ settingId }] = await Promise.all([
    getSelf(memberApi),
    gqlData(owner, 'createOrgMembership', `mutation($input: CreateOrgMembershipInput!){ createOrgMembership(input: $input){ orgMembership { id } } }`, {
      input: { organizationID: orgId, userID: user.id, role: 'MEMBER' },
    }),
  ])
  await setDefaultOrg(memberApi, settingId, orgId)
  return memberApi
}

export const createOrgWithMember = async (slug: string, settings: OrgAuthSettings = {}) => {
  const domain = uniqueAuthDomain(slug)
  const [{ owner, org, api }, member] = await Promise.all([createOwnedOrg(domain, settings), registerAndVerify({ email: userAt(domain, 'member') })])
  const memberSession = await addMember(api, org.id, member)
  return { domain, owner, org, api, member, memberSession }
}

export const enableTotp = async (sess: ApiSession): Promise<TotpEnrollment> => {
  const created = await gqlData<{ createTFASetting: { tfaSecret: string | null } }>(
    sess,
    'createTFASetting',
    `mutation($input: CreateTFASettingInput!){ createTFASetting(input: $input){ tfaSecret } }`,
    { input: { totpAllowed: true } },
  )
  const secret = created.createTFASetting.tfaSecret
  if (!secret) throw new Error('enableTotp: createTFASetting returned no tfaSecret')

  const code = await previousWindowTotpCode(secret)
  const res = await fetch(`${API_BASE}/v1/2fa/validate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...coreHeaders(sess) },
    body: JSON.stringify({ totp_code: code }),
  })
  if (!res.ok) throw new Error(`enableTotp: /v1/2fa/validate failed: ${res.status} ${await res.text()}`)

  const verified = await gqlData<{ updateTFASetting: { recoveryCodes: string[] | null } }>(
    sess,
    'updateTFASetting',
    `mutation($input: UpdateTFASettingInput!){ updateTFASetting(input: $input){ recoveryCodes } }`,
    { input: { verified: true } },
  )
  const recoveryCodes = verified.updateTFASetting.recoveryCodes ?? []
  if (!recoveryCodes.length) throw new Error('enableTotp: updateTFASetting returned no recovery codes')

  return { secret, recoveryCodes, spentCodes: new Set([code]) }
}

export const requireCoreConsoleOrigin = ({ baseURL }: { baseURL: string | undefined }): void => {
  const consoleOrigin = new URL(baseURL ?? BASE_URL).origin
  const matches = consoleOrigin === CORE_CONSOLE_ORIGIN
  if (process.env.CI) {
    expect(matches, `the console under test (${consoleOrigin}) must be core's console origin ${CORE_CONSOLE_ORIGIN}`).toBe(true)
    return
  }
  test.skip(!matches, `core sends SSO callbacks to and accepts passkeys from ${CORE_CONSOLE_ORIGIN}, not ${consoleOrigin}; run with E2E_PORT=3001`)
}

export const otpInput = (scope: Page | Locator) => scope.locator('input[autocomplete="one-time-code"]')

export const submitOtp = async (page: Page, code: string): Promise<boolean> => {
  const verdict = waitForPath(page, '/api/auth/verify-totp')
  await otpInput(page).pressSequentially(code, { delay: 30 })
  return (await verdict).ok()
}

export const passChallenge = async (page: Page, enrollment: TotpEnrollment): Promise<void> => {
  await page.waitForURL(/\/tfa/, { timeout: 30_000 }) // 30s
  await expect(page.getByRole('heading', { name: 'Two-Factor Authentication' })).toBeVisible()
  const code = await unusedTotpCode(enrollment.secret, enrollment.spentCodes)
  enrollment.spentCodes.add(code)
  expect(await submitOtp(page, code)).toBe(true)
}

export const completeEnrollment = async (page: Page): Promise<void> => {
  await page.waitForURL(/\/tfa/, { timeout: 30_000 }) // 30s
  await expect(page.getByRole('heading', { name: 'Set up two-factor authentication' })).toBeVisible()
  await page.getByRole('button', { name: 'Set up authenticator' }).click()

  const dialog = page.getByRole('dialog')
  await dialog.getByText('setup key', { exact: true }).click()
  const secret = (await dialog.locator('p').filter({ hasText: SETUP_KEY }).first().textContent())?.trim()
  if (!secret) throw new Error('completeEnrollment: the setup key never rendered')

  await otpInput(dialog).pressSequentially(totpCode(secret), { delay: 30 })
  await expect(dialog.getByText(/Use recovery codes for login/)).toBeVisible({ timeout: 20_000 }) // 20s

  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Download Recovery Codes' }).click()
  await download
  await dialog.getByRole('button', { name: /close/i }).click()
}

export const signUpAndVerify = async (page: Page, email: string): Promise<void> => {
  await installRecaptchaShim(page)
  await page.goto('/signup')
  await page.locator(SIGNUP_EMAIL_INPUT).fill(email)
  await page.locator(PASSWORD_INPUT).fill(PASSWORD)
  await page.locator(CONFIRM_PASSWORD_INPUT).fill(PASSWORD)

  const registered = waitForPath(page, '/api/auth/register')
  await page.getByRole('button', { name: /^sign up$/i }).click()
  const body: { token?: string } = await (await registered).json()
  if (!body.token) throw new Error('signUpAndVerify: /api/auth/register returned no verification token — is core running with server.dev=true?')

  await page.waitForURL(/\/verify(\?|$)/, { timeout: 30_000 }) // 30s
  await page.goto(`/verify?token=${encodeURIComponent(body.token)}`)
}

interface SessionUser {
  email?: string
  activeOrganizationId?: string | null
  accessToken?: string | null
}

export const readSessionUser = (page: Page): Promise<SessionUser | null> =>
  page.evaluate(async () => {
    const body: { user?: SessionUser } = await (await fetch('/api/auth/session')).json()
    return body.user ?? null
  })

interface SignedInExpectation {
  email: string
  orgId?: string
  landing?: 'dashboard' | 'onboarding'
}

export const expectSignedIn = async (page: Page, { email, orgId, landing = 'dashboard' }: SignedInExpectation): Promise<void> => {
  await page.waitForURL((url) => url.pathname.startsWith(`/${landing}`), { timeout: 60_000 }) // 1min

  await expect
    .poll(
      async () => {
        const session = await readSessionUser(page)
        return { email: session?.email?.toLowerCase(), hasToken: Boolean(session?.accessToken), orgId: orgId ? session?.activeOrganizationId : undefined }
      },
      { timeout: 20_000 }, // 20s
    )
    .toEqual({ email: email.toLowerCase(), hasToken: true, orgId })

  expect(await page.evaluate(async () => (await fetch('/api/onboarding/questions')).ok)).toBe(true)
}
