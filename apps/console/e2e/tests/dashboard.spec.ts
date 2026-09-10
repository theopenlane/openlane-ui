import type { Page } from '@playwright/test'
import { test as freshTest } from '@playwright/test'
import { test, expect } from '../fixtures/auth'
import { seedLoggedInUser } from '../utils/seedUser'

test.describe('dashboard — render', () => {
  test('/dashboard renders the "Welcome, ..." headline for an onboarded user', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByText(/^Welcome,/)).toBeVisible({ timeout: 15_000 })
  })

  test('/dashboard renders the authenticated shell (user menu trigger)', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 15_000 })
  })

  test('the header renders the welcome subtitle and the Quick actions bar', async ({ page }) => {
    await page.goto('/dashboard')

    const main = page.getByRole('main')
    await expect(main.getByText('Welcome,', { exact: false })).toBeVisible({ timeout: 15_000 })
    await expect(main.getByText("Here's what's happening in your organization today")).toBeVisible()

    await expect(main.getByText('Quick actions', { exact: true })).toBeVisible()
    await expect(main.getByRole('button', { name: 'View my tasks' })).toBeVisible()
    await expect(main.getByRole('button', { name: 'Review policies' })).toBeVisible()
  })

  test('the work-items and activity cards render alongside the overview slot', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const main = page.getByRole('main')

    await expect(main.getByText('Your Work', { exact: true })).toBeVisible({ timeout: 30_000 })

    await expect(main.getByText('Recent Activity', { exact: true })).toBeVisible({ timeout: 30_000 })

    const setup = main.getByText('Finish Setup', { exact: true })
    const overview = main.getByText('Compliance Overview', { exact: true })
    await expect(setup.or(overview).first()).toBeVisible({ timeout: 30_000 })
  })
})

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

    await page.getByRole('main').getByRole('button', { name: 'Log new risk' }).click()
    await expect(page).toHaveURL(/\/exposure\/risks\/create/, { timeout: 30_000 })
  })
})

test.describe('dashboard — compliance overview metric navigation', () => {
  const openOverview = async (page: Page): Promise<void> => {
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('main').getByText('Compliance Overview', { exact: true })).toBeVisible({ timeout: 30_000 })
  }

  const clickTile = async (page: Page, subtitle: string): Promise<void> => {
    await page.getByText(subtitle, { exact: true }).locator('xpath=../..').click()
  }

  test('the "Controls / Not Implemented" tile navigates to /controls', async ({ page }) => {
    test.slow()
    await openOverview(page)

    await clickTile(page, 'Not Implemented')
    await expect(page).toHaveURL(/\/controls/, { timeout: 30_000 })
  })

  test('the "Evidence / Items Missing" tile navigates to /evidence', async ({ page }) => {
    test.slow()
    await openOverview(page)

    await clickTile(page, 'Items Requested or Missing')
    await expect(page).toHaveURL(/\/evidence/, { timeout: 30_000 })
  })

  test('the "Tasks / Overdue" tile navigates to /automation/tasks', async ({ page }) => {
    test.slow()
    await openOverview(page)

    await clickTile(page, 'Overdue')
    await expect(page).toHaveURL(/\/automation\/tasks/, { timeout: 30_000 })
  })

  test('the "Risks / Pending Review" tile navigates to /exposure/risks', async ({ page }) => {
    test.slow()
    await openOverview(page)

    await clickTile(page, 'Pending Review')
    await expect(page).toHaveURL(/\/exposure\/risks/, { timeout: 30_000 })
  })
})

freshTest.describe('dashboard — setup checklist branch', () => {
  freshTest('the checklist shows its progress summary and external help links', async ({ page }) => {
    freshTest.slow()
    await seedLoggedInUser(page, 'dash-checklist', { viaWizard: true })

    const main = page.getByRole('main')
    const setup = main.getByText('Finish Setup', { exact: true })

    await expect(async () => {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(setup).toBeVisible({ timeout: 10_000 })
    }).toPass({ timeout: 120_000 })

    await expect(main.getByText(/^\d+ of \d+ completed$/)).toBeVisible()
    await expect(main.getByText('Complete these tasks to get the most out of Openlane')).toBeVisible()

    const docs = main.getByRole('link', { name: /View Docs/i })
    await expect(docs).toHaveAttribute('target', '_blank')
    await expect(main.getByRole('link', { name: /Contact Us/i })).toHaveAttribute('target', '_blank')
  })
})

test.describe('dashboard — sticky work-item grouping (ISS-2614)', () => {
  test('the Group by choice survives a reload', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('main').getByText('Your Work', { exact: true })).toBeVisible({ timeout: 45_000 })

    const kind = page.getByRole('button', { name: /^Kind$/ })
    test.skip(!(await kind.isVisible().catch(() => false)), 'no work items — the group-by filter bar is not rendered')

    await kind.click()
    await expect(kind).toHaveClass(/is-active/, { timeout: 15_000 })

    await page.reload()
    await expect(page.getByRole('main').getByText('Your Work', { exact: true })).toBeVisible({ timeout: 45_000 })

    await expect(page.getByRole('button', { name: /^Kind$/ })).toHaveClass(/is-active/, { timeout: 30_000 })
  })
})
