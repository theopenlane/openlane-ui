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
