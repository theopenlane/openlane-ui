import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createVendor, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const deleteVendor = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteEntity(id: $id){ deletedID } }`, { id })
}

const openVendor = async (page: Page, id: string, name: string) => {
  await page.goto(`/registry/vendors/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: new RegExp(escapeRegExp(name)) }).first()).toBeVisible({ timeout: 60_000 })
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('registry — vendor detail', () => {
  test('full-page edit mode persists contract fields from the properties sidebar', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Vendor edit')
    const billingModel = uniqueName('E2E Billing')
    const id = await createVendor(ownerApi, name)

    try {
      await openVendor(page, id, name)
      await page.getByRole('button', { name: 'Edit vendor', exact: true }).click()

      const billing = page.getByLabel('Billing Model', { exact: true })
      await expect(billing).toBeEditable({ timeout: 30_000 })
      await billing.fill(billingModel)
      await page.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(page.getByText('Vendor updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

      await openVendor(page, id, name)
      await expect(page.getByText(billingModel, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteVendor(ownerApi, id)
    }
  })

  test('cancelling edit mode discards the unsaved sidebar change', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Vendor cancel')
    const id = await createVendor(ownerApi, name)

    try {
      await openVendor(page, id, name)
      await page.getByRole('button', { name: 'Edit vendor', exact: true }).click()

      const billing = page.getByLabel('Billing Model', { exact: true })
      await expect(billing).toBeEditable({ timeout: 30_000 })
      await billing.fill('discarded-by-e2e')
      await page.getByRole('button', { name: /^Cancel$/ }).click()

      await expect(page.getByRole('button', { name: 'Edit vendor', exact: true })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText('discarded-by-e2e', { exact: true })).toHaveCount(0, { timeout: 30_000 })

      await openVendor(page, id, name)
      await expect(page.getByText('discarded-by-e2e', { exact: true })).toHaveCount(0, { timeout: 30_000 })
    } finally {
      await deleteVendor(ownerApi, id)
    }
  })

  test('deleting a vendor from the actions menu redirects to the vendor list', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Vendor delete')
    let deletedInUi = false
    const id = await createVendor(ownerApi, name)

    try {
      await openVendor(page, id, name)
      await page.getByRole('button', { name: 'Vendor actions' }).click()
      await page.getByRole('button', { name: /^Delete$/ }).click()

      const confirmation = page.getByRole('alertdialog')
      await expect(confirmation.getByRole('heading', { name: /^Delete Vendor$/ })).toBeVisible({ timeout: 15_000 })
      await confirmation.getByRole('button', { name: /^Delete$/ }).click()

      await expect(page.getByText('Vendor deleted successfully.', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
      deletedInUi = true
      await expect(page).toHaveURL(/\/registry\/vendors$/, { timeout: 30_000 })

      await page.getByPlaceholder(/^Search$/).fill(name)
      await expect(page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })).toHaveCount(0, { timeout: 30_000 })
    } finally {
      if (!deletedInUi) await deleteVendor(ownerApi, id)
    }
  })
})
