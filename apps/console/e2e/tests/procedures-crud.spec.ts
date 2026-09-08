import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { createProcedure, createControl, linkProcedureControl, readField, type ApiSession, getOwnerApi } from '../utils/api'
import { bulkEditAndSave, selectFirstMatchingRow } from '../utils/mutations'
import { deleteFirstComment, editFirstComment, postComment } from '../utils/comments'

let ownerApi: ApiSession
let counter = 0
const uniqueProcedureName = () => `E2E ProcCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('procedures — table tooling', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu').getByText(/^Status$/)).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('procedures — detail (seeded)', () => {
  test('delete a procedure from the detail actions menu redirects to the list', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('procedure-actions-menu').click()
    await page.getByTestId('procedure-delete-button').click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.waitForURL(/\/procedures(\?|$)/, { timeout: 20_000 })
  })

  test('selecting a procedure row reveals the Bulk Delete action', async ({ page }) => {
    const name = uniqueProcedureName()
    await createProcedure(ownerApi, name)

    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })

  test('a control linked to a procedure shows in its Associated Objects', async ({ page }) => {
    test.slow()
    const name = uniqueProcedureName()
    const procedureId = await createProcedure(ownerApi, name)
    const controlId = await createControl(ownerApi, `E2E PLnkCtl ${RUN_ID}-${Date.now().toString(36)}`)
    await linkProcedureControl(ownerApi, procedureId, controlId)

    await page.goto(`/procedures/${procedureId}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('assoc-view-toggle').click()
    const removeX = page.getByTestId('objects-chip-remove')
    if ((await removeX.count()) === 0) {
      await page.getByText('Controls', { exact: true }).click()
    }
    await expect(removeX.first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('procedures — link control via dialog', () => {
  test('linking a control through the association dialog surfaces it in the list view', async ({ page }) => {
    test.slow()
    const name = uniqueProcedureName()
    const refCode = `E2E-PROC-LNK-${RUN_ID}-${Date.now().toString(36)}`
    const procedureId = await createProcedure(ownerApi, name)
    await createControl(ownerApi, refCode)

    await page.goto(`/procedures/${procedureId}/view`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
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
})

test.describe('procedures — list bulk actions', () => {
  test('bulk delete a selected procedure from the list with confirmation', async ({ page }) => {
    const name = uniqueProcedureName()
    await createProcedure(ownerApi, name)

    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0, { timeout: 15_000 })
  })

  test('bulk edit opens the Bulk edit dialog with a field selector', async ({ page }) => {
    const name = uniqueProcedureName()
    await createProcedure(ownerApi, name)

    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Edit/ }).click()
    const dialog = page.getByRole('dialog').filter({ hasText: 'Bulk edit' })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Select field...')).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^Add field$/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('procedures — detail metadata', () => {
  test('history/properties sidebar shows the Historical authorship fields', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText(/^Created By$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/^Created At$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('procedures — detail page UI (seeded)', () => {
  test('detail page renders the title and the Properties card', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('heading', { level: 3, name: /^Properties$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('Edit from the actions menu opens inline edit mode with Save/Cancel', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('procedure-actions-menu').click()
    await page.getByRole('button', { name: /^Edit$/ }).click()

    await expect(page.getByRole('button', { name: /^Cancel$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^save changes$/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Manage Permissions opens the permission sheet', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('procedure-actions-menu').click()
    await page.getByRole('button', { name: /^Manage Permissions$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(/^Manage permission$/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText(/^Group list$/)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('procedures — bulk edit applies', () => {
  test('bulk editing a selected procedure persists the new status', async ({ page }) => {
    test.slow()
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await selectFirstMatchingRow(page, name)

    const before = await readField(ownerApi, 'procedure', id, 'status')
    await bulkEditAndSave({ page, field: 'Status', operationName: 'UpdateBulkProcedure' })

    await expect.poll(async () => readField(ownerApi, 'procedure', id, 'status'), { timeout: 60_000 }).not.toBe(before)
  })
})

test.describe('procedures — comments round-trip', () => {
  test('a comment can be posted, edited and deleted from the procedure sheet', async ({ page }) => {
    test.slow()
    const procedureName = uniqueProcedureName()
    const procedureId = await createProcedure(ownerApi, procedureName)
    const controlId = await createControl(ownerApi, `E2E ProcComment ${RUN_ID} ${Date.now().toString(36)}`)
    await linkProcedureControl(ownerApi, procedureId, controlId)
    const body = `E2E procedure comment ${RUN_ID} ${Date.now().toString(36)}`
    const edited = `${body} edited`

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })
    await page.getByText(procedureName).first().click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 })

    await postComment(page, page, 'InsertProcedureComment', body)
    await editFirstComment(page, 'UpdateProcedureComment', edited)
    await deleteFirstComment(page, 'DeleteNote', edited)
  })
})
