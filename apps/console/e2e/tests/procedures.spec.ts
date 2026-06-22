import { test, expect } from '../fixtures/auth'
import { test as freshTest, type Locator, type Page } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'

const procedureName = (slug: string) => `E2E Procedure ${slug} ${RUN_ID} ${Date.now().toString(36)}`
const policyName = (slug: string) => `E2E Policy ${slug} ${RUN_ID} ${Date.now().toString(36)}`

const openAssociationDialog = async (page: Page) => {
  await page.getByRole('button', { name: /^add association objects$/i }).click()

  const dialog = page.getByRole('dialog', { name: /^associate related objects$/i })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  return dialog
}

const selectAssociationObjectType = async (page: Page, dialog: Locator, objectType: 'Internal Policy' | 'Procedure') => {
  await dialog.getByRole('combobox').click()
  await page.getByRole('option', { name: objectType, exact: true }).click()
}

const getAssociationRowCheckbox = (dialog: Locator) => dialog.getByRole('checkbox').nth(1)

test.describe('procedures — list + create', () => {
  test('/procedures renders the Procedures heading for an owner', async ({ page }) => {
    await page.goto('/procedures')

    // PageHeading from @repo/ui renders the heading as an <h2>.
    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible()
  })

  test('search by name filters via backend — typing one procedure removes the other from the list', async ({ page }) => {
    const a = procedureName('search-a')
    const b = procedureName('search-b')
    for (const name of [a, b]) {
      await page.goto('/procedures/create')
      await page.getByLabel(/^Title$/).fill(name)
      await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
      await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })
    }

    await page.goto('/procedures')

    await page.getByPlaceholder(/^Search$/).fill(b)

    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(0, { timeout: 15_000 })
  })

  test('happy path — create a procedure and land on the view page', async ({ page }) => {
    await page.goto('/procedures/create')

    const name = procedureName('create')
    await page.getByLabel(/^Title$/).fill(name)

    // Procedures use the SaveButton with a custom title "Save Procedure"
    // (vs policies' default "Save Changes").
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })

    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  })

  test('newly created procedure appears in the procedures table', async ({ page }) => {
    await page.goto('/procedures/create')
    const name = procedureName('listed')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })

    await page.goto('/procedures')
    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('inline title rename: double-click h1 → type → Enter → reload → new title persists', async ({ page }) => {
    await page.goto('/procedures/create')
    const original = procedureName('edit-orig')
    await page.getByLabel(/^Title$/).fill(original)
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })

    const originalH1 = page.getByRole('heading', { level: 1, name: original })
    await expect(originalH1).toBeVisible({ timeout: 15_000 })

    const updated = procedureName('edit-new')
    await expect(async () => {
      const h1 = page.getByRole('heading', { level: 1 }).first()
      await h1.dispatchEvent('dblclick')
      const titleInput = page.getByRole('textbox').first()
      await expect(titleInput).toBeVisible({ timeout: 2_000 })
      await titleInput.fill(updated)
      await titleInput.press('Enter')
      await page.reload()
      await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: click status → select Pending → reload → new status persists', async ({ page }) => {
    await page.goto('/procedures/create')
    const name = procedureName('status')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })

    const statusTrigger = page.getByTestId('procedure-status-trigger')
    await expect(statusTrigger).toContainText(/^Draft$/)

    const statusSelect = page.getByRole('combobox')
    await expect(async () => {
      await statusTrigger.click()
      await expect(statusSelect).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })

    await statusSelect.click()
    await page.getByRole('option', { name: /^Pending$/i }).click()

    await expect(statusTrigger).toContainText(/^Pending$/, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('procedure-status-trigger')).toContainText(/^Pending$/, { timeout: 15_000 })
  })

  test('link procedure to an existing policy via the association dialog and persist it on both sides', async ({ page }) => {
    await page.goto('/policies/create')
    const linkedPolicy = policyName('proc-link')
    await page.getByLabel(/^Title$/).fill(linkedPolicy)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })
    const policyUrl = page.url()

    await page.goto('/procedures/create')
    const linkedProcedure = procedureName('policy-assoc')
    await page.getByLabel(/^Title$/).fill(linkedProcedure)
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })
    const procedureUrl = page.url()

    const procedureDialog = await openAssociationDialog(page)
    await selectAssociationObjectType(page, procedureDialog, 'Internal Policy')

    const policySearch = procedureDialog.getByPlaceholder(/search internal policies/i)
    await policySearch.fill(linkedPolicy)
    await expect(procedureDialog.getByText(linkedPolicy)).toBeVisible({ timeout: 10_000 })

    const policyCheckbox = getAssociationRowCheckbox(procedureDialog)
    await policyCheckbox.click()
    await expect(policyCheckbox).toBeChecked()

    await procedureDialog.getByRole('button', { name: /^save changes$/i }).click()
    await expect(procedureDialog).toBeHidden({ timeout: 10_000 })

    await page.goto(policyUrl)
    await page.getByRole('tab', { name: /^procedures/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: /^linked procedures$/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(linkedProcedure)).toBeVisible({ timeout: 10_000 })

    const policyDialog = await openAssociationDialog(page)
    await selectAssociationObjectType(page, policyDialog, 'Procedure')

    const procedureSearch = policyDialog.getByPlaceholder(/search procedures/i)
    await procedureSearch.fill(linkedProcedure)
    await expect(policyDialog.getByText(linkedProcedure)).toBeVisible({ timeout: 10_000 })
    await expect(getAssociationRowCheckbox(policyDialog)).toBeChecked()
    await policyDialog.getByRole('button', { name: /^cancel$/i }).click()
    await expect(policyDialog).toBeHidden({ timeout: 10_000 })

    await page.goto(procedureUrl)
    const procedureDialogReloaded = await openAssociationDialog(page)
    await selectAssociationObjectType(page, procedureDialogReloaded, 'Internal Policy')
    await procedureDialogReloaded.getByPlaceholder(/search internal policies/i).fill(linkedPolicy)
    await expect(procedureDialogReloaded.getByText(linkedPolicy)).toBeVisible({ timeout: 10_000 })
    await expect(getAssociationRowCheckbox(procedureDialogReloaded)).toBeChecked()
  })
})

