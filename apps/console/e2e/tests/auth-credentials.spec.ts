import { expect, test } from '@playwright/test'

import { createOwnedOrg, expectSignedIn, signUpAndVerify, uniqueAuthDomain, userAt } from '../utils/auth-scenarios'
import { companyNameInput } from '../utils/onboarding'

test.describe('auth journeys — credentials sign-up', () => {
  test('a new user signs up, opens the verification link and lands on onboarding', async ({ page }) => {
    const email = userAt(uniqueAuthDomain('signup-new'))

    await signUpAndVerify(page, email)

    await expectSignedIn(page, { email, landing: 'onboarding' })
    await expect(companyNameInput(page)).toBeVisible({ timeout: 30_000 }) // 30s
  })

  test('a second user on an auto-join domain lands on that organization’s dashboard, not onboarding', async ({ page }) => {
    const domain = uniqueAuthDomain('signup-autojoin')
    const { org } = await createOwnedOrg(domain, { allowedEmailDomains: [domain], allowMatchingDomainsAutojoin: true })
    const email = userAt(domain, 'second')

    await signUpAndVerify(page, email)

    await expectSignedIn(page, { email, orgId: org.id })
  })

  test('a user on an allowed domain is not joined when auto-join is off, so they land on onboarding', async ({ page }) => {
    const domain = uniqueAuthDomain('signup-no-autojoin')
    await createOwnedOrg(domain, { allowedEmailDomains: [domain], allowMatchingDomainsAutojoin: false })
    const email = userAt(domain, 'second')

    await signUpAndVerify(page, email)

    await expectSignedIn(page, { email, landing: 'onboarding' })
  })
})
