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
 * The wizard's step count and titles come from the backend
 * (/api/onboarding/questions → onboarding.yaml), so the footer's forward button
 * is labelled with the NEXT step's title rather than a fixed word. Both footer
 * buttons are identified by their Lucide arrow icon instead: forward carries
 * ArrowRight, back carries ArrowLeft.
 */
export const nextButton = (page: Page) => page.locator('button:has(.lucide-arrow-right)').last()
export const backButton = (page: Page) => page.locator('button:has(.lucide-arrow-left)').last()
export const companyNameInput = (page: Page) => page.locator('#company_name')

/**
 * Walk the whole wizard with the minimum-required answers and land on the
 * dashboard. Caller is responsible for getting the page to the wizard first
 * (e.g. by calling loginViaForm with a freshly-registered user).
 *
 * Only `company_name` is required, and onboarding-page.tsx pre-fills it from the
 * user's email domain — so every step's forward button is already enabled and
 * the walk is just "advance until Submit".
 */
export const completeOnboarding = async (page: Page, opts: OnboardingOptions = {}): Promise<void> => {
  await ensureOnboardingRoute(page)

  const name = companyNameInput(page)
  await name.waitFor({ state: 'visible', timeout: 30_000 })
  if (opts.companyName) {
    await name.fill(opts.companyName)
  }

  const submit = page.getByRole('button', { name: /^Submit$/ })

  // The backend owns the step count; cap the walk well above it so a config
  // change can't turn this into an infinite loop.
  for (let step = 0; step < 15; step++) {
    if (await submit.isVisible().catch(() => false)) break
    await nextButton(page).click()
    await page.waitForTimeout(250)
  }

  await submit.click()

  // submitOnboarding → a transition card ("Setting up your workspace") →
  // onboarding-ready-card.tsx, which offers "Go to dashboard" when there is no
  // domain-scan report and "Review what we found" / "Do this later" when there
  // is. Provisioning the workspace takes ~10s, hence the generous wait.
  const goToDashboard = page.getByRole('button', { name: /^Go to dashboard$/ })
  const doThisLater = page.getByRole('button', { name: /^Do this later$/ })
  await goToDashboard.or(doThisLater).first().waitFor({ state: 'visible', timeout: 120_000 })
  await goToDashboard.or(doThisLater).first().click()

  // Both leave paths call updateSession then router.push('/'), but '/' is the
  // one path middleware ALWAYS bounces back to /onboarding while the session
  // still reports isOnboarding — and the session update lands a beat after the
  // push. Navigating to /dashboard explicitly sidesteps that race; poll because
  // the first attempt can still land before the new session cookie is set.
  for (let attempt = 0; attempt < 20; attempt++) {
    await page.waitForTimeout(1_500)
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }).catch(() => {})
    if (page.url().includes('/dashboard')) return
  }

  throw new Error(`completeOnboarding: never reached /dashboard (stuck at ${page.url()})`)
}
