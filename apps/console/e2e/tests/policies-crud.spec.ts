import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createInternalPolicy, createControl, createProcedure, gql, type ApiSession } from '../utils/api'

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
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 30_000 })

    const statusTrigger = page.getByTestId('policy-status-trigger')
    const statusSelect = page.getByRole('combobox')
    await expect(async () => {
      await statusTrigger.dblclick()
      await expect(statusSelect).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
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

const linkPolicyProcedure = async (sess: ApiSession, policyId: string, procedureId: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!, $input: UpdateInternalPolicyInput!){ updateInternalPolicy(id: $id, input: $input){ internalPolicy { id } } }`, {
    id: policyId,
    input: { addProcedureIDs: [procedureId] },
  })
}

test.describe('policies — associations & flows', () => {
  test('linking a control through the association dialog surfaces it in the list view', async ({ page }) => {
    test.slow()
    const name = uniquePolicyName()
    const refCode = `E2E-POL-LNK-${RUN_ID}-${Date.now().toString(36)}`
    const policyId = await createInternalPolicy(ownerApi, name)
    await createControl(ownerApi, refCode)

    await page.goto(`/policies/${policyId}/view`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 30_000 })

    // Shared ObjectAssociationSwitch (graph view by default) → AddAssociationPlusBtn
    // opens the SetAssociationDialog "Associate Related Objects".
    await page.getByLabel('Add Association objects').click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Associate Related Objects' })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await dialog.getByText('Select object').click()
    await page.getByRole('option', { name: /^Control$/ }).click()

    await dialog.getByPlaceholder(/.+/).fill(refCode)
    const controlRow = dialog.getByRole('row').filter({ hasText: refCode })
    await expect(controlRow).toBeVisible({ timeout: 15_000 })
    await controlRow.getByRole('checkbox').first().check()

    // Confirm is the shared SaveButton ("Save Changes"); saving closes the
    // dialog once the link mutation succeeds.
    await dialog.getByRole('button', { name: /^Save Changes$/ }).click()
    await expect(dialog).toBeHidden({ timeout: 20_000 })
  })

  test('Procedures tab lists a procedure linked to the policy', async ({ page }) => {
    test.slow()
    const name = uniquePolicyName()
    const procedureName = `E2E PolProc ${RUN_ID} ${Date.now().toString(36)}`
    const policyId = await createInternalPolicy(ownerApi, name)
    const procedureId = await createProcedure(ownerApi, procedureName)
    await linkPolicyProcedure(ownerApi, policyId, procedureId)

    await page.goto(`/policies/${policyId}/view`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 30_000 })

    // view-policy-page.tsx "procedures" tab renders LinkedProcedures, which lists
    // each linked procedure's name under a "Linked Procedures" heading.
    // The detail tabs hydrate after the page heading, so wait for the tab to be
    // actionable (it may carry a count badge) before clicking.
    const proceduresTab = page.getByRole('tab', { name: /^Procedures/ })
    await expect(proceduresTab).toBeVisible({ timeout: 30_000 })
    await proceduresTab.click()
    await expect(page.getByRole('heading', { name: /^Linked Procedures$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(procedureName, { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('Create toolbar — "Procedure" navigates to the procedure create form', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    // CreateItemsFromPolicyToolbar exposes Policy / Procedure / Task. "Procedure"
    // pushes to /procedures/create.
    await page.getByRole('button', { name: /^Create$/ }).click()
    await page.getByRole('button', { name: /^Procedure$/ }).click()

    await page.waitForURL(/\/procedures\/create(\?|$)/, { timeout: 20_000 })
  })
})

test.describe('policies — detail page UI (seeded)', () => {
  test('detail page renders the Policy/Procedures/History tabs and Properties card', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    // view-policy-page.tsx renders an underline Tabs with Policy/Procedures/History.
    await expect(page.getByRole('tab', { name: /^Policy$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^Procedures$/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^History$/ })).toBeVisible()
    // Sidebar <h3>Properties</h3> over the Authority/Properties cards.
    await expect(page.getByRole('heading', { level: 3, name: /^Properties$/ })).toBeVisible({ timeout: 10_000 })
  })

  test('Manage Permissions opens the permission sheet', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('policy-actions-menu').click()
    await page.getByRole('button', { name: /^Manage Permissions$/ }).click()

    // Shared ManagePermissionSheet: SheetTitle "Manage permission" + "Group list" h3.
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(/^Manage permission$/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText(/^Group list$/)).toBeVisible({ timeout: 10_000 })
  })

  test('Create toolbar — "Policy" navigates to the create form', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    // CreateItemsFromPolicyToolbar: a "Create" Menu trigger exposing
    // Policy / Procedure / Task items. "Policy" pushes to /policies/create.
    await page.getByRole('button', { name: /^Create$/ }).click()
    await page.getByRole('button', { name: /^Policy$/ }).click()

    await page.waitForURL(/\/policies\/create(\?|$)/, { timeout: 20_000 })
  })
})
