import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createInternalPolicy, type ApiSession } from '../utils/api'

/**
 * Deep policies flows beyond policies.spec.ts (which covers create/search/inline
 * edit on fresh users). Runs as the storage-state Owner; entities are seeded via
 * the Owner API (fast) with run-unique names. The shared org is long-lived, so
 * always search/target the unique name — never assert against the full list.
 *
 * ⏳ Written without running (servers were off). Selectors grounded in
 * policies.spec.ts (proven) + a component selector map; verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniquePolicyName = () => `E2E PolCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

const openTableView = async (page: Page) => {
  await page.goto('/policies', { waitUntil: 'domcontentloaded' })
  // TabSwitcher renders raw lucide SVGs; the Table icon has no accessible name.
  await page.locator('.lucide-table').first().click()
}

test.describe('policies — table tooling', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await openTableView(page)

    await page.getByRole('button', { name: /^Columns$/ }).click()
    // The menu lists column names as checkbox toggles; "Status" is one of them.
    await expect(page.getByRole('menu').getByText(/^Status$/)).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await openTableView(page)

    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('selecting rows reveals the Bulk Delete + Bulk Edit actions', async ({ page }) => {
    const name = uniquePolicyName()
    await createInternalPolicy(ownerApi, name)
    await openTableView(page)

    // The shared org has many policies + pagination, so search to surface the
    // seeded row, then check its row checkbox (the header select-all is disabled
    // until rows settle). Selecting a row flips the toolbar into the bulk state.
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })

    // The bulk state also exposes "Bulk Edit" → bulk-edit-policies.tsx dialog.
    await page.getByRole('button', { name: /^Bulk Edit/ }).click()
    await expect(page.getByRole('dialog').getByText('Bulk edit')).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('policies — detail (seeded)', () => {
  test('version history tab renders the current revision', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: /^History$/ }).click()
    // history-tab.tsx marks the current revision with a "Current" badge.
    await expect(page.getByText(/^Current$/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('inline status change on a policy persists across reload', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    // properties-card.tsx: double-clicking the status (policy-status-trigger)
    // swaps it for a Select; pick a new status, then reload to prove persistence.
    const statusTrigger = page.getByTestId('policy-status-trigger')
    await statusTrigger.dblclick()
    const statusSelect = page.getByRole('combobox')
    await expect(statusSelect).toBeVisible({ timeout: 5_000 })
    await statusSelect.click()
    await page.getByRole('option', { name: /^Published$/i }).click()

    await expect(statusTrigger).toContainText(/Published/i, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('policy-status-trigger')).toContainText(/Published/i, { timeout: 15_000 })
  })

  test('delete a policy from the detail actions menu redirects to the list', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    // The 3-dot actions menu (Ellipsis) holds Edit / Delete / Manage Permissions.
    await page.getByTestId('policy-actions-menu').click()
    await page.getByTestId('policy-delete-button').click()
    // ConfirmationDialog "Delete Internal Policy" — confirm.
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.waitForURL(/\/policies(\?|$)/, { timeout: 20_000 })
  })
})
