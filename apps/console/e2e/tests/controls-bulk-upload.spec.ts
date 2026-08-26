import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { inlineCsv } from '../utils/files'

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
