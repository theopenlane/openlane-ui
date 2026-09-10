import { expect, test } from '@playwright/test'

import { PASSWORD, RUN_ID } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { backButton, companyNameInput, completeOnboarding, ensureOnboardingRoute, nextButton } from '../utils/onboarding'
import { registerAndVerify } from '../utils/registerUser'

// Onboarding is one-shot per account, so every test that completes the wizard needs a fresh user
const freshUser = async (slug: string) => {
  const unique = `${slug}-${RUN_ID}-${Date.now().toString(36)}`
  const email = `user@${unique}.invalid`
  await registerAndVerify({ email })
  return email
}

test.describe.configure({ mode: 'serial', retries: 2 })

test.describe('onboarding', () => {
  test('happy path — fresh user completes the wizard and lands on /dashboard', async ({ page }) => {
    test.slow()
    const email = await freshUser('happy')
    await loginViaForm(page, email, PASSWORD)

    const companyName = `E2E Co ${Date.now().toString(36)}`
    await completeOnboarding(page, { companyName })

    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('the company name is pre-filled from the user email domain', async ({ page }) => {
    const email = await freshUser('prefill')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    const expected = email
      .split('@')[1]
      .split('.')[0]
      .split(/[-_]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

    await expect(companyNameInput(page)).toHaveValue(expected, { timeout: 15_000 })
  })

  test('clearing the company name disables advance', async ({ page }) => {
    const email = await freshUser('empty')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('')

    await expect(nextButton(page)).toBeDisabled({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
  })

  test('a company name shorter than 3 characters shows a validation error', async ({ page }) => {
    const email = await freshUser('short')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('ab')

    await expect(page.getByText(/Company name requires at least 3 characters/i)).toBeVisible({ timeout: 10_000 })
    await expect(nextButton(page)).toBeDisabled()
  })

  test('back button preserves entered data', async ({ page }) => {
    const email = await freshUser('back')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    const companyName = 'Back Button Test'
    await companyNameInput(page).fill(companyName)
    await nextButton(page).click()

    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()
    await backButton(page).click()

    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
    await expect(companyNameInput(page)).toHaveValue(companyName)
  })

  test('user email domain is auto-added as a domain chip', async ({ page }) => {
    const email = await freshUser('domain')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    const domain = email.split('@')[1]
    await expect(page.getByText(domain).first()).toBeVisible()
  })

  test('completed user can still reach /onboarding (product currently allows re-entry)', async ({ page }) => {
    test.slow()
    const email = await freshUser('reentry')
    await loginViaForm(page, email, PASSWORD)
    await completeOnboarding(page)

    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
  })

  test('a manually-added valid domain renders as a chip', async ({ page }) => {
    const email = await freshUser('domain-add')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#company_domains').fill('acme.example')
    await page.locator('#company_domains').press('Enter')

    await expect(page.getByText('acme.example')).toBeVisible()
  })

  test.fixme('a manually-added invalid domain shows an inline format error — core onboarding.yaml omits `format: domain` on company_domains, so DOMAIN_REGEX never runs', async ({ page }) => {
    const email = await freshUser('domain-bad')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#company_domains').fill('not-a-domain')
    await page.locator('#company_domains').press('Enter')

    await expect(page.getByText('Invalid domain format. Example: acme.com')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('not-a-domain', { exact: true })).toHaveCount(0)
  })

  test('a domain chip can be removed via its Remove control', async ({ page }) => {
    const email = await freshUser('domain-remove')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    const domain = email.split('@')[1]
    await expect(page.getByText(domain, { exact: true })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: `Remove ${domain}` }).click()
    await expect(page.getByText(domain, { exact: true })).toHaveCount(0)
    await expect(nextButton(page)).toBeEnabled()
  })

  test('the sector "Other" option reveals the "Please specify" input', async ({ page }) => {
    const email = await freshUser('sector-other')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.getByLabel('Company Sector').click()
    await page.getByRole('option', { name: 'Other', exact: true }).click()

    await expect(page.getByText('Please specify', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#company_sector_other')).toBeVisible()
  })

  test('the company-size selection persists across forward/back navigation', async ({ page }) => {
    const email = await freshUser('size')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('Company Size Co')

    const sizeTrigger = () => page.getByLabel('Company Size')
    await sizeTrigger().click()
    await page.getByRole('option', { name: '11-50', exact: true }).click()
    await expect(sizeTrigger()).toContainText('11-50')

    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()
    await backButton(page).click()

    await expect(sizeTrigger()).toContainText('11-50')
  })

  test('the User Info department selection persists across forward/back navigation', async ({ page }) => {
    const email = await freshUser('dept')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('Department Co')
    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()

    const deptTrigger = () => page.getByLabel('Department')
    await deptTrigger().click()
    await page.getByRole('option', { name: 'Security', exact: true }).click()
    await expect(deptTrigger()).toContainText('Security')

    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^Compliance Setup$/ })).toBeVisible()
    await backButton(page).click()

    await expect(deptTrigger()).toContainText('Security')
  })

  test('a Starting Point boolean answer persists across back/forward', async ({ page }) => {
    const email = await freshUser('boolean')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('Boolean Co')
    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()
    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^Compliance Setup$/ })).toBeVisible()
    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^Starting Point$/ })).toBeVisible()

    const yes = page.locator('#has_existing_controls-true')
    await yes.click()
    await expect(yes).toBeChecked()

    await backButton(page).click()
    await expect(page.getByRole('heading', { name: /^Compliance Setup$/ })).toBeVisible()
    await nextButton(page).click()

    await expect(page.locator('#has_existing_controls-true')).toBeChecked()
  })

  test('the exit shortcut appears after the first step and submits onboarding', async ({ page }) => {
    test.slow()
    const email = await freshUser('early-exit')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    const exitLink = page.getByRole('button', { name: 'Exit the onboarding process' }).filter({ visible: true })

    await expect(page.getByRole('button', { name: 'Exit the onboarding process' })).toHaveCount(0)

    await companyNameInput(page).fill(`Early Exit Co ${Date.now().toString(36)}`)
    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()

    await expect(exitLink).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/use general template for my account/).filter({ visible: true })).toBeVisible()

    await exitLink.click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  })

  test('refresh mid-wizard wipes form state (in-memory only)', async ({ page }) => {
    const email = await freshUser('refresh')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('Will Be Wiped')

    await page.reload()
    await ensureOnboardingRoute(page)

    await expect(companyNameInput(page)).not.toHaveValue('Will Be Wiped', { timeout: 15_000 })
  })
})

test.describe('onboarding — document title (ISS-2466)', () => {
  test('a mid-onboarding user gets the generic Openlane title, not their personal org name', async ({ page }) => {
    const email = await freshUser('title')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await expect(page).toHaveTitle(/^Openlane \| Onboarding$/, { timeout: 20_000 })

    const localPart = email.split('@')[0]
    await expect(page).not.toHaveTitle(new RegExp(localPart, 'i'))
  })
})
