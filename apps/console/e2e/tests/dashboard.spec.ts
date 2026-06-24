import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Pure render checks.
test.describe('dashboard — render', () => {
  test('/dashboard renders the "Welcome, ..." headline for an onboarded user', async ({ page }) => {
    await page.goto('/dashboard')

    // dashboard-page.tsx renders <p>Welcome, {displayName}!</p>. Match the prefix.
    await expect(page.getByText(/^Welcome,/)).toBeVisible({ timeout: 15_000 })
  })

  test('/dashboard renders the authenticated shell (user menu trigger)', async ({ page }) => {
    await page.goto('/dashboard')

    // user-menu-trigger is the avatar/menu button in the authenticated shell.
    // Assert attached (not visible) — it's a zero-size div until hydration.
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 15_000 })
  })
})

test.describe('dashboard — overview cards & navigation', () => {
  test('compliance overview + action cards render their widgets', async ({ page }) => {
    await page.goto('/dashboard')

    const main = page.getByRole('main')

    await expect(main.getByText('Welcome,', { exact: false })).toBeVisible({ timeout: 15_000 })
    await expect(main.getByText("Here's what's happening in your organization.")).toBeVisible()

    // DashboardComplianceOverview section + its two metric groups.
    await expect(main.getByText('Compliance Overview')).toBeVisible()
    await expect(main.getByRole('heading', { name: 'Controls & Evidence' })).toBeVisible()
    await expect(main.getByRole('heading', { name: 'Risks & Tasks' })).toBeVisible()

    // DashboardActions cards.
    await expect(main.getByText('View All Controls')).toBeVisible()
    await expect(main.getByText('View My Tasks')).toBeVisible()
    await expect(main.getByText('Review / Edit Policies')).toBeVisible()
  })

  test('"View All Controls" action card navigates to /controls', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('main').getByText('View All Controls').click()
    await expect(page).toHaveURL(/\/controls/, { timeout: 30_000 })
  })

  test('"View My Tasks" action card navigates to tasks with showMyTasks filter', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('main').getByText('View My Tasks').click()
    await expect(page).toHaveURL(/\/automation\/tasks\?showMyTasks=true/, { timeout: 30_000 })
  })

  test('compliance overview "Controls" metric navigates to /controls', async ({ page }) => {
    await page.goto('/dashboard')

    // "Controls • Not Implemented" is a <p>; the clickable count div is its next sibling.
    const label = page.getByRole('paragraph').filter({ hasText: 'Not Implemented' })
    await label.locator('xpath=following-sibling::div[1]').click()
    await expect(page).toHaveURL(/\/controls/, { timeout: 30_000 })
  })

  test('suggested actions section renders its recommended items', async ({ page }) => {
    await page.goto('/dashboard')

    const main = page.getByRole('main')
    await expect(main.getByText('Suggested Actions')).toBeVisible({ timeout: 15_000 })
    await expect(main.getByText('Import your policies & procedures')).toBeVisible()
    await expect(main.getByText('Invite your team')).toBeVisible()
    await expect(main.getByText('Secure your organization')).toBeVisible()

    // View Documentation / Contact Support side cards.
    await expect(main.getByText('View Documentation')).toBeVisible()
    await expect(main.getByText('Contact Support')).toBeVisible()
  })
})

// DashboardActions cards (DashboardActions.tsx). The storage-state Owner has
// CanCreateRisk, so the second card reads "Create New Risk" and routes to the
// risk create form; the policies card routes to /policies. Both are router.push
// navigations to clean URLs.
test.describe('dashboard — action card navigation', () => {
  test('"Create New Risk" action card navigates to the risk create form', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // Owner holds CanCreateRisk → the card label is "Create New Risk".
    await page.getByRole('main').getByText('Create New Risk').click()
    await expect(page).toHaveURL(/\/exposure\/risks\/create/, { timeout: 30_000 })
  })

  test('"Review / Edit Policies" action card navigates to /policies', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('main').getByText('Review / Edit Policies').click()
    await expect(page).toHaveURL(/\/policies(\?|$|\/)/, { timeout: 30_000 })
  })
})

// Compliance overview metric counts (DashboardComplianceOverview.tsx). Each
// metric label is a <p> and the clickable count div is its next sibling. The
// click persists a filter to localStorage and navigates to a CLEAN url (no
// query params) — so we assert the destination path, not a query string.
test.describe('dashboard — compliance overview metric navigation', () => {
  const clickMetric = async (page: Page, labelText: string): Promise<void> => {
    const label = page.getByRole('paragraph').filter({ hasText: labelText })
    await label.locator('xpath=following-sibling::div[1]').click()
  }

  test('"Evidence • Items Missing" metric navigates to /evidence', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await clickMetric(page, 'Items Missing')
    await expect(page).toHaveURL(/\/evidence/, { timeout: 30_000 })
  })

  test('"Tasks • Overdue" metric navigates to /automation/tasks', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await clickMetric(page, 'Overdue')
    await expect(page).toHaveURL(/\/automation\/tasks/, { timeout: 30_000 })
  })

  test('"Risks • Pending Review" metric navigates to /exposure/risks', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await clickMetric(page, 'Pending Review')
    await expect(page).toHaveURL(/\/exposure\/risks/, { timeout: 30_000 })
  })
})

// Suggested actions (DashboardSuggestedActions.tsx). "Import your policies &
// procedures" opens the CreatePolicyUploadDialog ("Import Existing Policy(s)").
// "Invite your team" / "Secure your organization" are router.push navigations.
test.describe('dashboard — suggested actions interactions', () => {
  test('"Import your policies & procedures" opens the Import Existing Policy(s) dialog', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('main').getByText('Import your policies & procedures').click()
    await expect(page.getByRole('dialog', { name: /Import Existing Policy\(s\)/i })).toBeVisible({ timeout: 10_000 })
  })

  test('"Invite your team" navigates to the members page', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('main').getByText('Invite your team').click()
    await expect(page).toHaveURL(/\/user-management\/members/, { timeout: 30_000 })
  })

  test('"Secure your organization" navigates to organization authentication settings', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('main').getByText('Secure your organization').click()
    await expect(page).toHaveURL(/\/organization-settings\/authentication/, { timeout: 30_000 })
  })
})

// Documentation / Support side cards (DashboardViewDocumentation.tsx,
// DashboardContactSupport.tsx) are external anchor links opening in a new tab —
// assert the href/target rather than following the navigation.
test.describe('dashboard — external resource links', () => {
  test('"View Documentation" card links out to the docs site in a new tab', async ({ page }) => {
    await page.goto('/dashboard')

    const docsLink = page.getByRole('main').getByRole('link', { name: /Documentation/i })
    await expect(docsLink).toHaveAttribute('href', /theopenlane\.io/, { timeout: 15_000 })
    await expect(docsLink).toHaveAttribute('target', '_blank')
  })

  test('"Contact Support" card links out to the support site in a new tab', async ({ page }) => {
    await page.goto('/dashboard')

    const supportLink = page.getByRole('main').getByRole('link', { name: /Contact Support/i })
    await expect(supportLink).toHaveAttribute('href', /https?:\/\//, { timeout: 15_000 })
    await expect(supportLink).toHaveAttribute('target', '_blank')
  })
})
