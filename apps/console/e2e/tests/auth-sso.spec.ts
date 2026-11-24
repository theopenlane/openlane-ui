import { expect, test, type Page } from '@playwright/test'

import {
  addMember,
  completeEnrollment,
  createOrgWithMember,
  createOwnedOrg,
  enableTotp,
  expectSignedIn,
  passChallenge,
  readSessionUser,
  requireCoreConsoleOrigin,
  uniqueAuthDomain,
  updateOrgSettings,
  userAt,
} from '../utils/auth-scenarios'
import { PASSWORD, PASSWORD_INPUT } from '../utils/constants'
import { enterLoginEmail } from '../utils/login'
import { startMockOidcProvider, type MockOidcProvider } from '../utils/mock-oidc'
import { registerAndVerify } from '../utils/registerUser'
import { configureOrgSso, signInAtIdp, type SsoOptions } from '../utils/sso'

let idp: MockOidcProvider

test.beforeAll(async () => {
  idp = await startMockOidcProvider()
})

test.afterAll(async () => {
  await idp.close()
})

test.beforeEach(requireCoreConsoleOrigin)

const ssoOrg = async (slug: string, options: SsoOptions) => {
  const domain = uniqueAuthDomain(slug)
  const { owner, org, api } = await createOwnedOrg(domain, { allowedEmailDomains: [domain] })
  await configureOrgSso(api, owner.email, org.id, idp, options)
  return { domain, org, api }
}

const ssoOrgWithMember = async (slug: string, options: SsoOptions) => {
  const scenario = await createOrgWithMember(slug)
  await configureOrgSso(scenario.api, scenario.owner.email, scenario.org.id, idp, options)
  return scenario
}

const continueWithSso = (page: Page) => page.getByRole('button', { name: 'Continue with SSO' })

const startFromOrgLink = async (page: Page, slug: string): Promise<void> => {
  await page.goto(`/orgs/${slug}/sso`)
  await page.getByRole('button', { name: /continue/i }).click()
}

test.describe('auth journeys — SSO from /login', () => {
  test('an enforced org sends its member straight to the identity provider and back to the org dashboard', async ({ page }) => {
    const { org, member } = await ssoOrgWithMember('sso-enforced', { enforced: true })

    await enterLoginEmail(page, member.email)
    await expect(continueWithSso(page)).toBeVisible()
    await expect(page.locator(PASSWORD_INPUT)).toHaveCount(0)
    await continueWithSso(page).click()
    await signInAtIdp(page, member.email)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('an optional SSO org shows the password first and offers SSO as a switch', async ({ page }) => {
    const { org, member } = await ssoOrgWithMember('sso-optional', { enforced: false })

    await enterLoginEmail(page, member.email)
    await expect(page.locator(PASSWORD_INPUT)).toBeVisible()
    await page.getByRole('button', { name: 'Sign in with SSO' }).click()
    await continueWithSso(page).click()
    await signInAtIdp(page, member.email)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a member on an SSO-exempt domain keeps the password sign-in under enforcement', async ({ page }) => {
    const exemptDomain = uniqueAuthDomain('sso-exempt-user')
    const { org, api } = await ssoOrg('sso-exempt', { enforced: true, settings: { ssoExemptDomains: [exemptDomain] } })
    const exempt = await registerAndVerify({ email: userAt(exemptDomain, 'contractor') })
    await addMember(api, org.id, exempt)

    await enterLoginEmail(page, exempt.email)
    await expect(page.locator(PASSWORD_INPUT)).toBeVisible()
    await expect(continueWithSso(page)).toHaveCount(0)
    await page.locator(PASSWORD_INPUT).fill(PASSWORD)
    await page.getByRole('button', { name: /^login$/i }).click()

    await expectSignedIn(page, { email: exempt.email, orgId: org.id })
  })

  test('a member with their own 2FA is challenged after the identity provider', async ({ page }) => {
    test.slow()
    const { org, member, memberSession } = await ssoOrgWithMember('sso-user-tfa', { enforced: true })
    const enrollment = await enableTotp(memberSession)

    await enterLoginEmail(page, member.email)
    await continueWithSso(page).click()
    await signInAtIdp(page, member.email)
    await passChallenge(page, enrollment)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('an org that enforces both SSO and MFA makes a member without 2FA enrol after the identity provider', async ({ page }) => {
    test.slow()
    const { org, api, member } = await ssoOrgWithMember('sso-org-mfa', { enforced: true })
    await updateOrgSettings(api, org.id, { multifactorAuthEnforced: true })

    await enterLoginEmail(page, member.email)
    await continueWithSso(page).click()
    await signInAtIdp(page, member.email)
    await completeEnrollment(page)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })
})

test.describe('auth journeys — SSO from the shareable /orgs/<slug>/sso link', () => {
  test('an existing member signs in from the org link and lands on the org dashboard', async ({ page }) => {
    const { org, member } = await ssoOrgWithMember('sso-link-member', { enforced: true })

    await startFromOrgLink(page, org.slug)
    await signInAtIdp(page, member.email)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a never-seen user is provisioned just in time and lands on the org dashboard', async ({ page }) => {
    const { domain, org } = await ssoOrg('sso-link-jit', { enforced: true, settings: { identityProviderJitProvisioning: true } })
    const email = userAt(domain, 'newcomer')

    await startFromOrgLink(page, org.slug)
    await signInAtIdp(page, email)

    await expectSignedIn(page, { email, orgId: org.id })
  })

  test('an existing user who is not a member is refused and stays signed out', async ({ page }) => {
    const { org } = await ssoOrg('sso-link-outsider', { enforced: true })
    const outsider = await registerAndVerify({ email: userAt(uniqueAuthDomain('sso-outsider')) })

    await startFromOrgLink(page, org.slug)
    await signInAtIdp(page, outsider.email)

    await page.waitForURL((url) => url.pathname === '/login', { timeout: 30_000 }) // 30s
    await expect(page.getByText(/not a member of this organization/i)).toBeVisible()
    expect((await readSessionUser(page))?.accessToken ?? null).toBeNull()
  })
})
