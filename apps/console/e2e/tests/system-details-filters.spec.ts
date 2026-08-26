import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createSystemDetail, deleteSystemDetail, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, name: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })

const openSystemDetails = async (page: Page) => {
  await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 30_000 })
}

const applyMultiselectFilter = async (page: Page, field: string, option: string) => {
  await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible({ timeout: 20_000 })
  await menu.getByRole('button', { name: field, exact: true }).click()
  await menu.getByRole('checkbox', { name: option }).click()
  await menu.getByRole('button', { name: /^View Results$/ }).click()
  await expect(menu).toBeHidden({ timeout: 20_000 })
}

let ownerApi: ApiSession
let prefix: string
let highName: string
let lowName: string
let highId: string
let lowId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  prefix = uniqueName('E2E System')
  highName = `${prefix} High`
  lowName = `${prefix} Low`
  highId = await createSystemDetail(ownerApi, highName, { sensitivityLevel: 'HIGH', tags: ['e2e-high'] })
  lowId = await createSystemDetail(ownerApi, lowName, { sensitivityLevel: 'LOW', tags: ['e2e-low'] })
})

test.afterAll(async () => {
  if (highId) await deleteSystemDetail(ownerApi, highId)
  if (lowId) await deleteSystemDetail(ownerApi, lowId)
})

test.describe('registry — system details filters', () => {
  test('both seeded systems are found by the shared search prefix', async ({ page }) => {
    test.slow()
    await openSystemDetails(page)
    await page.getByPlaceholder(/^Search$/).fill(prefix)

    await expect(rowFor(page, highName)).toBeVisible({ timeout: 30_000 })
    await expect(rowFor(page, lowName)).toBeVisible({ timeout: 30_000 })
  })

  test('the Sensitivity Level filter keeps only the matching system', async ({ page }) => {
    test.slow()
    await openSystemDetails(page)
    await page.getByPlaceholder(/^Search$/).fill(prefix)
    await expect(rowFor(page, highName)).toBeVisible({ timeout: 30_000 })

    await applyMultiselectFilter(page, 'Sensitivity Level', 'High')

    await expect(page.getByRole('button', { name: 'Filter 1' })).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, highName)).toBeVisible({ timeout: 30_000 })
    await expect(rowFor(page, lowName)).toHaveCount(0, { timeout: 30_000 })
  })

  test('the filter panel exposes the Tags field alongside Sensitivity Level', async ({ page }) => {
    test.slow()
    await openSystemDetails(page)

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 20_000 })
    await expect(menu.getByText('Sensitivity Level', { exact: true })).toBeVisible()
    await expect(menu.getByText('Tags', { exact: true })).toBeVisible()
  })
})
