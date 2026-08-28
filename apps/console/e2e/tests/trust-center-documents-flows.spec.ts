import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { SAMPLE_PDF, uploadFiles } from '../utils/files'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const requireDemoOrg = () => test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const openDocuments = async (page: Page) => {
  await page.goto('/trust-center/documents', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByPlaceholder('Search documents...')).toBeVisible({ timeout: 60_000 })
}

const CATEGORY = 'E2E Category'

const createDocument = async (page: Page, title: string): Promise<void> => {
  await page.getByRole('button', { name: 'New Document' }).click()
  const sheet: Locator = page.getByRole('dialog')
  await expect(sheet.getByPlaceholder('Document title')).toBeVisible({ timeout: 30_000 })
  await sheet.getByPlaceholder('Document title').fill(title)

  await sheet.getByRole('combobox').first().click()
  await page.getByPlaceholder('Search category...').fill(CATEGORY)
  await page
    .getByRole('option', { name: CATEGORY })
    .or(page.getByText(`Create "${CATEGORY}"`))
    .first()
    .click()

  await sheet
    .getByRole('combobox')
    .filter({ hasText: /^(Not visible|Publicly visible|Protected)$/ })
    .first()
    .click()
  await page.getByRole('option', { name: /publicly visible/i }).click()

  await uploadFiles(page, SAMPLE_PDF, sheet.locator('input[type="file"]').first())
  await sheet.getByRole('button', { name: /^Create$/ }).click()
  await expect(toast(page, 'Document Uploaded')).toBeVisible({ timeout: 60_000 })
}

const deleteDocument = async (page: Page, title: string): Promise<void> => {
  await page.getByPlaceholder('Search documents...').fill(title)
  const row = page.getByRole('row', { name: new RegExp(escapeRegExp(title)) })
  if ((await row.count()) === 0) return

  await row.first().click()
  const detail = page.getByRole('dialog')
  await detail.getByRole('button', { name: 'Delete document' }).click()
  await page
    .getByRole('alertdialog')
    .getByRole('button', { name: /^Delete$/ })
    .click()
  await expect(row).toBeHidden({ timeout: 30_000 })
}

test.describe('trust-center — document metadata (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  test('editing a document title persists through search', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openDocuments(page)

    const title = uniqueName('E2E Doc meta')
    const renamed = `${title} revised`

    try {
      await createDocument(page, title)

      await page.getByPlaceholder('Search documents...').fill(title)
      const row = page.getByRole('row', { name: new RegExp(escapeRegExp(title)) })
      await expect(row).toBeVisible({ timeout: 30_000 })
      await row.click()

      const detail = page.getByRole('dialog')
      await detail.getByRole('button', { name: 'Edit document' }).click()
      const titleField = detail.getByPlaceholder('Document title')
      await expect(titleField).toBeEditable({ timeout: 30_000 })
      await expect
        .poll(
          async () => {
            if ((await titleField.inputValue()) !== renamed) await titleField.fill(renamed)
            return titleField.inputValue()
          },
          { timeout: 20_000 },
        )
        .toBe(renamed)

      await titleField.click()
      await detail.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(toast(page, 'Document Updated')).toBeVisible({ timeout: 60_000 })

      await openDocuments(page)
      const search = page.getByPlaceholder('Search documents...')
      const renamedRow = page.getByRole('row', { name: new RegExp(escapeRegExp(renamed)) })
      await expect(async () => {
        await page.reload({ waitUntil: 'domcontentloaded' })
        await expect(search).toBeVisible({ timeout: 30_000 })
        await search.fill(renamed)
        await expect(renamedRow).toBeVisible({ timeout: 15_000 })
      }).toPass({ timeout: 90_000 })
    } finally {
      await openDocuments(page)
      await deleteDocument(page, renamed)
      await deleteDocument(page, title)
    }
  })
})

test.describe('trust-center — document table controls (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  test('the document table renders its pagination controls', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openDocuments(page)

    await expect(page.getByText(/^Page \d+ of \d+$/)).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'First page' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Last page' })).toBeVisible()
    await expect(page.getByText('Rows per page')).toBeVisible()
  })
})
