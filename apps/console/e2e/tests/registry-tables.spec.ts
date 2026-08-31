import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createVendor, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const deleteVendor = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteEntity(id: $id){ deletedID } }`, { id })
}

const openVendors = async (page: Page) => {
  await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 30_000 })
}

const openActionMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'Action' }).click()
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('registry — vendors table', () => {
  test('the filter panel exposes every configured vendor filter', async ({ page }) => {
    test.slow()
    await openVendors(page)

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 15_000 })

    for (const field of ['Status', 'Tags', 'Source Type', 'Relationship State', 'Security Questionnaire Status', 'MFA Supported', 'MFA Enforced', 'SSO Enforced', 'Has SOC 2']) {
      await expect(menu.getByText(field, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    }
  })

  test('Export queues an export job for the vendor table', async ({ page }) => {
    test.slow()
    await openVendors(page)

    await openActionMenu(page)
    await page.getByText('Export', { exact: true }).click()

    await expect(page.getByText('Export Started', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  })

  test('Bulk Upload opens the CSV create dialog', async ({ page }) => {
    test.slow()
    await openVendors(page)

    await openActionMenu(page)
    await page.getByText('Bulk Upload', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()
  })

  test('sorting by Display Name reverses the order of a searched vendor pair', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E VendorSort')
    const first = `${prefix} Alpha`
    const last = `${prefix} Zulu`
    const ids = await Promise.all([createVendor(ownerApi, first, first), createVendor(ownerApi, last, last)])

    try {
      await openVendors(page)
      await page.getByPlaceholder(/^Search$/).fill(prefix)

      const nameCells = page.getByRole('cell').filter({ hasText: prefix })
      await expect(nameCells).toHaveCount(2, { timeout: 30_000 })

      const namesInOrder = async (): Promise<string[]> => (await nameCells.allInnerTexts()).map((text) => text.trim())

      const header = page.getByRole('button', { name: 'Display Name', exact: true })
      await expect(header).toBeVisible({ timeout: 30_000 })
      await header.click()

      await expect.poll(namesInOrder, { timeout: 30_000 }).toEqual([first, last])

      await header.click()
      await expect.poll(namesInOrder, { timeout: 30_000 }).toEqual([last, first])
    } finally {
      await Promise.all(ids.map((id) => deleteVendor(ownerApi, id)))
    }
  })

  test('selecting a vendor row enables Bulk Edit with a field picker', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Vendor bulk')
    const id = await createVendor(ownerApi, name)

    try {
      await openVendors(page)
      await page.getByPlaceholder(/^Search$/).fill(name)

      const row = page.getByRole('row').filter({ hasText: name })
      await expect(row).toBeVisible({ timeout: 30_000 })
      await row.getByRole('checkbox').first().check()

      const bulkEdit = page.getByRole('button', { name: /^Bulk Edit/ })
      await expect(bulkEdit).toBeVisible({ timeout: 15_000 })
      await bulkEdit.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15_000 })
      await expect(dialog.getByText('Select field...', { exact: true })).toBeVisible({ timeout: 15_000 })
    } finally {
      await deleteVendor(ownerApi, id)
    }
  })
})
