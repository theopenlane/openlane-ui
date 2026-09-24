import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { inlineCsv } from '../utils/files'
import { expectImportPage, uploadCsvAndAssert, uploadCsvToSingleStepDialogAndAssert } from '../utils/mutations'
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

interface ImportTarget {
  item: string
  importType: string
  heading: RegExp
}

const CUSTOM_CONTROLS: ImportTarget = { item: 'Upload Custom Controls', importType: 'control', heading: /^Import controls$/ }
const CONTROL_MAPPINGS: ImportTarget = { item: 'Upload Control Mappings', importType: 'mappedcontrol', heading: /^Import control mappings$/ }

const openImportPage = async (page: Page, { item, importType, heading }: ImportTarget) => {
  await page.getByRole('button', { name: 'Action' }).click()
  await page.getByRole('button', { name: new RegExp(item) }).click({ timeout: 30_000 })

  return expectImportPage(page, importType, heading)
}

test.describe('controls — bulk upload dialogs and import pages', () => {
  test('"Upload From Standard" opens the single-step standards dialog with a disabled Upload', async ({ page }) => {
    test.slow()
    await openControlsToolbar(page)

    const dialog = await openBulkDialog(page, 'Upload From Standard')
    await expect(dialog.getByRole('heading', { name: 'Bulk Upload From Standards' })).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText('CSV Format')).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()
  })

  for (const target of [CUSTOM_CONTROLS, CONTROL_MAPPINGS]) {
    test(`"${target.item}" opens the import wizard on the upload step`, async ({ page }) => {
      test.slow()
      await openControlsToolbar(page)

      const scope = await openImportPage(page, target)
      await expect(scope.getByText('What gets imported')).toBeVisible()
      await expect(scope.getByRole('button', { name: /^Continue$/ })).toBeDisabled()
    })
  }

  test('attaching a CSV enables Continue on the custom-controls wizard', async ({ page }) => {
    test.slow()
    await openControlsToolbar(page)

    const scope = await openImportPage(page, CUSTOM_CONTROLS)
    await expect(scope.getByRole('button', { name: /^Continue$/ })).toBeDisabled()

    await scope.locator('input[type="file"]').first().setInputFiles(inlineCsv('controls.csv', 'ref_code,description\nE2E-BULK-1,seeded by e2e\n'))

    await expect(scope.getByRole('button', { name: /^Continue$/ })).toBeEnabled({ timeout: 30_000 })
  })

  test('a non-CSV file is rejected by the custom-controls wizard', async ({ page }) => {
    test.slow()
    await openControlsToolbar(page)

    const scope = await openImportPage(page, CUSTOM_CONTROLS)
    await scope
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a csv', 'utf-8') })

    await expect(scope.getByRole('button', { name: /^Continue$/ })).toBeDisabled({ timeout: 15_000 })
  })

  test('a column with no matching field can be ignored and is left out of the import', async ({ page }) => {
    test.slow()
    await openControlsToolbar(page)

    const scope = await openImportPage(page, CUSTOM_CONTROLS)
    await scope.locator('input[type="file"]').first().setInputFiles(inlineCsv('controls.csv', 'Control ID,Description,Internal Notes From Ops\nCC6.1,seeded by e2e,ignore me\n'))

    await scope.getByRole('button', { name: /^Continue$/ }).click()
    await expect(scope.getByText('Import as', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(scope.getByText('Internal Notes From Ops')).toBeVisible()
    await expect(scope.getByText('Ignore this column').first()).toBeVisible()

    await scope.getByRole('button', { name: /^Continue$/ }).click()
    await expect(scope.getByText(/Not imported: .*Internal Notes From Ops/)).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('controls — bulk upload submits', () => {
  test('uploading a custom-controls CSV creates the control it names', async ({ page }) => {
    test.slow()
    const refCode = `E2E-BULK-${Date.now().toString(36)}`
    await openControlsToolbar(page)

    const scope = await openImportPage(page, CUSTOM_CONTROLS)
    await uploadCsvAndAssert({
      page,
      scope,
      fileName: 'controls.csv',
      rows: `RefCode,Description\n${refCode},seeded by e2e\n`,
      operationName: 'CreateBulkCSVControl',
      expectToast: 'Controls imported',
      returnsTo: '/controls',
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
    const scope = await openImportPage(page, CONTROL_MAPPINGS)

    await uploadCsvAndAssert({
      page,
      scope,
      fileName: 'mappings.csv',
      rows: `FromControlIDs,ToControlIDs,MappingType\n${fromId},${toId},EQUAL\n`,
      operationName: 'CreateBulkCSVMappedControl',
      expectToast: 'Control mappings imported',
      returnsTo: '/controls',
    })
  })

  test('uploading a from-standard CSV clones the controls it names', async ({ page }) => {
    test.slow()
    const ownerApi = await getOwnerApi()
    const standard = await getFirstStandardWithControl(ownerApi)
    test.skip(!standard, 'no standard with controls available in this environment')

    await openControlsToolbar(page)
    const dialog = await openBulkDialog(page, 'Upload From Standard')

    await uploadCsvToSingleStepDialogAndAssert({
      page,
      dialog,
      fileName: 'from-standard.csv',
      rows: `standard_short_name,ref_codes\n${standard?.shortName},["${standard?.refCode}"]\n`,
      operationName: 'CloneBulkCSVControl',
      expectToast: 'Controls Created',
    })
  })
})
