import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createControl, createReview, createVendor, deleteControl, deleteReview, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const openControlReview = async (page: Page, id: string) => {
  await page.goto(`/exposure/reviews?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 60_000 })
  await expect(sheet.getByText('Reviewed Controls', { exact: true })).toBeVisible({ timeout: 60_000 })
  return sheet
}

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
      await sheet.getByRole('button', { name: /^Save( Changes)?$/ }).click()

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

test.describe('exposure — a review resolves to the sheet its subject calls for', () => {
  test('a control-linked review opens the control review body, not the generic sheet', async ({ page }) => {
    test.slow()
    const refCode = uniqueName('E2E-REV-CTL')
    const controlId = await createControl(ownerApi, refCode)
    const reviewId = await createReview(ownerApi, uniqueName('E2E Control Review'), { controlIDs: [controlId] })

    try {
      const sheet = await openControlReview(page, reviewId)
      await expect(sheet.getByText(refCode, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
      await expect(sheet.getByRole('button', { name: /^Copy link$/ })).toHaveCount(0)
    } finally {
      await deleteReview(ownerApi, reviewId)
      await deleteControl(ownerApi, controlId)
    }
  })

  test('a review with no subject falls back to the generic review sheet', async ({ page }) => {
    test.slow()
    const reviewId = await createReview(ownerApi, uniqueName('E2E Plain Review'))

    try {
      const sheet = await openReview(page, reviewId)
      await expect(sheet.getByRole('button', { name: /^Copy link$/ })).toBeVisible({ timeout: 30_000 })
      await expect(sheet.getByText('Reviewed Controls', { exact: true })).toBeHidden()
    } finally {
      await deleteReview(ownerApi, reviewId)
    }
  })

  test('the control review body survives a reload of the deep link', async ({ page }) => {
    test.slow()
    const refCode = uniqueName('E2E-REV-RELOAD')
    const controlId = await createControl(ownerApi, refCode)
    const reviewId = await createReview(ownerApi, uniqueName('E2E Reload Review'), { controlIDs: [controlId] })

    try {
      await openControlReview(page, reviewId)
      await page.reload({ waitUntil: 'domcontentloaded' })

      const reopened = page.getByRole('dialog')
      await expect(reopened).toBeVisible({ timeout: 60_000 })
      await expect(reopened.getByText('Reviewed Controls', { exact: true })).toBeVisible({ timeout: 60_000 })
    } finally {
      await deleteReview(ownerApi, reviewId)
      await deleteControl(ownerApi, controlId)
    }
  })
})

test.describe('exposure — review Type filter (ISS-2748)', () => {
  test('filtering by Control keeps a control review and drops a vendor review', async ({ page }) => {
    test.slow()
    const marker = uniqueName('E2E RevType')
    const refCode = `${marker}-CTL`
    const controlId = await createControl(ownerApi, refCode)
    const vendorId = await createVendor(ownerApi, `${marker} vendor`)

    const controlReviewTitle = `${marker} control review`
    const vendorReviewTitle = `${marker} vendor review`
    const controlReviewId = await createReview(ownerApi, controlReviewTitle, { controlIDs: [controlId] })
    const vendorReviewId = await createReview(ownerApi, vendorReviewTitle, { entityIDs: [vendorId] })

    try {
      await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 30_000 })

      await page.getByPlaceholder(/^Search$/).fill(marker)
      await expect(page.getByRole('cell').filter({ hasText: controlReviewTitle }).first()).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('cell').filter({ hasText: vendorReviewTitle }).first()).toBeVisible({ timeout: 30_000 })

      await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
      const panel = page.getByRole('menu').last()
      await panel.getByText('Type', { exact: true }).click()

      const controlOption = panel
        .getByRole('option')
        .filter({ hasText: /^Control$/ })
        .first()
      await expect(controlOption).toBeVisible({ timeout: 15_000 })
      await controlOption.click()
      await page.getByRole('button', { name: /^View Results$/ }).click()

      await expect(page.getByRole('cell').filter({ hasText: controlReviewTitle }).first()).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('cell').filter({ hasText: vendorReviewTitle })).toHaveCount(0, { timeout: 30_000 })
    } finally {
      await deleteReview(ownerApi, controlReviewId)
      await deleteReview(ownerApi, vendorReviewId)
      await deleteControl(ownerApi, controlId)
    }
  })
})
