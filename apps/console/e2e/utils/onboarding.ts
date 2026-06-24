import type { Page } from '@playwright/test'

interface OnboardingOptions {
  companyName?: string
}

export const ensureOnboardingRoute = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => window.location.pathname.startsWith('/onboarding') || window.location.pathname.startsWith('/dashboard'), undefined, { timeout: 30_000 })

  if (new URL(page.url()).pathname.startsWith('/dashboard')) {
    await page.goto('/onboarding')
  }

  await page.waitForURL(/\/onboarding/, { timeout: 15_000 })
}

/**
 * Complete the 3-step onboarding wizard with the minimum-required fields.
 * Caller is responsible for getting the page to the wizard first
 * (e.g. by calling loginViaForm with a freshly-registered user).
 */
export const completeOnboarding = async (page: Page, opts: OnboardingOptions = {}): Promise<void> => {
  const companyName = opts.companyName ?? `E2E Org ${Date.now().toString(36)}`

  await ensureOnboardingRoute(page)

  // Step 1 — fill the company name. The user's email domain is auto-added
  // to the domains list, so we don't need to add one manually.
  await page.locator('#companyName').fill(companyName)
  await page.getByRole('button', { name: /^User Info$/ }).click()

  // Step 2 — leave role/department blank.
  await page.getByRole('button', { name: /^Compliance Info$/ }).click()

  // Step 3 — leave all switches in their default off state.
  await page.getByRole('button', { name: /^Submit$/ }).click()

  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
}
