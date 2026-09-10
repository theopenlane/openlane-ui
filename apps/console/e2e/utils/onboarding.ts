import { expect, type Page } from '@playwright/test'

interface OnboardingOptions {
  companyName?: string
}

export const ensureOnboardingRoute = async (page: Page): Promise<void> => {
  await page.waitForFunction(() => window.location.pathname.startsWith('/onboarding') || window.location.pathname.startsWith('/dashboard'), undefined, { timeout: 30_000 })

  await expect(async () => {
    if (!new URL(page.url()).pathname.startsWith('/onboarding')) {
      await page.goto('/onboarding', { waitUntil: 'domcontentloaded' })
    }
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 })
  }).toPass({ timeout: 60_000 })
}

/** The wizard's step count and titles come from the backend (/api/onboarding/questions → onboarding.yaml). */
export const nextButton = (page: Page) => page.locator('button:has(.lucide-arrow-right)').last()
export const backButton = (page: Page) => page.locator('button:has(.lucide-arrow-left)').last()
export const companyNameInput = (page: Page) => page.locator('#company_name')

/** Walk the whole wizard with the minimum-required answers and land on the dashboard. */
export const completeOnboarding = async (page: Page, opts: OnboardingOptions = {}): Promise<void> => {
  await ensureOnboardingRoute(page)

  const name = companyNameInput(page)
  await name.waitFor({ state: 'visible', timeout: 30_000 })
  if (opts.companyName) {
    await name.fill(opts.companyName)
  }

  const submit = page.getByRole('button', { name: /^Submit$/ })

  for (let step = 0; step < 15; step++) {
    if (await submit.isVisible().catch(() => false)) break
    await nextButton(page).click()
    await page.waitForTimeout(250)
  }

  await submit.click()

  const goToDashboard = page.getByRole('button', { name: /^Go to dashboard$/ })
  const doThisLater = page.getByRole('button', { name: /^Do this later$/ })
  await goToDashboard.or(doThisLater).first().waitFor({ state: 'visible', timeout: 120_000 })
  await goToDashboard.or(doThisLater).first().click()

  for (let attempt = 0; attempt < 25; attempt++) {
    if (page.url().includes('/dashboard')) return
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {})
    if (page.url().includes('/dashboard')) return
    await page.waitForTimeout(2_000)
  }

  throw new Error(`completeOnboarding: never reached /dashboard (stuck at ${page.url()})`)
}
