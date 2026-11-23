import { test, type Page } from '@playwright/test'

import { completeEnrollment, createOrgWithMember, enableTotp, expectSignedIn, passChallenge, requireCoreConsoleOrigin, updateOrgSettings } from '../utils/auth-scenarios'
import { PASSWORD } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { attachVirtualAuthenticator, registerPasskeyFromProfile } from '../utils/webauthn'

test.beforeEach(requireCoreConsoleOrigin)
test.beforeEach(() => test.slow())

const memberWithPasskey = async (page: Page, slug: string) => {
  const [scenario] = await Promise.all([createOrgWithMember(slug), attachVirtualAuthenticator(page)])

  await loginViaForm(page, scenario.member.email, PASSWORD)
  await page.waitForURL(/\/dashboard/, { timeout: 60_000 }) // 1min
  await registerPasskeyFromProfile(page)
  await page.context().clearCookies()

  return scenario
}

const signInWithPasskey = async (page: Page): Promise<void> => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Passkey' }).click()
}

test.describe('auth journeys — passkey', () => {
  test('a registered passkey signs the member back in to their org dashboard', async ({ page }) => {
    const { org, member } = await memberWithPasskey(page, 'passkey')

    await signInWithPasskey(page)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a passkey sign-in still asks a member with 2FA for their code', async ({ page }) => {
    const { org, member, memberSession } = await memberWithPasskey(page, 'passkey-tfa')
    const enrollment = await enableTotp(memberSession)

    await signInWithPasskey(page)
    await passChallenge(page, enrollment)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })

  test('a passkey sign-in into an MFA-enforced org makes a member without 2FA enrol first', async ({ page }) => {
    const { org, api, member } = await memberWithPasskey(page, 'passkey-org-mfa')
    await updateOrgSettings(api, org.id, { multifactorAuthEnforced: true })

    await signInWithPasskey(page)
    await completeEnrollment(page)

    await expectSignedIn(page, { email: member.email, orgId: org.id })
  })
})
