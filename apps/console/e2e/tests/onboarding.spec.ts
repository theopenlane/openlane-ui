import { expect, test } from '@playwright/test'

import { PASSWORD, RUN_ID } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { backButton, companyNameInput, completeOnboarding, ensureOnboardingRoute, nextButton } from '../utils/onboarding'
import { registerAndVerify } from '../utils/registerUser'

/**
 * The wizard is now backend-driven: /api/onboarding/questions returns the steps
 * and questions (core's internal/onboarding/onboarding.yaml), and
 * dynamic-step.tsx / dynamic-field.tsx render them. Consequences for this suite:
 *
 *  - Field ids are question KEYS (`company_name`, `company_domains`,
 *    `company_sector`, `user_role`, …), not the old camelCase ids.
 *  - Step headings are the backend step titles: Company Info → User Info →
 *    Compliance Setup → Starting Point → Support Preferences → the trial card.
 *  - The footer's forward button is labelled with the NEXT step's title, so the
 *    helpers target it by its ArrowRight icon instead.
 *  - `company_name` is the only required question, and onboarding-page.tsx
 *    pre-fills it from the user's email domain. Advance is blocked by DISABLING
 *    the forward button (isNextDisabled), not by letting a click through to an
 *    error.
 */

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

    // onboarding-page.tsx derives the name from the domain's first label,
    // splitting on - / _ and title-casing each word.
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

    // company_name is the step's only required key → isNextDisabled flips true.
    await expect(nextButton(page)).toBeDisabled({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /^Company Info$/ })).toBeVisible()
  })

  test('a company name shorter than 3 characters shows a validation error', async ({ page }) => {
    const email = await freshUser('short')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('ab')

    // build-schema.ts: z.string().min(3, 'Company name requires at least 3 characters')
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

  test('a manually-added valid domain renders as a chip', async ({ page }) => {
    const email = await freshUser('domain-add')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // multi-input-field.tsx commits the draft on Enter/Tab/blur — there is no
    // "Add Domain" button any more.
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

    // Domains are optional now, so removing the auto-added chip must NOT block
    // advance — it just empties the list.
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

    // dynamic-field.tsx renders selects as Radix comboboxes labelled by the
    // question label; company_sector_other depends on company_sector === other.
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

    // boolean-field.tsx renders a Yes/No RadioGroup with ids
    // `<key>-true` / `<key>-false`.
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

    // onboarding-footer.tsx renders ExitOnboardingLink TWICE — once in a
    // `hidden lg:flex` desktop column and once in a `lg:hidden` mobile one — so
    // only the viewport-appropriate copy is ever visible. Filter on visibility
    // rather than picking an index, which would depend on the breakpoint.
    const exitLink = page.getByRole('button', { name: 'Exit the onboarding process' }).filter({ visible: true })

    // onboarding-page.tsx renders the exit shortcut whenever currentIndex > 0.
    await expect(page.getByRole('button', { name: 'Exit the onboarding process' })).toHaveCount(0)

    await companyNameInput(page).fill(`Early Exit Co ${Date.now().toString(36)}`)
    await nextButton(page).click()
    await expect(page.getByRole('heading', { name: /^User Info$/ })).toBeVisible()

    await expect(exitLink).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/use general template for my account/).filter({ visible: true })).toBeVisible()

    // exitOnboarding submits whatever is filled so far and router.push('/')es.
    await exitLink.click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 })
  })

  test('refresh mid-wizard wipes form state (in-memory only)', async ({ page }) => {
    // Documents current product behavior: the wizard holds form state in
    // useForm with no persistence layer, so a hard refresh resets it — back to
    // the domain-derived default rather than what was typed.
    const email = await freshUser('refresh')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    await companyNameInput(page).fill('Will Be Wiped')

    await page.reload()
    await ensureOnboardingRoute(page)

    await expect(companyNameInput(page)).not.toHaveValue('Will Be Wiped', { timeout: 15_000 })
  })
})

/**
 * ISS-2466 — the (protected) layout prefixes document.title with the active
 * organization's display name ("{Org} | {Page}"). A user who has not finished
 * onboarding is still in their auto-created PERSONAL org, whose name is derived
 * from their own account — leaking it into the browser tab looked like a bug.
 *
 * getOrgDisplayNameForRequest now returns null for a personalOrg, so the layout
 * falls back to the generic "Openlane | {Page}" template.
 */
test.describe('onboarding — document title (ISS-2466)', () => {
  test('a mid-onboarding user gets the generic Openlane title, not their personal org name', async ({ page }) => {
    const email = await freshUser('title')
    await loginViaForm(page, email, PASSWORD)
    await ensureOnboardingRoute(page)

    // onboarding/page.tsx sets metadata.title 'Onboarding'; the layout template
    // supplies the prefix.
    await expect(page).toHaveTitle(/^Openlane \| Onboarding$/, { timeout: 20_000 })

    // The personal org is named after the user, so the local-part must not leak
    // into the tab title.
    const localPart = email.split('@')[0]
    await expect(page).not.toHaveTitle(new RegExp(localPart, 'i'))
  })
})
