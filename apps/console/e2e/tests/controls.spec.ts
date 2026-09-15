import { test, expect } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'
import { dismissDraftRestore } from '../utils/drafts'

import { uniqueRef } from '../utils/unique'
import { expectMutationOk } from '../utils/mutations'

const refCodeFor = (slug: string) => uniqueRef(`E2E-${slug}`)

test.describe('controls — create + view', () => {
  test('required validation — submitting without a Ref Code stays on create-control and shows the inline error', async ({ page }) => {
    await page.goto('/controls/create-control')
    await dismissDraftRestore(page)

    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()

    await expect(page).toHaveURL(/\/controls\/create-control(\?|$)/)
    await expect(page.getByText(/^Ref Code is required$/)).toBeVisible()
  })

  test('search by ref code filters server-side — second control disappears when the first ref is typed', async ({ page }) => {
    const a = refCodeFor('search-a')
    const b = refCodeFor('search-b')
    for (const refCode of [a, b]) {
      await page.goto('/controls/create-control')
      await dismissDraftRestore(page)
      await page.locator('input[name="refCode"]').fill(refCode)
      await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
      await page.waitForURL(/\/controls\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })
    }

    await page.goto('/controls')
    await page.locator('.lucide-table').first().click()

    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 30_000 })
  })

  test('happy path — create a control and land on the detail page', async ({ page }) => {
    await page.goto('/controls/create-control')
    await dismissDraftRestore(page)

    const refCode = refCodeFor('ctl')
    await page.locator('input[name="refCode"]').fill(refCode)

    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()

    await page.waitForURL(/\/controls\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    await expect(page.getByRole('heading', { level: 1, name: refCode })).toBeVisible({ timeout: 15_000 })
  })

  test('create-subcontrol — submitting without a Parent Control shows the inline error', async ({ page }) => {
    await page.goto('/controls/create-subcontrol')

    await page.locator('input[name="refCode"]').fill(refCodeFor('sub-req'))

    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()

    await expect(page).toHaveURL(/\/controls\/create-subcontrol(\?|$)/)
    await expect(page.getByText(/^Parent Control is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('newly created control appears in the controls table view', async ({ page }) => {
    await page.goto('/controls/create-control')
    await dismissDraftRestore(page)
    const refCode = refCodeFor('listed')
    await page.locator('input[name="refCode"]').fill(refCode)
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
    await page.waitForURL(/\/controls\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    await page.goto('/controls')
    await page.locator('.lucide-table').first().click()

    await page.getByPlaceholder(/^Search$/).fill(refCode)

    await expect(page.getByRole('cell').filter({ hasText: refCode }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('inline title rename: double-click h1 → edit refCode → Enter → reload → new refCode persists', async ({ page }) => {
    await page.goto('/controls/create-control')
    await dismissDraftRestore(page)
    const original = refCodeFor('orig')
    await page.locator('input[name="refCode"]').fill(original)
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
    await page.waitForURL(/\/controls\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    const originalH1 = page.getByRole('heading', { level: 1, name: original })
    await expect(originalH1).toBeVisible({ timeout: 15_000 })

    const updated = refCodeFor('updt')
    await expect(async () => {
      const h1 = page.getByRole('heading', { level: 1 }).first()
      await h1.dispatchEvent('dblclick')
      const refCodeInput = page.getByLabel(/^Ref Code/)
      await expect(refCodeInput).toBeVisible({ timeout: 2_000 })
      await refCodeInput.fill(updated)
      await expectMutationOk(page, 'UpdateControl', async () => {
        await refCodeInput.press('Enter')
      })
      await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 10_000 })
    }).toPass({ timeout: 60_000 })

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: double-click status → select Preparing → reload → new status persists', async ({ page }) => {
    await page.goto('/controls/create-control')
    await dismissDraftRestore(page)
    const refCode = refCodeFor('status')
    await page.locator('input[name="refCode"]').fill(refCode)
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
    await page.waitForURL(/\/controls\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    const statusTrigger = page.getByTestId('control-status-trigger')
    await expect(statusTrigger).toContainText(/^Not Implemented$/)

    // Scoped testid, not getByRole('combobox')
    const statusSelect = page.getByTestId('control-status-select')
    await expect(async () => {
      await statusTrigger.dblclick()
      await expect(statusSelect).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })

    await statusSelect.click()
    await page.getByRole('option', { name: /^Preparing$/i }).click()

    await expect(statusTrigger).toContainText(/^Preparing$/, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('control-status-trigger')).toContainText(/^Preparing$/, { timeout: 15_000 })
  })
})

freshTest.describe('controls — fresh org', () => {
  freshTest('empty controls list shows the "Create controls" empty state for a fresh user', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-empty')

    await page.goto('/controls')

    const emptyRegion = page.getByRole('region', { name: /create controls/i })
    await expect(emptyRegion).toBeVisible()
    await expect(emptyRegion.getByText(/create custom controls/i)).toBeVisible()
  })
})
