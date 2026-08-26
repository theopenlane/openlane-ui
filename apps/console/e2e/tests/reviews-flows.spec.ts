import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createReview, deleteReview, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const openReview = async (page: Page, id: string) => {
  await page.goto(`/exposure/reviews?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 60_000 })
  await expect(sheet.getByRole('button', { name: /^Copy link$/ })).toBeVisible({ timeout: 30_000 })
  return sheet
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('exposure — review detail sheet', () => {
  test('editing a review persists its classification fields across a reload', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Review edit')
    const category = uniqueName('E2E Category')
    const reporter = uniqueName('E2E Reporter')
    const id = await createReview(ownerApi, title)

    try {
      const sheet = await openReview(page, id)
      await sheet
        .getByRole('button', { name: /^Edit$/ })
        .first()
        .click()

      await sheet.getByLabel('Category', { exact: true }).fill(category)
      await sheet.getByLabel('Reporter', { exact: true }).fill(reporter)
      await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(page.getByText('Review Updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

      const reopened = await openReview(page, id)
      await expect(reopened.getByText(category, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
      await expect(reopened.getByText(reporter, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteReview(ownerApi, id)
    }
  })

  test('deleting a review from its detail sheet removes it from the table', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Review delete')
    let deletedInUi = false
    const id = await createReview(ownerApi, title)

    try {
      const sheet = await openReview(page, id)
      await sheet.getByRole('button', { name: /^Delete$/ }).click()

      const confirmation = page.getByRole('alertdialog')
      await expect(confirmation.getByRole('heading', { name: /^Delete Review$/ })).toBeVisible({ timeout: 15_000 })
      await confirmation.getByRole('button', { name: /^Delete$/ }).click()

      await expect(page.getByText(/deleted successfully\.$/).first()).toBeVisible({ timeout: 30_000 })
      deletedInUi = true

      await page.getByPlaceholder(/^Search$/).fill(title)
      await expect(page.getByRole('row', { name: new RegExp(escapeRegExp(title)) })).toHaveCount(0, { timeout: 30_000 })
    } finally {
      if (!deletedInUi) await deleteReview(ownerApi, id)
    }
  })
})
