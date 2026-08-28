import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { inlineCsv } from '../utils/files'
import { uploadCsvAndAssert } from '../utils/mutations'
import { createControl, getFirstStandardWithControl, getOwnerApi } from '../utils/api'
import { uniqueRef } from '../utils/unique'

const openControlsToolbar = async (page: Page) => {
  await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 60_000 })
}

const openBulkDialog = async (page: Page, item: string) => {
  await page.getByRole('button', { name: 'Action' }).click()
  await page.getByRole('button', { name: new RegExp(item) }).click({ timeout: 30_000 })

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  return dialog
}

const BULK_DIALOGS = [
  { item: 'Upload From Standard', title: 'Bulk Upload From Standards' },
  { item: 'Upload Custom Controls', title: 'Bulk Upload Custom Controls' },
  { item: 'Upload Control Mappings', title: 'Bulk Upload Control Mappings' },
]

test.describe('controls — bulk upload dialogs', () => {
  for (const { item, title } of BULK_DIALOGS) {
    test(`"${item}" opens ${title} with the CSV format callout and a disabled Upload`, async ({ page }) => {
      test.slow()
      await openControlsToolbar(page)

      const dialog = await openBulkDialog(page, item)
      await expect(dialog.getByRole('heading', { name: title })).toBeVisible({ timeout: 15_000 })
      await expect(dialog.getByText('CSV Format')).toBeVisible()
      await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()
    })
  }

  test('attaching a CSV enables the Upload button on the custom-controls dialog', async ({ page }) => {
    test.slow()
    await openControlsToolbar(page)

    const dialog = await openBulkDialog(page, 'Upload Custom Controls')
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()

    await dialog.locator('input[type="file"]').first().setInputFiles(inlineCsv('controls.csv', 'ref_code,description\nE2E-BULK-1,seeded by e2e\n'))

    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeEnabled({ timeout: 30_000 })
  })

  test('a non-CSV file is rejected by the custom-controls dialog', async ({ page }) => {
    test.slow()
    await openControlsToolbar(page)

    const dialog = await openBulkDialog(page, 'Upload Custom Controls')
    await dialog
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a csv', 'utf-8') })

    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled({ timeout: 15_000 })
  })
})

test.describe('controls — bulk upload submits', () => {
  test('uploading a custom-controls CSV creates the control it names', async ({ page }) => {
    test.slow()
    const refCode = `E2E-BULK-${Date.now().toString(36)}`
    await openControlsToolbar(page)

    const dialog = await openBulkDialog(page, 'Upload Custom Controls')
    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'controls.csv',
      rows: `RefCode,Description\n${refCode},seeded by e2e\n`,
      operationName: 'CreateBulkCSVControl',
      expectToast: 'Controls Created',
    })

    await page.locator('.lucide-table').first().click()
    await page.getByPlaceholder(/^Search$/).fill(refCode)
    await expect(page.getByRole('row').filter({ hasText: refCode }).first()).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('controls — mapping and clone CSV submit', () => {
  test('uploading a control-mappings CSV creates the mapping it names', async ({ page }) => {
    test.slow()
    const ownerApi = await getOwnerApi()
    const fromId = await createControl(ownerApi, uniqueRef('E2E-MAPFROM'))
    const toId = await createControl(ownerApi, uniqueRef('E2E-MAPTO'))

    await openControlsToolbar(page)
    const dialog = await openBulkDialog(page, 'Upload Control Mappings')

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'mappings.csv',
      rows: `FromControlIDs,ToControlIDs,MappingType\n"[\\"${fromId}\\"]","[\\"${toId}\\"]",EQUAL\n`,
      operationName: 'CreateBulkCSVMappedControl',
      expectToast: 'Control Mappings Created',
    })
  })

  test('uploading a from-standard CSV clones the controls it names', async ({ page }) => {
    test.slow()
    const ownerApi = await getOwnerApi()
    const standard = await getFirstStandardWithControl(ownerApi)
    test.skip(!standard, 'no standard with controls available in this environment')

    await openControlsToolbar(page)
    const dialog = await openBulkDialog(page, 'Upload From Standard')

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'from-standard.csv',
      rows: `standard_short_name,ref_codes\n${standard?.shortName},["${standard?.refCode}"]\n`,
      operationName: 'CloneBulkCSVControl',
      expectToast: 'Controls Created',
    })
  })
})
