import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const sheet = (page: Page): Locator => page.getByRole('dialog')

const EMPTY_STATE = 'No Implementations found for this Control.'

const openImplementations = async (page: Page) => {
  const { sharedControlId } = readManifest()
  await page.goto(`/controls/${sharedControlId}/control-implementation`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Control Implementations' }).or(page.getByText(EMPTY_STATE))).toBeVisible({ timeout: 60_000 })
}

const startCreate = async (page: Page) => {
  const emptyState = page.getByText('Create a new one')
  const toolbar = page.getByRole('button', { name: /^Create$/ }).first()
  await emptyState.or(toolbar).first().click()
}

const openItemAction = async (page: Page, action: 'Edit' | 'Delete' | 'Mark Verified' | 'Mark Not Verified') => {
  await page.getByRole('button', { name: 'Implementation actions' }).last().click()
  await page.getByRole('button', { name: action, exact: true }).click()
}

/**
 * Implementations render no identifying text of their own, so a test can only
 * reach one through its actions menu. Serial mode keeps exactly one on the
 * page at a time.
 */
const createImplementation = async (page: Page) => {
  await startCreate(page)
  await expect(sheet(page).getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
  await sheet(page)
    .getByRole('button', { name: /^Create$/ })
    .click()
  await expect(toast(page, 'Control Implementation created')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('button', { name: 'Implementation actions' }).last()).toBeVisible({ timeout: 30_000 })
}

test.describe('controls — control implementations (seeded control)', () => {
  test.describe.configure({ mode: 'serial' })

  test('an implementation can be created, edited and deleted', async ({ page }) => {
    test.slow()
    await openImplementations(page)

    await createImplementation(page)

    await openItemAction(page, 'Edit')
    await expect(sheet(page).getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 30_000 })
    await sheet(page).getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(page, 'Control Implementation updated')).toBeVisible({ timeout: 60_000 })

    await openItemAction(page, 'Delete')
    await expect(toast(page, 'Control Implementation deleted')).toBeVisible({ timeout: 60_000 })
  })

  test('an implementation can be marked verified and back again', async ({ page }) => {
    test.slow()
    await openImplementations(page)

    await createImplementation(page)

    await openItemAction(page, 'Mark Verified')
    await expect(toast(page, 'Marked as verified')).toBeVisible({ timeout: 60_000 })

    await openItemAction(page, 'Mark Not Verified')
    await expect(toast(page, 'Marked as not verified')).toBeVisible({ timeout: 60_000 })

    await openItemAction(page, 'Delete')
    await expect(toast(page, 'Control Implementation deleted')).toBeVisible({ timeout: 60_000 })
  })

  test('the create sheet offers the status selector and implementation date', async ({ page }) => {
    test.slow()
    await openImplementations(page)

    await startCreate(page)

    const form = sheet(page)
    await expect(form.getByText('Details', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(form.getByText('Status', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(form.getByText('Date Implemented', { exact: true })).toBeVisible({ timeout: 15_000 })
  })
})
