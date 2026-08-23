import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'

/**
 * Logged in as the storage-state Owner (global-setup).
 *
 * The dashboard is assembled by dashboard-page.tsx into dashboard-page-shell.tsx
 * as four slots: header (welcome + DashboardActions "Quick actions"), overview,
 * main (DashboardTasksAndSuggestions → "Your Work") and aside (ActivityFeed →
 * "Recent Activity").
 *
 * The overview slot is CONDITIONAL: until the setup checklist is finished it
 * renders DashboardSetupChecklist ("Finish Setup"); once complete — and only
 * with the compliance module — it renders DashboardComplianceOverview
 * ("Compliance Overview"). Specs that need one or the other branch assert the
 * branch they are in rather than assuming a fixed layout.
 */
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

  test('the header renders the welcome subtitle and the Quick actions bar', async ({ page }) => {
    await page.goto('/dashboard')

    const main = page.getByRole('main')
    await expect(main.getByText('Welcome,', { exact: false })).toBeVisible({ timeout: 15_000 })
    await expect(main.getByText("Here's what's happening in your organization today")).toBeVisible()

    // DashboardActions.tsx renders a "Quick actions" label followed by buttons.
    await expect(main.getByText('Quick actions', { exact: true })).toBeVisible()
    await expect(main.getByRole('button', { name: 'View my tasks' })).toBeVisible()
    await expect(main.getByRole('button', { name: 'Review policies' })).toBeVisible()
  })

  test('the work-items and activity cards render alongside the overview slot', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const main = page.getByRole('main')

    // work-items-card.tsx CardTitle, always rendered.
    await expect(main.getByText('Your Work', { exact: true })).toBeVisible({ timeout: 30_000 })

    // activity-feed-card.tsx DEFAULT_ACTIVITY_FEED_TITLE.
    await expect(main.getByText('Recent Activity', { exact: true })).toBeVisible({ timeout: 30_000 })

    // The overview slot resolves to exactly one of the two branches.
    const setup = main.getByText('Finish Setup', { exact: true })
    const overview = main.getByText('Compliance Overview', { exact: true })
    await expect(setup.or(overview).first()).toBeVisible({ timeout: 30_000 })
  })
})

// DashboardActions.tsx quick-action buttons are router.push navigations. The
// storage-state Owner holds CanCreateRisk, so the risk action reads
// "Log new risk" and routes to the risk create form.
test.describe('dashboard — quick action navigation', () => {
  test('"View my tasks" navigates to tasks with the showMyTasks filter', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('main').getByRole('button', { name: 'View my tasks' }).click()
    await expect(page).toHaveURL(/\/automation\/tasks\?showMyTasks=true/, { timeout: 30_000 })
  })

  test('"Review policies" navigates to /policies', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('main').getByRole('button', { name: 'Review policies' }).click()
    await expect(page).toHaveURL(/\/policies(\?|$|\/)/, { timeout: 30_000 })
  })

  test('"Add evidence" navigates to /evidence', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('main').getByRole('button', { name: 'Add evidence' }).click()
    await expect(page).toHaveURL(/\/evidence/, { timeout: 30_000 })
  })

  test('"Log new risk" navigates to the risk create form', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // Owner holds CanCreateRisk → the action reads "Log new risk".
    await page.getByRole('main').getByRole('button', { name: 'Log new risk' }).click()
    await expect(page).toHaveURL(/\/exposure\/risks\/create/, { timeout: 30_000 })
  })
})

/**
 * Compliance overview metric tiles (DashboardComplianceOverview.tsx). Each tile
 * is a clickable div holding a label <p> and a subtitle <p>; clicking persists a
 * filter to localStorage and navigates to a CLEAN url (no query params), so we
 * assert the destination path.
 *
 * The card only renders once the setup checklist is complete, so each test skips
 * itself when the dashboard is still showing "Finish Setup".
 */
