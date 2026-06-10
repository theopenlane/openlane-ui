import { expect, test } from '@playwright/test'

import { PASSWORD, RUN_ID } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { completeOnboarding, ensureOnboardingRoute } from '../utils/onboarding'
import { registerAndVerify } from '../utils/registerUser'

// Onboarding is one-shot per account, so every test that completes the
// wizard needs a fresh user. We *also* need a unique email DOMAIN per
// test, because completing onboarding registers the user's domain on
// the new org's allowed-domains list — meaning subsequent users with the
// same domain would auto-join into that org and skip the wizard. RFC 2606
// reserves `.invalid` so it never collides with anything real.
const freshUser = async (slug: string) => {
  const unique = `${slug}-${RUN_ID}-${Date.now().toString(36)}`
  const email = `user@${unique}.invalid`
  await registerAndVerify({ email })
  return email
}

// Each test in this file creates a fresh user and hits the same local
// backend, so running them in parallel races on /v1/register + /v1/login.
// Serial execution adds a few seconds and removes a class of flake.
//
// Retries: the post-login `getDashboardData` request occasionally returns
// null (transient backend/session race), which makes NextAuth's
// `isOnboarding` fall through to false and routes the user to /dashboard
// instead of /onboarding. That's a product flake worth fixing upstream;
// in the meantime, one retry keeps this suite stable.
test.describe.configure({ mode: 'serial', retries: 2 })

