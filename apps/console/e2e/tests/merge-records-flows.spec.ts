import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createIdentityHolder, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const PERSONNEL_ROUTE = '/registry/personnel'

const MERGE_MODE_BANNER = 'Merge mode: drag a record onto the one you want to keep.'

const emailFor = (name: string) => `${name.replace(/[^a-z0-9]/gi, '').toLowerCase()}@e2e-openlane.dev`

let ownerApi: ApiSession

const revealMenuItem = async (trigger: Locator, item: Locator, attempts = 15) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (await item.isVisible().catch(() => false)) return
    if ((await trigger.getAttribute('aria-expanded').catch(() => null)) !== 'true') {
      await trigger.click({ timeout: 20_000 }).catch(() => {})
    }
    await item.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {})
  }
  await expect(item).toBeVisible({ timeout: 15_000 })
}

const openDetailMergeSheet = async (page: Page, id: string) => {
  await page.goto(`/registry/personnel/${id}`, { waitUntil: 'domcontentloaded', timeout: 300_000 })

  const edit = page.getByRole('button', { name: 'Edit personnel', exact: true })
  await expect(edit).toBeVisible({ timeout: 300_000 })

  const slideBar = page.getByRole('button', { name: 'Close slide bar' })
  if (await slideBar.isVisible().catch(() => false)) {
    await slideBar.click()
    await expect(slideBar)
      .toBeHidden({ timeout: 15_000 })
      .catch(() => {})
  }

  const trigger = edit.locator('xpath=following-sibling::button[1]').first()
  await expect(trigger).toBeVisible({ timeout: 60_000 })

  const mergeItem = page.getByRole('button', { name: 'Merge with…', exact: true })
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (await mergeItem.isVisible().catch(() => false)) break
    await trigger.click()
    await mergeItem.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {})
  }
  await expect(mergeItem).toBeVisible({ timeout: 30_000 })
  await mergeItem.click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText('Merge personnel record', { exact: true })).toBeVisible({ timeout: 30_000 })
  return sheet
}

const openPersonnelTable = async (page: Page) => {
  await page.goto(PERSONNEL_ROUTE, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const action = page.getByRole('button', { name: 'Action', exact: true })
  await expect(action).toBeVisible({ timeout: 180_000 })
  return action
}

const enterMergeMode = async (page: Page) => {
  const action = await openPersonnelTable(page)
  const item = page.getByRole('button', { name: 'Merge records', exact: true })
  await revealMenuItem(action, item)
  await item.click()
  await expect(page.getByText(MERGE_MODE_BANNER)).toBeVisible({ timeout: 30_000 })
}

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('merge records — merge mode on the personnel table', () => {
  test('the table action menu offers merge records to an owner', async ({ page }) => {
    const action = await openPersonnelTable(page)
    await revealMenuItem(action, page.getByRole('button', { name: 'Merge records', exact: true }))
    await expect(page.getByText(MERGE_MODE_BANNER)).toBeHidden()
  })

  test('entering merge mode announces the drag instruction in a live region', async ({ page }) => {
    await enterMergeMode(page)
    const status = page.locator('[role="status"]').filter({ hasText: MERGE_MODE_BANNER })
    await expect(status).toBeVisible({ timeout: 15_000 })
    await expect(status).toHaveAttribute('aria-live', 'polite')
  })

  test('merge mode hides the ordinary table actions and offers a way out', async ({ page }) => {
    await enterMergeMode(page)
    await expect(page.getByRole('button', { name: 'Exit merge mode', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Action', exact: true })).toBeHidden({ timeout: 15_000 })
  })

  test('exiting merge mode restores the table actions and clears the banner', async ({ page }) => {
    await enterMergeMode(page)
    await page.getByRole('button', { name: 'Exit merge mode', exact: true }).click()

    await expect(page.getByText(MERGE_MODE_BANNER)).toBeHidden({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Action', exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('merge mode does not survive a reload', async ({ page }) => {
    await enterMergeMode(page)
    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('button', { name: 'Action', exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(MERGE_MODE_BANNER)).toBeHidden({ timeout: 15_000 })
  })
})

test.describe('merge records — merge sheet from a personnel record', () => {
  test.describe.configure({ mode: 'serial' })

  test('the merge sheet opens with the primary record and an empty secondary', async ({ page }) => {
    const name = uniqueName('E2E Merge Primary')
    const id = await createIdentityHolder(ownerApi, name, emailFor(name))

    const sheet = await openDetailMergeSheet(page, id)
    await expect(sheet.getByText('Records', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText('Primary', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText('Secondary', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the merge sheet spells out what happens to each side before anything is picked', async ({ page }) => {
    const name = uniqueName('E2E Merge Copy')
    const id = await createIdentityHolder(ownerApi, name, emailFor(name))

    const sheet = await openDetailMergeSheet(page, id)
    await expect(sheet.getByText('Kept; receives merged values', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByText('Deleted after merge', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText('Select a personnel record to merge…', { exact: true })).toBeVisible({ timeout: 15_000 })
  })
})
