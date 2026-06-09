import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createEvidence, type ApiSession } from '../utils/api'
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
})
