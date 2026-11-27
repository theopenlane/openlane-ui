import { test, expect } from '../fixtures/auth'
import { test as freshTest, type Locator, type Page } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'
import { dismissDraftRestore } from '../utils/drafts'

import { uniqueName } from '../utils/unique'
import { expectMutationOk } from '../utils/mutations'

const procedureName = (slug: string) => uniqueName(`E2E Procedure ${slug}`)
const policyName = (slug: string) => uniqueName(`E2E Policy ${slug}`)

const openAssociationDialog = async (page: Page) => {
  await page.getByRole('button', { name: /^add association objects$/i }).click()

  const dialog = page.getByRole('dialog', { name: /^associate related objects$/i })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  return dialog
}

const selectAssociationObjectType = async (dialog: Locator, objectType: 'Internal Policies' | 'Procedures') => {
  await dialog.getByRole('button', { name: new RegExp(`^${objectType}`) }).click()
}

const getAssociationRowCheckbox = (dialog: Locator, name: string) => dialog.getByRole('row').filter({ hasText: name }).getByRole('checkbox')

test.describe('procedures — list + create', () => {
  test('/procedures renders the Procedures heading for an owner', async ({ page }) => {
    await page.goto('/procedures')

    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible()
  })

  test('search by name filters via backend — typing one procedure removes the other from the list', async ({ page }) => {
    const a = procedureName('search-a')
    const b = procedureName('search-b')
    for (const name of [a, b]) {
      await page.goto('/procedures/create')
      await dismissDraftRestore(page)
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
    await dismissDraftRestore(page)

    const name = procedureName('create')
    await page.getByLabel(/^Title$/).fill(name)

    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })

    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  })

  test('newly created procedure appears in the procedures table', async ({ page }) => {
    await page.goto('/procedures/create')
    await dismissDraftRestore(page)
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
    await dismissDraftRestore(page)
    const original = procedureName('edit-orig')
    await page.getByLabel(/^Title$/).fill(original)
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })

    const originalH1 = page.getByRole('heading', { level: 1, name: original })
    await expect(originalH1).toBeVisible({ timeout: 15_000 })

    const updated = procedureName('edit-new')
    const titleInput = page.getByRole('textbox').first()
    await expect(async () => {
      await page.getByRole('heading', { level: 1 }).first().dispatchEvent('dblclick')
      await expect(titleInput).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 30_000 })
    await titleInput.fill(updated)
    await expectMutationOk(page, 'UpdateProcedure', async () => {
      await titleInput.press('Enter')
    })
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 30_000 })

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: click status → select Pending → reload → new status persists', async ({ page }) => {
    await page.goto('/procedures/create')
    await dismissDraftRestore(page)
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
    await page.getByRole('button', { name: /^save( changes)?$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })
    const policyUrl = page.url()

    await page.goto('/procedures/create')
    await dismissDraftRestore(page)
    const linkedProcedure = procedureName('policy-assoc')
    await page.getByLabel(/^Title$/).fill(linkedProcedure)
    await page.getByRole('button', { name: /^save procedure$/i }).click({ timeout: 30_000 })
    await page.waitForURL(/\/procedures\/[^/]+\/view/, { timeout: 30_000 })
    const procedureUrl = page.url()

    const procedureDialog = await openAssociationDialog(page)
    await selectAssociationObjectType(procedureDialog, 'Internal Policies')

    const policySearch = procedureDialog.getByPlaceholder(/^Search by/)
    await policySearch.fill(linkedPolicy)
    await expect(procedureDialog.getByText(linkedPolicy)).toBeVisible({ timeout: 10_000 })

    const policyCheckbox = getAssociationRowCheckbox(procedureDialog, linkedPolicy)
    await policyCheckbox.click()
    await expect(policyCheckbox).toBeChecked()

    await procedureDialog.getByRole('button', { name: /^save( changes)?$/i }).click()
    await expect(procedureDialog).toBeHidden({ timeout: 10_000 })

    await page.goto(policyUrl)
    await page.getByRole('tab', { name: /^procedures/i }).click()
    await expect(page.getByRole('heading', { level: 2, name: /^linked procedures$/i })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(linkedProcedure)).toBeVisible({ timeout: 10_000 })

    const policyDialog = await openAssociationDialog(page)
    await selectAssociationObjectType(policyDialog, 'Procedures')

    const procedureSearch = policyDialog.getByPlaceholder(/^Search by/)
    await procedureSearch.fill(linkedProcedure)
    await expect(policyDialog.getByText(linkedProcedure)).toBeVisible({ timeout: 10_000 })
    await expect(getAssociationRowCheckbox(policyDialog, linkedProcedure)).toBeChecked()
    await policyDialog.getByRole('button', { name: /^cancel$/i }).click()
    await expect(policyDialog).toBeHidden({ timeout: 10_000 })

    await page.goto(procedureUrl)
    const procedureDialogReloaded = await openAssociationDialog(page)
    await selectAssociationObjectType(procedureDialogReloaded, 'Internal Policies')
    await procedureDialogReloaded.getByPlaceholder(/^Search by/).fill(linkedPolicy)
    await expect(procedureDialogReloaded.getByText(linkedPolicy)).toBeVisible({ timeout: 10_000 })
    await expect(getAssociationRowCheckbox(procedureDialogReloaded, linkedPolicy)).toBeChecked()
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
