import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createEvidence, createControl, linkControlEvidence, type ApiSession } from '../utils/api'
import { uploadFiles, SAMPLE_PDF, SAMPLE_DISALLOWED } from '../utils/files'

/**
 * Deep evidence flows beyond evidence.spec.ts (create/search/validation on fresh
 * users): file upload, disallowed-type rejection, delete. Runs as the
 * storage-state Owner; entities seeded via the Owner API with run-unique names.
 *
 * ⏳ Written without running (servers were off). Selectors grounded in
 * evidence.spec.ts + a component selector map; verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueEvidenceName = () => `E2E EvCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

const openSubmitSheet = async (page: Page) => {
  await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
  await page.getByRole('button', { name: /^submit evidence$/i }).click()
  return page.getByRole('dialog')
}

test.describe('evidence — file upload', () => {
  test('uploading a PDF shows the file in the submit sheet', async ({ page }) => {
    const dialog = await openSubmitSheet(page)
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await uploadFiles(page, SAMPLE_PDF, dialog.locator('input[type="file"]'))

    // UploadedFileDetailsCard renders the file name once accepted.
    await expect(dialog.getByText(/sample\.pdf/i)).toBeVisible({ timeout: 10_000 })
  })

  test('a disallowed file type is not added to the form', async ({ page }) => {
    const dialog = await openSubmitSheet(page)
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    // react-dropzone's `accept` config filters out unaccepted types before they
    // reach the component (onDropRejected, unhandled) — so a .exe is silently
    // dropped: no file card is rendered. (There's no visible error toast for
    // accept-filtered files, unlike oversize files.)
    await uploadFiles(page, SAMPLE_DISALLOWED, dialog.locator('input[type="file"]'))
    // The dropzone stays in its empty state ("Drag and drop files…") and the
    // file name never appears, proving the .exe was not accepted.
    await expect(dialog.getByText(/drag and drop files/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/sample\.exe/i)).toHaveCount(0)
  })

  test('submitting evidence with a name + file lands on the detail view', async ({ page }) => {
    const dialog = await openSubmitSheet(page)
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    const name = uniqueEvidenceName()
    await dialog.locator('input[name="name"]').fill(name)
    await uploadFiles(page, SAMPLE_PDF, dialog.locator('input[type="file"]'))
    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    await page.waitForURL(/\/evidence\?id=/, { timeout: 30_000 })
  })
})

test.describe('evidence — delete', () => {
  test('delete a seeded evidence record from its detail sheet', async ({ page }) => {
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    // Navigating with ?id= opens the evidence detail sheet.
    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: 'Delete evidence' }).click()
    // ConfirmationDialog renders as a Radix alertdialog (the detail sheet itself
    // is a role=dialog, so scope the confirm to alertdialog).
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^delete$/i })
      .click()

    // After delete the sheet closes (the ?id= param is cleared).
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toHaveCount(0, { timeout: 15_000 })
  })
})

test.describe('evidence — linking (seeded)', () => {
  test('evidence linked to a control shows the control in its detail sheet', async ({ page }) => {
    const evidenceId = await createEvidence(ownerApi, uniqueEvidenceName())
    const refCode = `E2E-EVLNK-${RUN_ID}-${Date.now().toString(36)}`
    const controlId = await createControl(ownerApi, refCode)
    // Linking is bidirectional (control.evidence ↔ evidence.controls).
    await linkControlEvidence(ownerApi, controlId, evidenceId)

    await page.goto(`/evidence?id=${evidenceId}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    // evidence-details-sheet.tsx renders linked controls via
    // ObjectAssociationControlsChips (chip labelled by the control refCode).
    await expect(page.getByText(refCode).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('evidence — table tooling', () => {
  test('column visibility menu opens from the evidence list toolbar', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    // evidence-table-toolbar.tsx uses the shared ColumnVisibilityMenu ("Columns").
    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    // Shared TableFilter; getEvidenceFilterableFields includes a "Status" field.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('selecting an evidence row reveals the Bulk Delete action', async ({ page }) => {
    const name = uniqueEvidenceName()
    await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    // evidence-table-toolbar.tsx shows "Bulk Delete (n)" once a row is selected.
    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — detail + bulk actions (seeded)', () => {
  test('bulk-deleting a selected evidence row removes it with the success toast', async ({ page }) => {
    const name = uniqueEvidenceName()
    await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await expect(page.getByText(/successfully deleted/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the evidence detail sheet Copy link action confirms the copy', async ({ page }) => {
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Copy link$/ }).click()
    await expect(page.getByText(/link copied to clipboard/i).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — detail edit + renew (seeded)', () => {
  test('editing an evidence record via its detail sheet shows the updated toast', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')

    // Enter edit mode via the Pencil affordance (aria-label "Edit evidence").
    await expect(page.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Edit evidence' }).click()

    // isEditing reveals the editable "Title" Input (FormField name="name").
    const nameInput = sheet.locator('input[name="name"]')
    await expect(nameInput).toBeVisible({ timeout: 15_000 })
    await nameInput.fill(uniqueEvidenceName())

    // SaveButton → "Save Changes" submits the form (onSubmit success toast).
    await page.getByRole('button', { name: /^Save Changes$/ }).click()
    await expect(page.getByText(/^Evidence Updated$/).first()).toBeVisible({ timeout: 20_000 })
  })

  test('the Renew action opens the Renew Evidence dialog', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // EvidenceRenewDialog trigger is a Button labelled "Renew" (Repeat icon).
    await expect(page.getByRole('button', { name: /^Renew$/ })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /^Renew$/ }).click()

    // The dialog title is "Renew Evidence".
    await expect(page.getByRole('heading', { name: 'Renew Evidence' })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — status overview', () => {
  test('the Evidence Status Overview summary card renders its status legend', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    // evidence-summary-card.tsx renders the donut + a status chip legend.
    await expect(page.getByText('Evidence Status Overview', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Requested', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible()
  })
})

test.describe('evidence — program filter', () => {
  test('the Filter by Program dropdown opens and lists the All programs option', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    // evidence-details-page.tsx renders a DropdownMenu trigger "Filter by: Program".
    await page.getByRole('button', { name: /Program/ }).click()
    await expect(page.getByRole('menuitem', { name: /All programs/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — export', () => {
  test('the Export dialog starts an evidence export with the success toast', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    // evidence-table-toolbar.tsx hosts Export inside the Ellipsis ("Action") Menu.
    await page.getByRole('main').getByRole('button', { name: 'Action' }).click()
    await page.getByText('Export', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Export Evidence' })).toBeVisible({ timeout: 10_000 })
    // Folder is the default mode; just confirm the export job starts.
    await dialog.getByRole('button', { name: /^Export$/ }).click()
    await expect(page.getByText(/evidence export started/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('evidence — bulk edit (seeded)', () => {
  test('selecting a row opens the Bulk edit dialog with a field selector', async ({ page }) => {
    const name = uniqueEvidenceName()
    await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    // bulk-edit-evidence.tsx trigger reads "Bulk Edit (n)".
    await page.getByRole('button', { name: /^Bulk Edit/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Bulk edit' })).toBeVisible({ timeout: 10_000 })
    // The first field row exposes a "Select field..." Select.
    await expect(dialog.getByText('Select field...').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — suggested actions (seeded)', () => {
  test('a freshly created, unlinked evidence surfaces in the Suggested Actions popover', async ({ page }) => {
    // A new evidence with no associations is "unlinked" → bumps the badge count.
    const name = uniqueEvidenceName()
    await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    // evidence-suggested-actions.tsx renders the trigger only when badgeCount > 0.
    const trigger = page.getByRole('button', { name: 'Suggested actions' })
    await expect(trigger).toBeVisible({ timeout: 20_000 })
    await trigger.click()

    await expect(page.getByRole('heading', { name: 'Suggested Actions', exact: true })).toBeVisible({ timeout: 10_000 })
    // The unlinked row exposes an "Add" action that links the evidence.
    await expect(page.getByRole('button', { name: 'Add evidence' }).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — comments (seeded)', () => {
  test('the detail sheet Comments card opens the comments sheet', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    // evidence-comment-card.tsx renders a Comments card with "View & Add Comments".
    await expect(page.getByText('Latest Comment', { exact: true })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /View & Add Comments/ }).click()

    // The comments sheet (evidence-comments-sheet.tsx) shows the sort toggle.
    await expect(page.getByText(/Newest at top/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — file attachments (seeded)', () => {
  test('the detail sheet Provided files section exposes the File Upload dialog', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    // evidence-files.tsx renders "Provided files" + a "File Upload" dialog trigger.
    await expect(page.getByText('Provided files', { exact: true })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^File Upload$/ }).click()

    // evidence-upload-dialog.tsx title is "Control Evidence Upload".
    await expect(page.getByRole('heading', { name: 'Control Evidence Upload' })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — inline edit (seeded)', () => {
  test('double-clicking the Description field opens an inline editor that persists on blur', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    // evidence-details-sheet.tsx: double-clicking the Description value swaps it
    // for an editable Textarea (id="description"); blurring commits via
    // handleUpdateField → "Evidence Updated" toast.
    await sheet.getByText('no description provided').dblclick()
    const textarea = sheet.locator('#description')
    await expect(textarea).toBeVisible({ timeout: 10_000 })
    await textarea.fill(`E2E inline ${RUN_ID} ${Date.now().toString(36)}`)
    await textarea.blur()

    // handleUpdateField (single-field inline commit) toasts "Field updated
    // successfully" — distinct from the full-form save's "Evidence Updated".
    await expect(page.getByText(/^Field updated successfully$/).first()).toBeVisible({ timeout: 20_000 })
  })
})
