import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createProcedure, createControl, linkProcedureControl, type ApiSession } from '../utils/api'

/**
 * Deep procedures flows beyond procedures.spec.ts (create/search/inline edit/
 * link-to-policy on fresh users). Procedures are a near-clone of policies, so
 * these mirror policies-crud.spec.ts. Runs as the storage-state Owner; entities
 * seeded via the Owner API with run-unique names.
 *
 * ⏳ Written without running (servers were off). Verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueProcedureName = () => `E2E ProcCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
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

    // Shared TableFilter (useProceduresFilters) — mirrors policies-crud.
    await page.getByRole('button', { name: /^Filter$/ }).click()
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

    // procedures-table-toolbar.tsx shows "Bulk Delete (n)" once a row is selected.
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

    // Same association UI as controls: toggle to list (assoc-view-toggle), expand
    // the "Controls" section, and assert the linked control mounts as a chip.
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

    // ObjectAssociationSwitch defaults to graph view; the AddAssociationPlusBtn
    // (aria-label "Add Association objects") opens the SetAssociationDialog.
    await page.getByLabel('Add Association objects').click()

    const dialog = page.getByRole('dialog').filter({ hasText: 'Associate Related Objects' })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    // Pick Control as the object type (ObjectTypeObjects.CONTROL = 'Control').
    await dialog.getByText('Select object').click()
    await page.getByRole('option', { name: /^Control$/ }).click()

    // Search the seeded control and check its row in the association table.
    await dialog.getByPlaceholder(/.+/).fill(refCode)
    const controlRow = dialog.getByRole('row').filter({ hasText: refCode })
    await expect(controlRow).toBeVisible({ timeout: 15_000 })
    await controlRow.getByRole('checkbox').first().check()

    // The association dialog's confirm is a shared SaveButton ("Save Changes"),
    // enabled once a row is checked; saving closes the dialog (link persisted).
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

    // procedures-table-toolbar shows "Bulk Delete (n)" → opens a ConfirmationDialog
    // ("Delete selected procedures?") with a destructive "Delete" confirm button.
    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    // The row drops out of the list once the bulk delete lands.
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

    // BulkEditProceduresDialog trigger is "Bulk Edit (n)"; the dialog has a
    // "Bulk edit" title, a "Select field..." Select, and an "Add field" button.
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

    // HistoricalCard (historical-card.tsx) renders Created By / Created At rows.
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

    // view-procedure-page.tsx sidebar renders an <h3>Properties</h3> over the
    // Authority/Properties/Tags cards.
    await expect(page.getByRole('heading', { level: 3, name: /^Properties$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('Edit from the actions menu opens inline edit mode with Save/Cancel', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('procedure-actions-menu').click()
    // The menu Edit button flips the page into edit mode (setIsEditing) which
    // swaps the actions menu for Cancel + Save Procedure buttons.
    await page.getByRole('button', { name: /^Edit$/ }).click()

    await expect(page.getByRole('button', { name: /^Cancel$/ })).toBeVisible({ timeout: 10_000 })
    // Edit mode renders the shared SaveButton with its default "Save Changes"
    // title (the "Save Procedure" title is only used on the create form).
    await expect(page.getByRole('button', { name: /^save changes$/i })).toBeVisible({ timeout: 10_000 })
  })

  test('Manage Permissions opens the permission sheet', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('procedure-actions-menu').click()
    await page.getByRole('button', { name: /^Manage Permissions$/ }).click()

    // ManagePermissionSheet renders SheetTitle "Manage permission" + a
    // "Group list" <h3> (manage-permissions-sheet.tsx).
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(/^Manage permission$/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText(/^Group list$/)).toBeVisible({ timeout: 10_000 })
  })
})
