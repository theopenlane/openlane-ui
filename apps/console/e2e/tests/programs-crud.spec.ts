import { type Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createProgram, createControl, gql, type ApiSession } from '../utils/api'

/**
 * Deep program flows beyond programs.spec.ts (wizard/template picker/create on
 * fresh users). Runs as the storage-state Owner; programs seeded via the Owner
 * API. Covers the framework-wizard stepper scaffold, the settings page
 * (members / import controls / danger zone), and the typed-confirm delete flow.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueProgramName = () => `E2E ProgCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('programs — list', () => {
  test('the programs dashboard exposes search and Active/Archived tabs', async ({ page }) => {
    test.slow()
    await createProgram(ownerApi, uniqueProgramName()) // ensure the list view (not the empty state) renders
    await page.goto('/programs', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // programs-dashboard-page.tsx: a "Search" box + Active / Archived tabs.
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
    // Detail page renders the "Overview" <h1> and the program name. (A sibling
    // page-heading also contains "Overview", so pin the exact <h1>.)
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the detail page renders the Basic information / Auditor / Timeline cards', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    // basic-info.tsx / program-auditor.tsx / timeline-readiness.tsx section headings.
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

    // Each card has its own "Edit" (Pencil) → SaveButton + CancelButton. Basic
    // information renders first, so target the first Edit affordance.
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

    // framework-based-wizard.tsx defines the steps via @stepperize; StepHeader
    // renders dot indicators + a "Step X of Y" counter (some steps are hidden,
    // so Y varies). Step 0's content heading is "Select a Framework".
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible()
    await expect(page.getByRole('button', { name: /^continue$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible()
  })

  test('the framework picker opens with searchable options', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/framework-based', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 20_000 })

    // standard-select.tsx → SearchableSingleSelect: clicking the "Select a
    // framework" trigger opens a Command list (Search input + framework options).
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
    // Active (non-archived) program → Archive + Delete affordances.
    await expect(page.getByRole('button', { name: /^Archive$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible()
  })

  test('deleting a program from the danger zone requires the typed DELETE confirm', async ({ page }) => {
    test.slow() // heavy settings route → cold dev compile
    const name = uniqueProgramName()
    const id = await createProgram(ownerApi, name)

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Delete$/ }).click()

    // ConfirmationDialog (showInput) gates confirm on typing DELETE; the
    // confirm button stays disabled until the text matches.
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const confirm = dialog.getByRole('button', { name: /^Delete$/ })
    await expect(confirm).toBeDisabled()

    await dialog.getByRole('textbox').fill('DELETE')
    await expect(confirm).toBeEnabled()
    await confirm.click()

    // Success toast, then the program is gone.
    await expect(page.getByText(/successfully deleted/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('archiving a program then unarchiving it round-trips the danger-zone state', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // Archive (no typed gate) → success toast → the zone now offers Unarchive.
    await page.getByRole('button', { name: /^Archive$/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Archive$/ })
      .click()
    await expect(page.getByText(/successfully archived/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Unarchive$/ })).toBeVisible({ timeout: 15_000 })

    // Restore — asserting the Archive affordance returns (robust to toast copy).
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

    // program-settings-assign-user-dialog.tsx default trigger "Assign" → dialog
    // with an "Assign User" heading.
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

    // The settings page has two "Assign" buttons (users + groups); the groups
    // one (program-settings-assign-groups-dialog.tsx) opens an "Assign Group" heading.
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

    // program-settings-import-controls-dialog.tsx trigger "Import" → dialog with
    // an "Import controls from" framework/program selector.
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

    // On a fresh program the Auditor card shows "Set auditor" (no Edit), so the
    // Timeline card's Edit is the last "Edit" affordance on the page.
    await page
      .getByRole('button', { name: /^Edit$/ })
      .last()
      .click()
    await expect(page.getByRole('button', { name: /^Save Changes$/ }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Cancel$/ }).first()).toBeVisible()
  })
})

test.describe('programs — timeline & readiness (seeded)', () => {
  // timeline-readiness.tsx: read-only Status/Start Date/End Date until the
  // card's Edit (Pencil) is clicked. A freshly seeded program has no dates and
  // status NOT_STARTED → it renders "Not Started" with a "-". On a fresh
  // program the Auditor card shows "Set auditor" (no Edit), so the Timeline
  // card's Edit is the last "Edit" affordance on the page.
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

    // StatusSelect is a Radix Select (role=combobox); ProgramStatusOptions
    // surface the labels via getEnumLabel (e.g. IN_PROGRESS → "In Progress").
    // The Timeline DataTable also renders a rows-per-page combobox, so anchor
    // on the status one by its current value ("Not Started").
    await page.getByRole('combobox').filter({ hasText: 'Not Started' }).click()
    await page.getByRole('option', { name: 'In Progress' }).click()

    await page
      .getByRole('button', { name: /^Save Changes$/ })
      .first()
      .click()

    // onSubmit fires a "Program updated" success toast, then the card returns
    // to the read-only view showing the saved status.
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

    // handleCancel resets the form and exits edit mode → the Edit affordance
    // returns and the status falls back to the unsaved default.
    await expect(page.getByRole('button', { name: /^Save Changes$/ })).toBeHidden({ timeout: 10_000 })
    await expect(page.getByText('Not Started').first()).toBeVisible({ timeout: 10_000 })
  })

  test('a past End Date surfaces the "must be in the future" validation on the timeline form', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())
    await openTimelineEdit(page, id)

    // Both Start + End CalendarPopovers render in edit mode (each shows
    // "Select a date:" when empty). Open the End Date trigger (the second
    // popover), step back a month, and pick a day → guaranteed past date.
    await page
      .getByRole('button', { name: /select a date/i })
      .nth(1)
      .click()
    await page.getByRole('button', { name: /go to the previous month/i }).click()
    await page
      .getByRole('button', { name: new RegExp('(^|\\s)15(th|st|nd|rd)?(,|$|\\s)', 'i') })
      .first()
      .click()

    // zodResolver runs on submit, so attempt a save to surface the refine. The
    // message renders inline (<span> in main) and the form stays in edit mode.
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
    // checkbox[0] is the (disabled) header select-all; checkbox[1] is the first
    // selectable row.
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
    // checkbox[0] is the (disabled) header select-all; checkbox[1] is the first
    // selectable row.
    await dialog.getByRole('checkbox').nth(1).check()
    await dialog.getByRole('button', { name: /^Assign/ }).click()
    await expect(page.getByText(/successfully assigned to the program/i).first()).toBeVisible({ timeout: 15_000 })
  }

  // The "Assigned groups" DataTable renders the group name + a "N members"
  // subtitle + a "Viewer"/"Editor" permissions cell + the ellipsis action
  // button. We assign a group without knowing its name up-front; the "members"
  // subtitle is unique to group rows (the Users table has no such cell), so it
  // distinguishes the assigned-group row from the owner row in the Users table.
  const assignedGroupRow = (page: Page) => page.getByRole('row', { name: /\d+ members/ }).first()

  test('editing an assigned group role shows the role-updated confirmation', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await assignGroupViaDialog(page)

    const row = assignedGroupRow(page)
    await expect(row).toBeVisible({ timeout: 15_000 })

    // Read the current permission before opening the dialog: handleRoleChange
    // skips the mutation (and the toast) when the role is unchanged, so we must
    // pick the *other* role. (Capture now — the row detaches once the dialog
    // overlay mounts.)
    const currentRole = (await row.textContent())?.includes('Editor') ? 'Editor' : 'Viewer'
    const nextRole = currentRole === 'Editor' ? 'Viewer' : 'Editor'

    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: 'Edit role' }).click()

    // EditGroupRoleDialog (program-settings-edit-role-dialog.tsx): title "Edit
    // role", a Radix Select with "Viewer"/"Editor", submit "Edit role".
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

    // ConfirmationDialog (role=alertdialog) titled "Remove Group", confirm "Remove".
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

    // program-settings-import-controls-dialog.tsx: trigger "Import" → dialog with
    // an "Import controls from" Radix Select (Framework default / Program).
    await page.getByRole('button', { name: /^Import$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Import controls from')).toBeVisible({ timeout: 10_000 })

    // Switch the source Select from Framework → Program; the program variant
    // (program-settings-import-controls-dialog-program.tsx) renders a "Select
    // program" picker button. A full import isn't asserted here: cloneControls
    // needs a source program that already owns controls, and createProgram seeds
    // a bare program with none — so there's nothing importable to drive to a
    // success toast on the shared org.
    // The dialog has two comboboxes: the source select (first) and the table's
    // rows-per-page (last). Drive the source one.
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Program' }).click()

    const picker = dialog.getByRole('button', { name: /Select program/ })
    await expect(picker).toBeVisible({ timeout: 10_000 })
    await picker.click()
    // Opening the picker reveals the checkbox grid of selectable programs (we
    // seeded several this run, so at least one option renders).
    await expect(dialog.getByRole('checkbox').first()).toBeVisible({ timeout: 10_000 })
  })

  // Link a control to a program (control side: addProgramIDs). createProgram
  // seeds a bare program with no controls, so the import-from-program flow has
  // nothing to clone unless a source program already owns at least one control.
  // utils/api.ts has no program-link helper, so we drive updateControl inline.
  const linkControlProgram = async (controlId: string, programId: string): Promise<void> => {
    const res = await gql<{ updateControl: { control: { id: string } } }>(ownerApi, `mutation($id: ID!, $input: UpdateControlInput!){ updateControl(id: $id, input: $input){ control { id } } }`, {
      id: controlId,
      input: { addProgramIDs: [programId] },
    })
    if (!res.data?.updateControl?.control?.id) throw new Error(`linkControlProgram failed: ${JSON.stringify(res.errors)}`)
  }

  test('importing a control from another program clones it and confirms with a success toast', async ({ page }) => {
    test.slow()
    // Source program that actually owns a control + the destination program.
    const sourceName = uniqueProgramName()
    const sourceId = await createProgram(ownerApi, sourceName)
    const controlId = await createControl(ownerApi, `E2E-IMP-${RUN_ID}-${counter++}`)
    await linkControlProgram(controlId, sourceId)

    const destId = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${destId}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Import$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Import controls from')).toBeVisible({ timeout: 10_000 })

    // Switch source Framework → Program, open the picker, select the source.
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Program' }).click()
    await dialog.getByRole('button', { name: /Select program/ }).click()
    await dialog.getByRole('checkbox', { name: new RegExp(sourceName) }).check()

    // The control table populates once a source program is selected; check the
    // row to add it to selectedItems (header select-all + at least one row).
    const controlRow = dialog.getByRole('row', { name: new RegExp(`E2E-IMP-${RUN_ID}`) })
    await expect(controlRow.first()).toBeVisible({ timeout: 15_000 })
    await controlRow.first().getByRole('checkbox').check()

    // Footer button switches from "Import" to "Import (N)" once items are
    // selected; clicking it calls cloneControls → "Controls Imported" toast.
    await dialog.getByRole('button', { name: /^Import \(\d+\)$/ }).click()
    await expect(page.getByText(/Controls Imported|successfully imported/i).first()).toBeVisible({ timeout: 20_000 })
  })
})
