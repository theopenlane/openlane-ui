import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createSubscriber, deleteSubscriber, getOwnerApi, type ApiSession } from '../utils/api'
import { EMAIL_DOMAIN } from '../utils/constants'
import { inlineCsv } from '../utils/files'
import { uniqueRef } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const subscriberEmail = (): string => `${uniqueRef('e2e-sub').toLowerCase()}@${EMAIL_DOMAIN}`

const rowFor = (page: Page, email: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(email)) })

const openSubscribers = async (page: Page) => {
  await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 30_000 })
  await resetFilters(page)
}

const openFilterMenu = async (page: Page) => {
  await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible({ timeout: 15_000 })
  return menu
}

const resetFilters = async (page: Page) => {
  const menu = await openFilterMenu(page)
  await menu.getByRole('button', { name: /^Reset filters$/ }).click()
  await expect(menu).toBeHidden({ timeout: 15_000 })
}

const applyBooleanFilter = async (page: Page, label: string) => {
  const menu = await openFilterMenu(page)
  const trigger = menu.getByRole('button', { name: label, exact: true })
  if ((await trigger.getAttribute('data-state')) !== 'open') await trigger.click()
  const toggle = menu.getByRole('switch')
  await expect(toggle).toBeVisible({ timeout: 15_000 })
  await toggle.click()
  await menu.getByRole('button', { name: /^View Results$/ }).click()
  await expect(menu).toBeHidden({ timeout: 15_000 })
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('organization settings — subscribers', () => {
  test('search narrows the subscriber table to the matching seeded address', async ({ page }) => {
    test.slow()
    const wanted = subscriberEmail()
    const other = subscriberEmail()
    await Promise.all([createSubscriber(ownerApi, wanted), createSubscriber(ownerApi, other)])

    try {
      await openSubscribers(page)
      await page.getByPlaceholder('Search').fill(wanted)

      await expect(rowFor(page, wanted)).toBeVisible({ timeout: 20_000 })
      await expect(rowFor(page, other)).toHaveCount(0, { timeout: 20_000 })
    } finally {
      await Promise.all([deleteSubscriber(ownerApi, wanted), deleteSubscriber(ownerApi, other)])
    }
  })

  test('the Active filter excludes a subscriber that has not confirmed its email', async ({ page }) => {
    test.slow()
    const email = subscriberEmail()
    await createSubscriber(ownerApi, email)

    try {
      await openSubscribers(page)
      await page.getByPlaceholder('Search').fill(email)
      await expect(rowFor(page, email)).toBeVisible({ timeout: 20_000 })

      await applyBooleanFilter(page, 'Active')
      await expect(page.getByRole('button', { name: 'Filter 1' })).toBeVisible({ timeout: 15_000 })
      await expect(rowFor(page, email)).toHaveCount(0, { timeout: 20_000 })

      await applyBooleanFilter(page, 'Active')
      await expect(rowFor(page, email)).toBeVisible({ timeout: 20_000 })
    } finally {
      await deleteSubscriber(ownerApi, email)
    }
  })

  test('the Verified filter excludes an unverified subscriber', async ({ page }) => {
    test.slow()
    const email = subscriberEmail()
    await createSubscriber(ownerApi, email)

    try {
      await openSubscribers(page)
      await page.getByPlaceholder('Search').fill(email)
      await expect(rowFor(page, email)).toBeVisible({ timeout: 20_000 })

      await applyBooleanFilter(page, 'Verified')
      await expect(rowFor(page, email)).toHaveCount(0, { timeout: 20_000 })

      await applyBooleanFilter(page, 'Verified')
      await expect(rowFor(page, email)).toBeVisible({ timeout: 20_000 })
    } finally {
      await deleteSubscriber(ownerApi, email)
    }
  })

  test('the Email text filter narrows the table to one seeded address', async ({ page }) => {
    test.slow()
    const wanted = subscriberEmail()
    const other = subscriberEmail()
    await Promise.all([createSubscriber(ownerApi, wanted), createSubscriber(ownerApi, other)])

    try {
      await openSubscribers(page)

      await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
      const menu = page.getByRole('menu')
      await expect(menu).toBeVisible({ timeout: 15_000 })
      await menu.getByRole('button', { name: 'Email', exact: true }).click()
      await menu.getByPlaceholder('Enter Email').fill(wanted)
      await menu.getByRole('button', { name: /^View Results$/ }).click()
      await expect(menu).toBeHidden({ timeout: 15_000 })

      await expect(rowFor(page, wanted)).toBeVisible({ timeout: 30_000 })
      await expect(rowFor(page, other)).toHaveCount(0, { timeout: 30_000 })
    } finally {
      await Promise.all([deleteSubscriber(ownerApi, wanted), deleteSubscriber(ownerApi, other)])
    }
  })

  test('bulk uploading a CSV creates the subscriber it names', async ({ page }) => {
    test.slow()
    const email = subscriberEmail()

    try {
      await openSubscribers(page)
      await page.getByRole('button', { name: 'Action' }).click()
      await page.getByRole('button', { name: /^Bulk Upload$/ }).click()

      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 15_000 })
      await dialog
        .locator('input[type="file"]')
        .first()
        .setInputFiles(inlineCsv('subscribers.csv', `email\n${email}\n`))

      const upload = dialog.getByRole('button', { name: /^Upload$/ })
      await expect(upload).toBeEnabled({ timeout: 15_000 })
      await upload.click()

      await expect(page.getByText('Subscribers Created', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

      await openSubscribers(page)
      await page.getByPlaceholder('Search').fill(email)
      await expect(rowFor(page, email)).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteSubscriber(ownerApi, email)
    }
  })

  test('a subscriber is removed through the row delete confirmation', async ({ page }) => {
    test.slow()
    const email = subscriberEmail()
    let deletedInUi = false
    await createSubscriber(ownerApi, email)

    try {
      await openSubscribers(page)
      await page.getByPlaceholder('Search').fill(email)

      const row = rowFor(page, email)
      await expect(row).toBeVisible({ timeout: 20_000 })
      await row.getByRole('button', { name: `Delete subscriber ${email}` }).click()

      const confirmation = page.getByRole('alertdialog')
      await expect(confirmation.getByRole('heading', { name: /^Delete Subscriber$/ })).toBeVisible({ timeout: 15_000 })
      await expect(confirmation).toContainText(email)
      await confirmation.getByRole('button', { name: /^Delete$/ }).click()

      await expect(page.getByText('Subscriber deleted successfully', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
      deletedInUi = true
      await expect(rowFor(page, email)).toHaveCount(0, { timeout: 20_000 })
    } finally {
      if (!deletedInUi) await deleteSubscriber(ownerApi, email)
    }
  })
})