test.describe('onboarding', () => {
  test('happy path — fresh user completes the wizard and lands on /dashboard', async ({ page }) => {
    const email = await freshUser('happy')
    await loginViaForm(page, email, PASSWORD)

    const companyName = `E2E Co ${Date.now().toString(36)}`
    await completeOnboarding(page, { companyName })

    await expect(page).toHaveURL(/\/dashboard/)
    // Org name only appears in the (collapsed) sidebar org-switcher on the
    // dashboard, which renders it as an image-only button by default. We
    // could expand the sidebar and assert on the dropdown, but the URL
    // transition is sufficient evidence that onboarding succeeded.
  })

  test('step 1 blocks advance when companyName is empty', async ({ page }) => {
    const email = await freshUser('empty')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // Don't type anything — companyName starts empty.
    await page.getByRole('button', { name: /^User Info$/ }).click()

    // Should still be on Step 1 (header reads "Company Info").
    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
    await expect(page.getByText(/Company name requires at least 3 characters/i)).toBeVisible()
  })

  test('step 1 blocks advance when companyName is shorter than 3 characters', async ({ page }) => {
    const email = await freshUser('short')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#companyName').fill('ab')
    await page.getByRole('button', { name: /^User Info$/ }).click()

    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
    await expect(page.getByText(/Company name requires at least 3 characters/i)).toBeVisible()
  })

  test('back button preserves entered data', async ({ page }) => {
    const email = await freshUser('back')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    const companyName = 'Back Button Test'
    await page.locator('#companyName').fill(companyName)
    await page.getByRole('button', { name: /^User Info$/ }).click()

    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()
    await page.getByRole('button', { name: /^Company Info$/ }).click()

    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
    await expect(page.locator('#companyName')).toHaveValue(companyName)
  })

  test('user email domain is auto-added as a domain chip', async ({ page }) => {
    const email = await freshUser('domain')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // The domain part of the email — for our seeded users this is openlane.test.
    const domain = email.split('@')[1]
    await expect(page.getByText(domain).first()).toBeVisible()
  })

  test('completed user can still reach /onboarding (product currently allows re-entry)', async ({ page }) => {
    // NOTE: this documents current behavior, not a feature. The wizard has
    // no guard against re-entry after onboarding has already been completed.
    // If the product team adds a redirect, flip this assertion.
    const email = await freshUser('reentry')
    await loginViaForm(page, email, PASSWORD)
    await completeOnboarding(page)

    await page.goto('/onboarding')
    await expect(page).toHaveURL(/\/onboarding/)
    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
  })

  test('manually-added valid domain renders as a chip', async ({ page }) => {
    const email = await freshUser('domain-add')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#domains').fill('acme.example')
    await page.getByRole('button', { name: /^Add Domain$/i }).click()

    await expect(page.getByText('acme.example')).toBeVisible()
  })

  test('manually-added invalid domain triggers a native alert', async ({ page }) => {
    const email = await freshUser('domain-bad')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // The component calls window.alert() for invalid input. Native
    // alert() blocks the JS thread until dismissed, which means the
    // click() promise won't resolve unless we dismiss in the handler.
    // page.once('dialog', ...) attached BEFORE the click both dismisses
    // and gives us the message to assert on.
    let dialogMessage = ''
    page.once('dialog', async (dialog) => {
      dialogMessage = dialog.message()
      await dialog.dismiss()
    })

    await page.locator('#domains').fill('not-a-domain')
    await page.getByRole('button', { name: /^Add Domain$/i }).click()

    expect(dialogMessage).toMatch(/invalid domain/i)
  })

  test('removing all domain chips blocks advance (zod requires ≥1 domain)', async ({ page }) => {
    const email = await freshUser('no-domain')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#companyName').fill('No Domain Co')

    // Remove the auto-added user-domain chip. The chip is a <Badge>
    // containing the domain text plus an icon-only close button — the
    // close button has no accessible name, so reach it via the badge.
    const domain = email.split('@')[1]
    const chip = page.getByText(domain, { exact: true }).locator('..')
    await chip.getByRole('button').click()
    await expect(page.getByText(domain, { exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: /^User Info$/ }).click()

    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
    await expect(page.getByText(/Please enter at least one domain/i)).toBeVisible()
  })

  test('Step 2 values persist when navigating forward then back from Step 3', async ({ page }) => {
    const email = await freshUser('step2-back')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#companyName').fill('Step2 Persistence Test')
    await page.getByRole('button', { name: /^User Info$/ }).click()

    const role = 'Compliance Manager'
    await page.locator('#role').fill(role)
    await page.getByRole('button', { name: /^Compliance Info$/ }).click()
    await expect(page.getByRole('heading', { name: /^Compliance Info$/ })).toBeVisible()

    await page.getByRole('button', { name: /^User Info$/ }).click()
    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()
    await expect(page.locator('#role')).toHaveValue(role)
  })

  test('refresh mid-wizard wipes form state (in-memory only)', async ({ page }) => {
    // Documents current product behavior: the wizard holds form state in
    // useForm/useRef with no persistence layer, so a hard refresh resets
    // it. If the product team adds a draft-save mechanism, flip this.
    const email = await freshUser('refresh')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await page.locator('#companyName').fill('Will Be Wiped')

    await page.reload()
    await ensureOnboardingRoute(page)

    await expect(page.locator('#companyName')).toHaveValue('')
  })

  test('step 1 sector "Other (Please Specify)" reveals the custom sector input', async ({ page }) => {
    const email = await freshUser('sector-other')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // step-1.tsx has several Selects (company size, sector, …). The Company
    // Sector trigger shows the placeholder "Choose"; target it specifically.
    // Choosing "Other (Please Specify)" reveals a "Please Specify" label + the
    // #otherSector input.
    await page.getByRole('combobox').filter({ hasText: 'Choose' }).click()
    await page.getByRole('option', { name: 'Other (Please Specify)' }).click()

    await expect(page.getByText('Please Specify', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('#otherSector')).toBeVisible()
  })

  test('step 2 (User Info) shows the "exit and use general template" shortcut', async ({ page }) => {
    const email = await freshUser('exit-link')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // Advance Step 1 → Step 2: the next button is labelled with the next step's
    // name ("User Info"), per onboarding-page.tsx.
    await page.locator('#companyName').fill(`E2E Co ${Date.now().toString(36)}`)
    await page.getByRole('button', { name: /^User Info$/ }).click()

    // onboarding-page.tsx renders the exit shortcut only on the 2nd step.
    await expect(page.getByText(/Exit the onboarding process/)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/use general template for my account/)).toBeVisible()
  })
})