const createProcedureViaUi = async (page: Page, name: string): Promise<string> => {
  await page.goto('/procedures/create')
  await page.getByLabel(/^Title$/).fill(name)
  await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
  await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })
  const id = page.url().match(/\/procedures\/([^/]+)\/view/)?.[1]
  if (!id) throw new Error(`could not parse procedure id from ${page.url()}`)
  return id
}

// The edit form's StatusCard renders the Status select inside a grid row labelled
// by a <span>; scope to that row so we never grab another card's combobox.
const statusCardSelect = (page: Page, label: string) =>
  page
    .locator('div.grid')
    .filter({ has: page.getByText(label, { exact: true }) })
    .getByRole('combobox')
    .first()

test.describe('procedures — edit form (/procedures/[id]/edit)', () => {
  test('the edit page loads behind the permission check with the title pre-filled', async ({ page }) => {
    const name = procedureName('edit-page-load')
    const id = await createProcedureViaUi(page, name)

    await page.goto(`/procedures/${id}/edit`, { waitUntil: 'domcontentloaded' })

    // The route renders <PageHeading heading="Edit procedure" /> (an h2) once the
    // owner clears canEdit, then mounts the form with the Title input populated.
    await expect(page.getByRole('heading', { name: /^Edit procedure$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByLabel(/^Title$/)).toHaveValue(name, { timeout: 15_000 })
  })

  test('edit the title from the /edit form and save redirects to /procedures with the new name listed', async ({ page }) => {
    test.slow()
    const original = procedureName('edit-title-orig')
    const id = await createProcedureViaUi(page, original)

    await page.goto(`/procedures/${id}/edit`, { waitUntil: 'domcontentloaded' })
    const titleInput = page.getByLabel(/^Title$/)
    await expect(titleInput).toHaveValue(original, { timeout: 15_000 })

    const updated = procedureName('edit-title-new')
    await titleInput.fill(updated)

    // Edit mode's SaveButton carries the title "Save" (vs "Save Procedure" on
    // create); saving pushes back to /procedures.
    await page.getByRole('button', { name: /^Save$/ }).click()
    await page.waitForURL(/\/procedures(\?|$)/, { timeout: 30_000 })

    await page.getByPlaceholder(/^Search$/).fill(updated)
    await expect(page.getByRole('cell').filter({ hasText: updated }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('change the procedure status from the /edit Status Card', async ({ page }) => {
    const name = procedureName('edit-status')
    const id = await createProcedureViaUi(page, name)

    await page.goto(`/procedures/${id}/edit`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/^Title$/)).toHaveValue(name, { timeout: 15_000 })

    const statusTrigger = statusCardSelect(page, 'Status')
    await expect(statusTrigger).toBeVisible({ timeout: 15_000 })
    await statusTrigger.click()
    await page.getByRole('option', { name: /^Pending$/ }).click()
    await expect(statusTrigger).toContainText(/Pending/, { timeout: 10_000 })
  })

  test('edit procedure details (rich text PlateEditor) from the /edit form and save', async ({ page }) => {
    test.slow()
    const name = procedureName('edit-details')
    const id = await createProcedureViaUi(page, name)

    await page.goto(`/procedures/${id}/edit`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel(/^Title$/)).toHaveValue(name, { timeout: 15_000 })

    const marker = `E2E proc body ${RUN_ID} ${Date.now().toString(36)}`
    const editor = page.locator('[contenteditable="true"]').first()
    await expect(editor).toBeVisible({ timeout: 20_000 })
    await editor.click()
    // Append to the procedure body, then assert the editor holds the typed text.
    await page.keyboard.type(marker)
    await expect(editor).toContainText(marker, { timeout: 10_000 })

    await page.getByRole('button', { name: /^Save$/ }).click()
    await page.waitForURL(/\/procedures(\?|$)/, { timeout: 30_000 })
  })
})

freshTest.describe('procedures — fresh org', () => {
  freshTest('empty state — fresh org has zero procedure rows', async ({ page }) => {
    await seedLoggedInUser(page, 'proc-empty')

    await page.goto('/procedures')

    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: /^E2E Procedure/ })).toHaveCount(0, { timeout: 5_000 })
  })
})
