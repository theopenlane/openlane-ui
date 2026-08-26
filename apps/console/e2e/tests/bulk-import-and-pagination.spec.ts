import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { inlineCsv } from '../utils/files'

const openEvidence = async (page: Page) => {
  await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 60_000 })
}

const openFirstStandard = async (page: Page) => {
  await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 60_000 })
  const href = await page.locator('a[href^="standards/"]').first().getAttribute('href')
  await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByText('Domains', { exact: true })).toBeVisible({ timeout: 60_000 })
}

test.describe('evidence — bulk CSV import', () => {
  test('the Bulk Upload dialog opens with the CSV format callout and a disabled Upload', async ({ page }) => {
    test.slow()
    await openEvidence(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Bulk Upload$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /^Bulk Upload$/ })).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByText('CSV Format', { exact: true })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()
  })

  test('attaching a CSV enables the evidence Upload button', async ({ page }) => {
    test.slow()
    await openEvidence(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Bulk Upload$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled({ timeout: 30_000 })

    await dialog.locator('input[type="file"]').first().setInputFiles(inlineCsv('evidence.csv', 'name,description\nE2E-EVIDENCE-1,seeded by e2e\n'))

    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeEnabled({ timeout: 30_000 })
  })

  test('a non-CSV file leaves the evidence Upload button disabled', async ({ page }) => {
    test.slow()
    await openEvidence(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Bulk Upload$/ }).click()

    const dialog = page.getByRole('dialog')
    await dialog
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not a csv', 'utf-8') })

    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled({ timeout: 30_000 })
  })
})

test.describe('standards — per-category control pagination', () => {
  test('an open domain section renders its own pagination controls', async ({ page }) => {
    test.slow()
    await openFirstStandard(page)

    await expect(page.getByText(/^Page \d+ of \d+$/).first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'Next page' }).first()).toBeVisible()
    await expect(page.getByText('Rows per page').first()).toBeVisible()
  })

  test('Next page swaps the controls listed in the open domain section', async ({ page }) => {
    test.slow()
    await openFirstStandard(page)

    const next = page.getByRole('button', { name: 'Next page' }).first()
    await expect(next).toBeVisible({ timeout: 60_000 })
    test.skip(await next.isDisabled(), 'the first domain section fits on a single page')

    const refCodes = async (): Promise<string[]> =>
      (
        await page
          .getByRole('row')
          .filter({ hasText: /^[A-Z]+\d/ })
          .allInnerTexts()
      ).map((text) => text.trim())

    const firstPage = await refCodes()
    await next.click()

    await expect.poll(async () => (await refCodes()).join('|'), { timeout: 30_000 }).not.toBe(firstPage.join('|'))
  })

  test('the domains header offers an expand or collapse all control', async ({ page }) => {
    test.slow()
    await openFirstStandard(page)

    await expect(page.getByRole('button', { name: 'Expand or collapse all domains' })).toBeVisible({ timeout: 60_000 })
  })
})
