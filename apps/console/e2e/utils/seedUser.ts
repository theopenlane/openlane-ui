import type { Page } from '@playwright/test'

import { PASSWORD, RUN_ID } from './constants'
import { loginViaForm } from './login'
import { completeOnboarding } from './onboarding'
import { registerAndVerify } from './registerUser'

/**
 * Create a brand-new user, log in via the UI, and complete onboarding so
 * the page is parked on /dashboard. Use this for any cross-cutting spec
 * that needs a logged-in, post-onboarding user but doesn't want to share
 * state with other tests.
 *
 * Each call burns ~10s of setup (register + verify + login + 3-step
 * wizard). When that aggregate cost matters, switch to a storage-state
 * fixture per the AUTH_STRATEGY plan.
 *
 * Returns the user's email so callers can reference it for assertions
 * (e.g. user-menu showing the email).
 */
export const seedLoggedInUser = async (page: Page, slug: string): Promise<{ email: string }> => {
  // Each user gets a unique invalid-domain email so the post-onboarding
  // org's allowed-domains list doesn't auto-join the next test's user.
  // See onboarding.spec.ts for the longer rationale.
  const unique = `${slug}-${RUN_ID}-${Date.now().toString(36)}`
  const email = `user@${unique}.invalid`
  await registerAndVerify({ email })
  await loginViaForm(page, email, PASSWORD)
  await completeOnboarding(page)
  return { email }
}
