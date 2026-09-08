import { type Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { createProgram, createControl, gql, type ApiSession, getOwnerApi } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

let ownerApi: ApiSession
const uniqueProgramName = () => uniqueName('E2E ProgCRUD')

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('programs — list', () => {
  test('the programs dashboard exposes search and Active/Archived tabs', async ({ page }) => {
    test.slow()
    await createProgram(ownerApi, uniqueProgramName()) // ensure the list view (not the empty state) renders
    await page.goto('/programs', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByPlaceholder('Search').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('tab', { name: /Active/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /Archived/ })).toBeVisible()
  })

  test('switching to the Archived tab updates the active selection', async ({ page }) => {
    test.slow()
    await createProgram(ownerApi, uniqueProgramName())
    await page.goto('/programs', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const active = page.getByRole('tab', { name: /Active/ })
    const archived = page.getByRole('tab', { name: /Archived/ })
    await expect(archived).toBeVisible({ timeout: 20_000 })

    await archived.click()
    await expect(archived).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
    await expect(active).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('programs — detail (seeded)', () => {
  test('a seeded program detail page renders the program name', async ({ page }) => {
    const name = uniqueProgramName()
    const id = await createProgram(ownerApi, name)

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the detail page renders the Basic information / Auditor / Timeline cards', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Basic information' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Auditor of this program' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Timeline & Readiness' })).toBeVisible()
  })

  test('editing Basic information reveals Save + Cancel', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const basicInfo = page.getByRole('heading', { name: 'Basic information' })
    await expect(basicInfo).toBeVisible({ timeout: 30_000 })

    await page
      .getByRole('button', { name: /^Edit$/ })
      .first()
      .click()
    await expect(page.getByRole('button', { name: /^Save Changes$/ }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Cancel$/ }).first()).toBeVisible()
  })
})

test.describe('programs — framework wizard', () => {
  test('framework-based wizard shows the stepper scaffold', async ({ page }) => {
    test.slow() // heavy wizard route → cold dev compile; no compile step in CI
    await page.goto('/programs/create/framework-based', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible()
    await expect(page.getByRole('button', { name: /^continue$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible()
  })

  test('the framework picker opens with searchable options', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/framework-based', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 20_000 })

    await page.getByText('Select a framework', { exact: true }).click()
    await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('programs — settings + delete (seeded)', () => {
  test('settings page renders members, import controls, and the danger zone', async ({ page }) => {
    test.slow() // heavy settings route → cold dev compile
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Import Controls').first()).toBeVisible()
    await expect(page.getByText('Danger Zone')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Archive$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible()
  })

  test('deleting a program from the danger zone requires the typed DELETE confirm', async ({ page }) => {
    test.slow() // heavy settings route → cold dev compile
    const name = uniqueProgramName()
    const id = await createProgram(ownerApi, name)

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Delete$/ }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const confirm = dialog.getByRole('button', { name: /^Delete$/ })
    await expect(confirm).toBeDisabled()

    await dialog.getByRole('textbox').fill('DELETE')
    await expect(confirm).toBeEnabled()
    await confirm.click()

    await expect(page.getByText(/successfully deleted/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('archiving a program then unarchiving it round-trips the danger-zone state', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('button', { name: /^Archive$/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Archive$/ })
      .click()
    await expect(page.getByText(/successfully archived/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Unarchive$/ })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Unarchive$/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Unarchive$/ })
      .click()
    await expect(page.getByRole('button', { name: /^Archive$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('Assign opens the Assign User dialog on the settings page', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page
      .getByRole('button', { name: /^Assign$/ })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: 'Assign User' })).toBeVisible({ timeout: 10_000 })
  })

  test('the second Assign opens the Assign Group dialog on the settings page', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page
      .getByRole('button', { name: /^Assign$/ })
      .last()
      .click()
    await expect(page.getByRole('heading', { name: 'Assign Group' })).toBeVisible({ timeout: 10_000 })
  })

  test('Import opens the Import Controls dialog on the settings page', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('button', { name: /^Import$/ }).click()
    await expect(page.getByRole('dialog').getByText('Import controls from')).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('programs — detail editing (seeded)', () => {
  test('assigning an auditor saves the firm on the detail page', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Auditor of this program' })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Set auditor$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Set auditor' })).toBeVisible({ timeout: 10_000 })

    const firm = `E2E Audit Firm ${RUN_ID}`
    await dialog.getByPlaceholder('SecureSphere Compliance').fill(firm)
    await dialog.getByPlaceholder('Amy Shields').fill('Amy Shields')
    await dialog.getByPlaceholder('amy.shields@securesphere.io').fill('amy.shields@securesphere.io')
    await dialog.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(firm).first()).toBeVisible({ timeout: 15_000 })
  })

  test('marking the program ready for the auditor completes the confirmation flow', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Auditor of this program' })).toBeVisible({ timeout: 30_000 })

    const dialog = page.getByRole('dialog')
    await page.getByRole('button', { name: /^Set auditor$/ }).click()
    await dialog.getByPlaceholder('SecureSphere Compliance').fill(`E2E Firm ${RUN_ID}`)
    await dialog.getByPlaceholder('amy.shields@securesphere.io').fill('amy.shields@securesphere.io')
    await dialog.getByRole('button', { name: /^Save Changes$/ }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Ready for Auditor$/ }).click()
    const setReady = page.getByRole('button', { name: /^Set ready$/ })
    await expect(setReady).toBeVisible({ timeout: 10_000 })
    await setReady.click()
    await expect(setReady).toBeHidden({ timeout: 15_000 })
  })

  test('the Timeline & Readiness card opens an editable form with Save/Cancel', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Timeline & Readiness' })).toBeVisible({ timeout: 30_000 })

    await page
      .getByRole('button', { name: /^Edit$/ })
      .last()
      .click()
    await expect(page.getByRole('button', { name: /^Save Changes$/ }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Cancel$/ }).first()).toBeVisible()
  })
})

test.describe('programs — timeline & readiness (seeded)', () => {
  const openTimelineEdit = async (page: Page, id: string) => {
    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Timeline & Readiness' })).toBeVisible({ timeout: 30_000 })
    await page
      .getByRole('button', { name: /^Edit$/ })
      .last()
      .click()
    await expect(page.getByRole('button', { name: /^Save Changes$/ }).first()).toBeVisible({ timeout: 10_000 })
  }

  test('a fresh program renders the read-only timeline with a Not Started status', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const card = page.getByRole('heading', { name: 'Timeline & Readiness' }).locator('xpath=ancestor::*[1]')
    await expect(card).toBeVisible({ timeout: 30_000 })

    await expect(page.getByText('Status:', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Not Started').first()).toBeVisible()
  })

  test('editing the timeline status to In Progress persists the new status', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())
    await openTimelineEdit(page, id)

    await page.getByRole('combobox').filter({ hasText: 'Not Started' }).click()
    await page.getByRole('option', { name: 'In Progress' }).click()

    await page
      .getByRole('button', { name: /^Save Changes$/ })
      .first()
      .click()

    await expect(page.getByText(/Program updated/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('In Progress').first()).toBeVisible({ timeout: 15_000 })
  })

  test('Cancel discards an in-progress timeline edit', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())
    await openTimelineEdit(page, id)

    await page.getByRole('combobox').filter({ hasText: 'Not Started' }).click()
    await page.getByRole('option', { name: 'In Progress' }).click()

    await page
      .getByRole('button', { name: /^Cancel$/ })
      .first()
      .click()

    await expect(page.getByRole('button', { name: /^Save Changes$/ })).toBeHidden({ timeout: 10_000 })
    await expect(page.getByText('Not Started').first()).toBeVisible({ timeout: 10_000 })
  })

  test('a past End Date surfaces the "must be in the future" validation on the timeline form', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())
    await openTimelineEdit(page, id)

    await page
      .getByRole('button', { name: /select a date/i })
      .nth(1)
      .click()
    await page.getByRole('button', { name: /go to the previous month/i }).click()
    await page
      .getByRole('button', { name: new RegExp('(^|\\s)15(th|st|nd|rd)?(,|$|\\s)', 'i') })
      .first()
      .click()

    await page
      .getByRole('button', { name: /^Save Changes$/ })
      .first()
      .click()
    await expect(page.getByRole('main').getByText('End date must be in the future').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('programs — settings assignment (seeded)', () => {
  const assignViaDialog = async (page: Page, heading: 'Assign User' | 'Assign Group') => {
    const trigger = heading === 'Assign User' ? page.getByRole('button', { name: /^Assign$/ }).first() : page.getByRole('button', { name: /^Assign$/ }).last()
    await trigger.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: heading })).toBeVisible({ timeout: 10_000 })
    // checkbox[0] is the (disabled) header select-all; checkbox[1] is the first selectable row
    await dialog.getByRole('checkbox').nth(1).check()
    await dialog.getByRole('button', { name: /^Assign/ }).click()
  }

  test('assigning a user to the program shows the success confirmation', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignViaDialog(page, 'Assign User')
    await expect(page.getByText(/successfully assigned to the program/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('assigning a group to the program shows the success confirmation', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignViaDialog(page, 'Assign Group')
    await expect(page.getByText(/successfully assigned to the program/i).first()).toBeVisible({ timeout: 15_000 })
  })

  const assignUserByName = async (page: Page, search: string) => {
    await page
      .getByRole('button', { name: /^Assign$/ })
      .first()
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Assign User' })).toBeVisible({ timeout: 10_000 })
    await dialog.getByPlaceholder(/Search users/).fill(search)

    const targetRow = dialog.getByRole('row', { name: new RegExp(search) })
    await expect(targetRow).toBeVisible({ timeout: 10_000 })
    await targetRow.getByRole('checkbox').check()
    await dialog.getByRole('button', { name: /^Assign/ }).click()
    await expect(page.getByText(/successfully assigned to the program/i).first()).toBeVisible({ timeout: 15_000 })
  }

  test('changing an assigned user role shows the role-updated confirmation', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignUserByName(page, 'e2e-admin')

    const row = page.getByRole('row', { name: /e2e-admin/ })
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: 'Edit role' }).click()

    const editDialog = page.getByRole('dialog')
    await expect(editDialog.getByRole('heading', { name: 'Edit role' })).toBeVisible({ timeout: 10_000 })
    await editDialog.getByRole('combobox').click()
    await page.getByRole('option', { name: 'Editor' }).click()
    await editDialog.getByRole('button', { name: /^Edit role$/ }).click()

    await expect(page.getByText(/role updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('removing an assigned user confirms and clears them from the program', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignUserByName(page, 'e2e-member')

    const row = page.getByRole('row', { name: /e2e-member/ })
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: 'Remove user' }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText(/Remove User/i)).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Remove$/ }).click()

    await expect(page.getByText(/removed from program/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('programs — settings groups + import (seeded)', () => {
  const assignGroupViaDialog = async (page: Page) => {
    await page
      .getByRole('button', { name: /^Assign$/ })
      .last()
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Assign Group' })).toBeVisible({ timeout: 10_000 })
    // checkbox[0] is the (disabled) header select-all; checkbox[1] is the first selectable row
    await dialog.getByRole('checkbox').nth(1).check()
    await dialog.getByRole('button', { name: /^Assign/ }).click()
    await expect(page.getByText(/successfully assigned to the program/i).first()).toBeVisible({ timeout: 15_000 })
  }

  const assignedGroupRow = (page: Page) => page.getByRole('row', { name: /\d+ members/ }).first()

  test('editing an assigned group role shows the role-updated confirmation', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignGroupViaDialog(page)

    const row = assignedGroupRow(page)
    await expect(row).toBeVisible({ timeout: 15_000 })

    const currentRole = (await row.textContent())?.includes('Editor') ? 'Editor' : 'Viewer'
    const nextRole = currentRole === 'Editor' ? 'Viewer' : 'Editor'

    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: 'Edit role' }).click()

    const editDialog = page.getByRole('dialog')
    await expect(editDialog.getByRole('heading', { name: 'Edit role' })).toBeVisible({ timeout: 10_000 })

    await editDialog.getByRole('combobox').click()
    await page.getByRole('option', { name: nextRole }).click()
    await editDialog.getByRole('button', { name: /^Edit role$/ }).click()

    await expect(page.getByText(/role updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('removing an assigned group confirms and clears it from the program', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignGroupViaDialog(page)

    const row = assignedGroupRow(page)
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: 'Remove group' }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText(/Remove Group/i)).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Remove$/ }).click()

    await expect(page.getByText(/removed from the program/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('Import controls dialog switches the source to Program and reveals the program picker', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Import$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Import controls from')).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Program' }).click()

    const picker = dialog.getByRole('button', { name: /Select program/ })
    await expect(picker).toBeVisible({ timeout: 10_000 })
    await picker.click()
    await expect(dialog.getByRole('checkbox').first()).toBeVisible({ timeout: 10_000 })
  })

  const linkControlProgram = async (controlId: string, programId: string): Promise<void> => {
    const res = await gql<{ updateControl: { control: { id: string } } }>(ownerApi, `mutation($id: ID!, $input: UpdateControlInput!){ updateControl(id: $id, input: $input){ control { id } } }`, {
      id: controlId,
      input: { addProgramIDs: [programId] },
    })
    if (!res.data?.updateControl?.control?.id) throw new Error(`linkControlProgram failed: ${JSON.stringify(res.errors)}`)
  }

  test('importing a control from another program clones it and confirms with a success toast', async ({ page }) => {
    test.slow()
    const sourceName = uniqueProgramName()
    const sourceId = await createProgram(ownerApi, sourceName)
    const controlId = await createControl(ownerApi, uniqueRef('E2E-IMP'))
    await linkControlProgram(controlId, sourceId)

    const destId = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${destId}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Import$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Import controls from')).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Program' }).click()
    await dialog.getByRole('button', { name: /Select program/ }).click()
    await dialog.getByRole('checkbox', { name: new RegExp(sourceName) }).check()

    const controlRow = dialog.getByRole('row', { name: new RegExp(`E2E-IMP-${RUN_ID}`) })
    await expect(controlRow.first()).toBeVisible({ timeout: 15_000 })
    await controlRow.first().getByRole('checkbox').check()

    await dialog.getByRole('button', { name: /^Import \(\d+\)$/ }).click()
    await expect(page.getByText(/Controls Imported|successfully imported/i).first()).toBeVisible({ timeout: 20_000 })
  })
})
