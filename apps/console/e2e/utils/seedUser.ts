import type { Page } from '@playwright/test'

import { addOrgMember, createSharedOrg, getOwnerApi, getSelf, getSharedOrgs, loginViaApi, memberSeesOrg, setDefaultOrg } from './api'
import { PASSWORD, RUN_ID } from './constants'
import { loginViaForm } from './login'
import { completeOnboarding } from './onboarding'
import { registerAndVerify } from './registerUser'
import { readManifest } from '../fixtures/auth'

/**
 * Create a brand-new user with their own pristine organization and log them in
 * via the UI, parked on /dashboard. Use this for specs that need an empty org
 * (empty-state assertions, exact member counts, invite-list contents) rather
 * than the shared Owner storage state.
 *
 * The org is provisioned through the API instead of by walking the onboarding
 * wizard: auth.ts derives `isOnboarding` purely from
 * `organizations.edges.length === 1`, so giving the user a second (non-personal)
 * org clears the middleware guard exactly as finishing the wizard would. That
 * trades ~12-15s of stepping through backend-driven questions for two API
 * calls. `onboarding.spec.ts` still drives the real wizard — it is the spec
 * that owns that flow.
 *
 * Returns the user's email and the id of the org they landed in.
 */
export interface SeedUserOptions {
  /**
   * Walk the real onboarding wizard instead of provisioning the org through the
   * API. Slower (~12-15s), but it is the only way to get an org that still has
   * pending onboarding checklist tasks — which the dashboard setup-checklist
   * spec needs in order to see that branch at all.
   */
  viaWizard?: boolean
}

export const seedLoggedInUser = async (page: Page, slug: string, opts: SeedUserOptions = {}): Promise<{ email: string; orgId: string }> => {
  // Each user gets a unique invalid-domain email so no org's allowed-domains
  // list can auto-join the next test's user. See onboarding.spec.ts for the
  // longer rationale.
  const unique = `${slug}-${RUN_ID}-${Date.now().toString(36)}`
  const email = `user@${unique}.invalid`
  await registerAndVerify({ email })

  if (opts.viaWizard) {
    await loginViaForm(page, email, PASSWORD)
    await completeOnboarding(page, { companyName: `E2E Org ${unique}` })
    const wizardApi = await loginViaApi(email)
    const [org] = await getSharedOrgs(wizardApi)
    return { email, orgId: org?.id ?? '' }
  }

  const api = await loginViaApi(email)
  const { settingId } = await getSelf(api)
  const orgId = await createSharedOrg(api, `E2E Org ${unique}`)
  await setDefaultOrg(api, settingId, orgId)

  await loginViaForm(page, email, PASSWORD)
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

  return { email, orgId }
}

export const seedNonOwnerMember = async (page: Page, slug: string): Promise<{ email: string; orgId: string }> => {
  const { sharedOrgId, ownerEmail } = readManifest()
  const allowedDomain = ownerEmail.split('@')[1]

  const email = `e2e-${slug}-${RUN_ID}-${Date.now().toString(36)}@${allowedDomain}`
  await registerAndVerify({ email })

  const memberApi = await loginViaApi(email)
  const { id: userId, settingId } = await getSelf(memberApi)

  const ownerApi = await getOwnerApi()
  await addOrgMember(ownerApi, sharedOrgId, userId, 'MEMBER')
  if (!(await memberSeesOrg(memberApi, sharedOrgId))) {
    throw new Error(`seedNonOwnerMember: ${email} never showed membership in ${sharedOrgId}`)
  }

  await setDefaultOrg(memberApi, settingId, sharedOrgId)

  await loginViaForm(page, email, PASSWORD)
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })

  return { email, orgId: sharedOrgId }
}
