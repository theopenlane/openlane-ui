import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { createEvidence, createControl, createProgram, linkControlEvidence, readField, type ApiSession, getOwnerApi } from '../utils/api'
import { bulkEditAndSave, selectFirstMatchingRow } from '../utils/mutations'
import { deleteFirstComment, editFirstComment, postComment } from '../utils/comments'
import { uploadFiles, SAMPLE_PDF, SAMPLE_DISALLOWED } from '../utils/files'
import { saveEvidenceAsDraft } from '../utils/evidence'
import { uniqueName } from '../utils/unique'

let ownerApi: ApiSession
const uniqueEvidenceName = () => uniqueName('E2E EvCRUD')

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
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

    await expect(dialog.getByText(/sample\.pdf/i)).toBeVisible({ timeout: 10_000 })
  })

  test('a disallowed file type is not added to the form', async ({ page }) => {
    const dialog = await openSubmitSheet(page)
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await uploadFiles(page, SAMPLE_DISALLOWED, dialog.locator('input[type="file"]'))
    await expect(dialog.getByText(/drag and drop files/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/sample\.exe/i)).toHaveCount(0)
  })

  test('saving evidence with a name + file opens the detail slideout in place', async ({ page }) => {
    const dialog = await openSubmitSheet(page)
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    const name = uniqueEvidenceName()
    await dialog.locator('input[name="name"]').fill(name)
    await uploadFiles(page, SAMPLE_PDF, dialog.locator('input[type="file"]'))
    await saveEvidenceAsDraft(page, dialog)

    await expect(page.getByRole('dialog').getByText(name).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('evidence — delete', () => {
  test('delete a seeded evidence record from its detail sheet', async ({ page }) => {
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: 'Delete evidence' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^delete$/i })
      .click()

    await expect(page.getByRole('button', { name: 'Delete evidence' })).toHaveCount(0, { timeout: 15_000 })
  })
})

test.describe('evidence — linking (seeded)', () => {
  test('evidence linked to a control shows the control in its detail sheet', async ({ page }) => {
    const evidenceId = await createEvidence(ownerApi, uniqueEvidenceName())
    const refCode = `E2E-EVLNK-${RUN_ID}-${Date.now().toString(36)}`
    const controlId = await createControl(ownerApi, refCode)
    await linkControlEvidence(ownerApi, controlId, evidenceId)

    await page.goto(`/evidence?id=${evidenceId}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText(refCode).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('evidence — table tooling', () => {
  test('column visibility menu opens from the evidence list toolbar', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
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

    await expect(page.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: 'Edit evidence' }).click()

    const nameInput = sheet.locator('input[name="name"]')
    await expect(nameInput).toBeVisible({ timeout: 15_000 })
    await nameInput.fill(uniqueEvidenceName())

    await page.getByRole('button', { name: /^Save Changes$/ }).click()
    await expect(page.getByText(/^Evidence Updated$/).first()).toBeVisible({ timeout: 20_000 })
  })

  test('the Renew action opens the Renew Evidence dialog', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('button', { name: /^Renew$/ })).toBeVisible({ timeout: 20_000 })
    await page.getByRole('button', { name: /^Renew$/ }).click()

    await expect(page.getByRole('heading', { name: 'Renew Evidence' })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — status overview', () => {
  test('the Evidence Status Overview summary card renders its status legend', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Evidence Status Overview', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Requested', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Auditor Approved', { exact: true }).first()).toBeVisible()
  })
})

test.describe('evidence — program filter', () => {
  test('the Filter by Program dropdown opens and lists the All programs option', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /Program/ }).click()
    await expect(page.getByRole('menuitem', { name: /All programs/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — export', () => {
  test('the Export dialog starts an evidence export with the success toast', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('main').getByRole('button', { name: 'Action', exact: true }).click()
    await page.getByText('Export', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Export Evidence' })).toBeVisible({ timeout: 10_000 })
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

    await page.getByRole('button', { name: /^Bulk Edit/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Bulk edit' })).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Select field...').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — suggested actions (seeded)', () => {
  test('a freshly created, unlinked evidence surfaces in the Suggested Actions popover', async ({ page }) => {
    const name = uniqueEvidenceName()
    await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Evidence Center', exact: true })).toBeVisible({ timeout: 20_000 })

    const trigger = page.getByRole('button', { name: 'Suggested actions' })
    await expect(trigger).toBeVisible({ timeout: 20_000 })
    await trigger.click()

    await expect(page.getByRole('heading', { name: 'Suggested Actions', exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: 'Add evidence' }).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — comments (seeded)', () => {
  test('the detail sheet Comments card opens the comments sheet', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Latest Comment', { exact: true })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /View & Add Comments/ }).click()

    await expect(page.getByText(/Newest at top/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('evidence — file attachments (seeded)', () => {
  test('the detail sheet Provided files section exposes the File Upload dialog', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Provided files', { exact: true })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^File Upload$/ }).click()

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

    const textarea = sheet.locator('#description')
    await expect(async () => {
      await sheet.getByText('no description provided').dblclick()
      await expect(textarea).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
    await textarea.fill(`E2E inline ${RUN_ID} ${Date.now().toString(36)}`)
    await textarea.blur()

    await expect(page.getByText(/^Field updated successfully$/).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('evidence — author attribution (ISS-2443)', () => {
  test('a seeded record resolves Created by to a real author, not a fallback label', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: /^Evidence Center$/ })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await page.getByRole('menu').getByText('Created by', { exact: true }).click()
    await page.keyboard.press('Escape')

    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 20_000 })

    await expect(row.getByText('Deleted user')).toHaveCount(0)
    await expect(row.getByText('Unknown', { exact: true })).toHaveCount(0)
  })
})

test.describe('evidence — slideout relationship panels (ISS-2531)', () => {
  test('the detail sheet shows the Linked Control(s) panel with a count', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByText('Linked controls', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(sheet.getByText('Linked programs', { exact: true })).toBeVisible()
  })

  test('a linked control appears in the panel instead of the empty state', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    const evidenceId = await createEvidence(ownerApi, name)
    const refCode = `E2E-EVPANEL-${RUN_ID}-${Date.now().toString(36)}`
    const controlId = await createControl(ownerApi, refCode)
    await linkControlEvidence(ownerApi, controlId, evidenceId)

    await page.goto(`/evidence?id=${evidenceId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Linked controls', { exact: true })).toBeVisible({ timeout: 30_000 })

    await expect(sheet.getByText('no controls linked', { exact: true })).toHaveCount(0)
  })
})

test.describe('evidence — collection procedure panel (ISS-2584)', () => {
  test('a seeded record with no collection procedure hides the panel', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 30_000 })
    // Wait for real content so the assertion is not racing an unrendered sheet
    await expect(sheet.getByText('Linked controls', { exact: true })).toBeVisible({ timeout: 30_000 })

    await expect(sheet.getByText('Collection procedure', { exact: true })).toHaveCount(0)
  })

  test('entering edit mode reveals the collection procedure field', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 30_000 })
    await sheet.getByRole('button', { name: 'Edit evidence' }).click()

    await expect(sheet.getByText('Collection procedure', { exact: true })).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('evidence — editing saves without re-submitting (ISS-2724)', () => {
  test('an edit updates the record and leaves its status alone', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 30_000 })

    const statusBefore = await sheet
      .getByText(/^(Draft|Requested|Submitted|In Review|Ready|Approved|Rejected|Needs Renewal|Missing Artifact)$/)
      .first()
      .textContent()

    await sheet.getByRole('button', { name: 'Edit evidence' }).click()

    const save = sheet.getByRole('button', { name: /^Save Changes$/ })
    await expect(save).toBeVisible({ timeout: 20_000 })

    const description = sheet.getByRole('textbox').first()
    await description.fill(`edited ${Date.now().toString(36)}`)
    await save.click()

    await expect(page.getByText('Evidence Updated').first()).toBeVisible({ timeout: 20_000 })

    await expect(sheet.getByText(statusBefore ?? 'Draft', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('evidence — view opens read-only (ISS-2723)', () => {
  test('opening a record via ?id= shows the Edit action, meaning it is not already editing', async ({ page }) => {
    test.slow()
    const name = uniqueEvidenceName()
    const id = await createEvidence(ownerApi, name)

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 30_000 })

    await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 20_000 })
    await expect(sheet.getByRole('button', { name: /^Save Changes$/ })).toHaveCount(0)
  })

  test('editing then reopening a different record does not carry edit mode over', async ({ page }) => {
    test.slow()
    const firstId = await createEvidence(ownerApi, uniqueEvidenceName())
    const secondId = await createEvidence(ownerApi, uniqueEvidenceName())

    await page.goto(`/evidence?id=${firstId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 30_000 })
    await sheet.getByRole('button', { name: 'Edit evidence' }).click()
    await expect(sheet.getByRole('button', { name: /^Save Changes$/ })).toBeVisible({ timeout: 20_000 })

    await page.goto(`/evidence?id=${secondId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByRole('button', { name: /^Save Changes$/ })).toHaveCount(0)
  })
})

test.describe('evidence — sticky program filter (ISS-2712)', () => {
  test('choosing a program sets the url param and survives a fresh visit', async ({ page }) => {
    test.slow()
    await createProgram(ownerApi, `E2E StickyProg ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 1, name: /^Evidence Center$/ })).toBeVisible({ timeout: 30_000 })

    const programFilter = page.getByRole('button', { name: /^Filter by:/ })
    await expect(programFilter).toBeVisible({ timeout: 30_000 })
    await programFilter.click()

    await expect(page.getByText('All programs', { exact: true })).toBeVisible({ timeout: 15_000 })
    const firstProgram = page.getByRole('menuitem').nth(1)
    await expect(firstProgram).toBeVisible({ timeout: 15_000 })
    await firstProgram.click()

    await expect(page).toHaveURL(/[?&]programId=/, { timeout: 20_000 })

    await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page).toHaveURL(/[?&]programId=/, { timeout: 30_000 })
  })
})

test.describe('evidence — bulk edit applies', () => {
  test('bulk editing a selected evidence record persists the new status', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E EvidenceBulk')
    const id = await createEvidence(ownerApi, name)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    await selectFirstMatchingRow(page, name)

    const chosen = await bulkEditAndSave({ page, field: 'Status', operationName: 'UpdateBulkEvidence' })

    await expect.poll(async () => readField(ownerApi, 'evidence', id, 'status'), { timeout: 60_000 }).toBe(chosen.toUpperCase().replace(/ /g, '_'))
  })
})

test.describe('evidence — comments round-trip', () => {
  test('a comment can be posted, edited and deleted from the comments sheet', async ({ page }) => {
    test.slow()
    const id = await createEvidence(ownerApi, uniqueEvidenceName())
    const body = `E2E comment ${RUN_ID} ${Date.now().toString(36)}`
    const edited = `${body} edited`

    await page.goto(`/evidence?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: 'Delete evidence' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: /View & Add Comments/ }).click()
    await expect(page.getByText(/Newest at top/).first()).toBeVisible({ timeout: 30_000 })

    await postComment(page, page, 'UpdateEvidence', body)
    await editFirstComment(page, 'UpdateEvidenceComment', edited)
    await deleteFirstComment(page, 'DeleteNote', edited)
  })
})
