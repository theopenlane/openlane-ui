import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { createInternalPolicy, createControl, createProcedure, linkControlPolicy, gql, readField, type ApiSession, getOwnerApi } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { bulkEditAndSave, confirmDestructive, selectFirstMatchingRow } from '../utils/mutations'
import { deleteFirstComment, editFirstComment, postComment } from '../utils/comments'

let ownerApi: ApiSession
const uniquePolicyName = () => uniqueName('E2E PolCRUD')

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const openExportPdfDialog = async (page: Page): Promise<void> => {
  const dialog = page.getByRole('dialog')

  await expect
    .poll(
      async () => {
        if (await dialog.isVisible().catch(() => false)) return true
        await page
          .getByRole('button', { name: 'Action' })
          .first()
          .click()
          .catch(() => {})
        await page
          .getByText('Export to PDF', { exact: true })
          .click({ timeout: 5_000 })
          .catch(() => {})
        return dialog.isVisible().catch(() => false)
      },
      { timeout: 30_000 },
    )
    .toBe(true)
}

const openTableView = async (page: Page) => {
  await page.goto('/policies', { waitUntil: 'domcontentloaded' })
  await page.locator('.lucide-table').first().click()
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 30_000 })
}

test.describe('policies — table tooling', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await openTableView(page)

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu').getByText(/^Status$/)).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await openTableView(page)

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('selecting rows reveals the Bulk Delete + Bulk Edit actions', async ({ page }) => {
    const name = uniquePolicyName()
    await createInternalPolicy(ownerApi, name)
    await openTableView(page)

    // The shared org has many policies + pagination, so search to surface the seeded row
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })

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

    await page.getByTestId('policy-actions-menu').click()
    await page.getByTestId('policy-delete-button').click()
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

    await page.getByLabel('Add Association objects').click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Associate Related Objects' })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await dialog.getByText('Select object').click()
    await page.getByRole('option', { name: /^Control$/ }).click()

    await dialog.getByPlaceholder(/.+/).fill(refCode)
    const controlRow = dialog.getByRole('row').filter({ hasText: refCode })
    await expect(controlRow).toBeVisible({ timeout: 15_000 })
    await controlRow.getByRole('checkbox').first().check()

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

    await expect(page.getByRole('tab', { name: /^Policy$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^Procedures$/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^History$/ })).toBeVisible()
    await expect(page.getByRole('heading', { level: 3, name: /^Properties$/ })).toBeVisible({ timeout: 10_000 })
  })

  test('Manage Permissions opens the permission sheet', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('policy-actions-menu').click()
    await page.getByRole('button', { name: /^Manage Permissions$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(/^Manage permission$/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText(/^Group list$/)).toBeVisible({ timeout: 10_000 })
  })

  test('Create toolbar — "Policy" navigates to the create form', async ({ page }) => {
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await page.goto(`/policies/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    await page.getByRole('button', { name: /^Policy$/ }).click()

    await page.waitForURL(/\/policies\/create(\?|$)/, { timeout: 20_000 })
  })
})

test.describe('policies — view slideout (ISS-2382)', () => {
  test('the slideout Details section renders the editor branch for a plain policy', async ({ page }) => {
    test.slow()
    const policyName = uniquePolicyName()
    const policyId = await createInternalPolicy(ownerApi, policyName)
    const controlId = await createControl(ownerApi, `E2E PolSheet ${RUN_ID} ${Date.now().toString(36)}`)
    await linkControlPolicy(ownerApi, controlId, policyId)

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    await page.getByText(policyName).first().click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(policyName).first()).toBeVisible({ timeout: 15_000 })

    await expect(sheet.getByRole('button', { name: /^Details$/ })).toBeVisible({ timeout: 10_000 })

    await expect(sheet.locator('[contenteditable]').first()).toBeVisible({ timeout: 20_000 })
    await expect(sheet.getByText('Word document managed outside Openlane.')).toHaveCount(0)
  })

  test('the slideout Details section exposes its collapse toggle', async ({ page }) => {
    test.slow()
    const policyName = uniquePolicyName()
    const policyId = await createInternalPolicy(ownerApi, policyName)
    const controlId = await createControl(ownerApi, `E2E PolSheet2 ${RUN_ID} ${Date.now().toString(36)}`)
    await linkControlPolicy(ownerApi, controlId, policyId)

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })
    await page.getByText(policyName).first().click()

    const sheet = page.getByRole('dialog')
    const details = sheet.getByRole('button', { name: /^Details$/ })
    await expect(details).toBeVisible({ timeout: 15_000 })

    await expect(sheet.locator('[contenteditable]').first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('policies — PDF export metadata option (ISS-2563)', () => {
  test.beforeAll(async () => {
    await createInternalPolicy(ownerApi, uniquePolicyName())
  })

  test('Export to PDF opens the dialog with the exclude-metadata option', async ({ page }) => {
    test.slow()
    await openTableView(page)

    await openExportPdfDialog(page)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Export to PDF', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Exclude metadata', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/Leave out the document metadata section/)).toBeVisible()
  })

  test('the exclude-metadata checkbox toggles, and Cancel closes without exporting', async ({ page }) => {
    test.slow()
    await openTableView(page)

    await openExportPdfDialog(page)

    const dialog = page.getByRole('dialog')
    const excludeMetadata = dialog.getByRole('checkbox')
    await expect(excludeMetadata).toBeVisible({ timeout: 15_000 })

    await expect(excludeMetadata).not.toBeChecked()
    await excludeMetadata.click()
    await expect(excludeMetadata).toBeChecked()

    await dialog.getByRole('button', { name: /^Cancel$/ }).click()
    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })
})

test.describe('policies — collapsible linked procedures (#2048)', () => {
  test('a linked procedure renders as a collapsed accordion that expands', async ({ page }) => {
    test.slow()
    const policyName = uniquePolicyName()
    const policyId = await createInternalPolicy(ownerApi, policyName)
    const procedureName = `E2E LinkedProc ${RUN_ID} ${Date.now().toString(36)}`
    const procedureId = await createProcedure(ownerApi, procedureName)

    await gql(ownerApi, `mutation($id: ID!, $input: UpdateInternalPolicyInput!){ updateInternalPolicy(id: $id, input: $input){ internalPolicy { id } } }`, {
      id: policyId,
      input: { addProcedureIDs: [procedureId] },
    })

    await page.goto(`/policies/${policyId}/view`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const proceduresTab = page.getByRole('tab', { name: /^Procedures/ })
    await expect(proceduresTab).toBeVisible({ timeout: 45_000 })
    await proceduresTab.click()

    await expect(page.getByText(procedureName).first()).toBeVisible({ timeout: 20_000 })

    await page.getByText(procedureName).first().click()
    await expect(page.getByText('Type', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('policies — bulk actions apply', () => {
  test('bulk editing a selected policy persists the new status', async ({ page }) => {
    test.slow()
    const name = uniquePolicyName()
    const id = await createInternalPolicy(ownerApi, name)

    await openTableView(page)
    await selectFirstMatchingRow(page, name)

    const before = await readField(ownerApi, 'internalPolicy', id, 'status')
    await bulkEditAndSave({ page, field: 'Status', operationName: 'UpdateBulkInternalPolicy' })

    await expect.poll(async () => readField(ownerApi, 'internalPolicy', id, 'status'), { timeout: 60_000 }).not.toBe(before)
  })

  test('bulk deleting a selected policy removes it from the list', async ({ page }) => {
    test.slow()
    const name = uniquePolicyName()
    await createInternalPolicy(ownerApi, name)

    await openTableView(page)
    await selectFirstMatchingRow(page, name)

    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    await confirmDestructive(page, 'DeleteBulkInternalPolicy')

    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0, { timeout: 60_000 })
  })
})

test.describe('policies — comments round-trip', () => {
  test('a comment can be posted, edited and deleted from the policy sheet', async ({ page }) => {
    test.slow()
    const policyName = uniquePolicyName()
    const policyId = await createInternalPolicy(ownerApi, policyName)
    const controlId = await createControl(ownerApi, `E2E PolComment ${RUN_ID} ${Date.now().toString(36)}`)
    await linkControlPolicy(ownerApi, controlId, policyId)
    const body = `E2E policy comment ${RUN_ID} ${Date.now().toString(36)}`
    const edited = `${body} edited`

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })
    await page.getByText(policyName).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 })

    await postComment(page, page, 'InsertInternalPolicyComment', body)
    await editFirstComment(page, 'UpdatePolicyComment', edited)
    await deleteFirstComment(page, 'DeleteNote', edited)
  })
})
