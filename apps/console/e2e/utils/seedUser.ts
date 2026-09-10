import type { Page } from '@playwright/test'

import { addOrgMember, createSharedOrg, getOwnerApi, getSelf, getSharedOrgs, loginViaApi, memberSeesOrg, setDefaultOrg } from './api'
import { PASSWORD, RUN_ID } from './constants'
import { loginViaForm } from './login'
import { completeOnboarding } from './onboarding'
import { registerAndVerify } from './registerUser'
import { readManifest } from '../fixtures/auth'

/** Create a brand-new user with their own pristine organization and log them in via the UI. */
export interface SeedUserOptions {
  /** Walk the real onboarding wizard instead of provisioning the org through the API. */
  viaWizard?: boolean
}

export const seedLoggedInUser = async (page: Page, slug: string, opts: SeedUserOptions = {}): Promise<{ email: string; orgId: string }> => {
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