test.describe('dashboard — compliance overview metric navigation', () => {
  const openOverview = async (page: Page): Promise<boolean> => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const overview = page.getByRole('main').getByText('Compliance Overview', { exact: true })
    const setup = page.getByRole('main').getByText('Finish Setup', { exact: true })
    await expect(overview.or(setup).first()).toBeVisible({ timeout: 30_000 })
    return overview.isVisible()
  }

  const clickTile = async (page: Page, subtitle: string): Promise<void> => {
    // The subtitle <p> is the second child of the tile's text column; the tile
    // itself is the clickable ancestor two levels up.
    await page.getByText(subtitle, { exact: true }).locator('xpath=../..').click()
  }

  test('the "Controls / Not Implemented" tile navigates to /controls', async ({ page }) => {
    test.slow()
    test.skip(!(await openOverview(page)), 'setup checklist still in progress — compliance overview not rendered')

    await clickTile(page, 'Not Implemented')
    await expect(page).toHaveURL(/\/controls/, { timeout: 30_000 })
  })

  test('the "Evidence / Items Missing" tile navigates to /evidence', async ({ page }) => {
    test.slow()
    test.skip(!(await openOverview(page)), 'setup checklist still in progress — compliance overview not rendered')

    await clickTile(page, 'Items Missing')
    await expect(page).toHaveURL(/\/evidence/, { timeout: 30_000 })
  })

  test('the "Tasks / Overdue" tile navigates to /automation/tasks', async ({ page }) => {
    test.slow()
    test.skip(!(await openOverview(page)), 'setup checklist still in progress — compliance overview not rendered')

    await clickTile(page, 'Overdue')
    await expect(page).toHaveURL(/\/automation\/tasks/, { timeout: 30_000 })
  })

  test('the "Risks / Pending Review" tile navigates to /exposure/risks', async ({ page }) => {
    test.slow()
    test.skip(!(await openOverview(page)), 'setup checklist still in progress — compliance overview not rendered')

    await clickTile(page, 'Pending Review')
    await expect(page).toHaveURL(/\/exposure\/risks/, { timeout: 30_000 })
  })
})

/**
 * The setup checklist branch (DashboardSetupChecklist.tsx) renders a progress
 * summary plus "View Docs" / "Contact Us" external help links. Skipped once the
 * org has finished onboarding and the compliance overview replaces it.
 */
test.describe('dashboard — setup checklist branch', () => {
  test('the checklist shows its progress summary and external help links', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const main = page.getByRole('main')
    const setup = main.getByText('Finish Setup', { exact: true })
    const overview = main.getByText('Compliance Overview', { exact: true })
    await expect(setup.or(overview).first()).toBeVisible({ timeout: 30_000 })
    test.skip(!(await setup.isVisible()), 'setup already complete — compliance overview rendered instead')

    await expect(main.getByText(/^\d+ of \d+ completed$/)).toBeVisible()
    await expect(main.getByText('Complete these tasks to get the most out of Openlane')).toBeVisible()

    const docs = main.getByRole('link', { name: /View Docs/i })
    await expect(docs).toHaveAttribute('target', '_blank')
    await expect(main.getByRole('link', { name: /Contact Us/i })).toHaveAttribute('target', '_blank')
  })
})

/**
 * ISS-2614 — the work-items "Group by" choice is now persisted per organization
 * (createOrgPersistedStore, unit-tested in lib/storage/org-persisted-store.test.ts)
 * so it survives a reload instead of resetting to Type every visit.
 */
test.describe('dashboard — sticky work-item grouping (ISS-2614)', () => {
  test('the Group by choice survives a reload', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('main').getByText('Your Work', { exact: true })).toBeVisible({ timeout: 45_000 })

    // filter-bar.tsx renders the GROUP_BY_OPTIONS as variant="tag" buttons; the
    // active one carries `is-active`. The bar only shows when there is work.
    const kind = page.getByRole('button', { name: /^Kind$/ })
    test.skip(!(await kind.isVisible().catch(() => false)), 'no work items — the group-by filter bar is not rendered')

    await kind.click()
    await expect(kind).toHaveClass(/is-active/, { timeout: 15_000 })

    await page.reload()
    await expect(page.getByRole('main').getByText('Your Work', { exact: true })).toBeVisible({ timeout: 45_000 })

    await expect(page.getByRole('button', { name: /^Kind$/ })).toHaveClass(/is-active/, { timeout: 30_000 })
  })
})
