import { expect, test } from '@playwright/test'

import {
  completeEnrollment,
  createOrgWithMember,
  createOwnedOrg,
  enableTotp,
  expectSignedIn,
  otpInput,
  passChallenge,
  readSessionUser,
  submitOtp,
  uniqueAuthDomain,
  userAt,
} from '../utils/auth-scenarios'
import { PASSWORD } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { registerAndVerify } from '../utils/registerUser'
import { wrongTotpCode } from '../utils/totp'

const memberWithTotp = async (slug: string, multifactorAuthEnforced: boolean) => {
  const { org, member, memberSession } = await createOrgWithMember(slug, { multifactorAuthEnforced })
  return { org, member, enrollment: await enableTotp(memberSession) }
}

test.describe('auth journeys — user two-factor', () => {
  test('a password sign-in asks for the authenticator code, then lands on the dashboard', async ({ page }) => {
    const { member, org, enrollment } = await memberWithTotp('tfa-user', false)

    await loginViaForm(page, member.email, PASSWORD)
    await passChallenge(page, enrollment)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a recovery code signs the user in when the authenticator is unavailable', async ({ page }) => {
    const { member, org, enrollment } = await memberWithTotp('tfa-recovery', false)

    await loginViaForm(page, member.email, PASSWORD)
    await page.waitForURL(/\/tfa/, { timeout: 30_000 }) // 30s
    await page.getByText('here', { exact: true }).click()
    await expect(page.getByText(/Enter a recovery code/)).toBeVisible()
    expect(await submitOtp(page, enrollment.recoveryCodes[0])).toBe(true)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a wrong code is rejected and keeps the user on the challenge', async ({ page }) => {
    const { member, enrollment } = await memberWithTotp('tfa-wrong', false)

    await loginViaForm(page, member.email, PASSWORD)
    await page.waitForURL(/\/tfa/, { timeout: 30_000 }) // 30s
    expect(await submitOtp(page, wrongTotpCode(enrollment.secret))).toBe(false)

    await expect(page.getByText(/^Invalid authentication token entered!/)).toBeVisible()
    await expect(page).toHaveURL(/\/tfa/)
    await expect(otpInput(page)).toBeVisible()
  })

  test('an org that enforces MFA still asks an enrolled member for their code', async ({ page }) => {
    const { member, org, enrollment } = await memberWithTotp('tfa-org-enrolled', true)

    await loginViaForm(page, member.email, PASSWORD)
    await passChallenge(page, enrollment)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })
})

test.describe('auth journeys — organization-enforced two-factor', () => {
  test('a member without 2FA must enrol before reaching the org dashboard', async ({ page }) => {
    const { member, org } = await createOrgWithMember('mfa-enrol', { multifactorAuthEnforced: true })

    await loginViaForm(page, member.email, PASSWORD)
    await completeEnrollment(page)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a member auto-joined into an MFA org must enrol on their next password sign-in', async ({ page }) => {
    const domain = uniqueAuthDomain('mfa-autojoin-login')
    const { org } = await createOwnedOrg(domain, { allowedEmailDomains: [domain], allowMatchingDomainsAutojoin: true, multifactorAuthEnforced: true })
    const joiner = await registerAndVerify({ email: userAt(domain, 'joiner') })

    await loginViaForm(page, joiner.email, PASSWORD)
    await completeEnrollment(page)

    await expectSignedIn(page, { email: joiner.email, orgId: org.id })
  })

  test('closing enrolment returns to the login page instead of signing the member in', async ({ page }) => {
    const { member } = await createOrgWithMember('mfa-abandon', { multifactorAuthEnforced: true })

    await loginViaForm(page, member.email, PASSWORD)
    await page.waitForURL(/\/tfa/, { timeout: 30_000 }) // 30s
    await page.getByRole('button', { name: 'Set up authenticator' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')

    await page.waitForURL((url) => url.pathname === '/login', { timeout: 30_000 }) // 30s
    expect((await page.context().cookies()).find((cookie) => cookie.name === 'access_token')).toBeUndefined()
    expect((await readSessionUser(page))?.accessToken ?? null).toBeNull()
  })
})
