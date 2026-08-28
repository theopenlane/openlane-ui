import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'

const openControlsTable = async (page: Page) => {
  await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const tableView = page.getByRole('button', { name: 'Table', exact: true })
  await expect(tableView).toBeVisible({ timeout: 60_000 })
  await tableView.click()
  await expect(page.getByRole('button', { name: /^Columns$/ })).toBeVisible({ timeout: 60_000 })
}

const headerNames = async (page: Page): Promise<string[]> => {
  await expect(page.getByRole('columnheader').first()).toBeVisible({ timeout: 30_000 })
  return (await page.getByRole('columnheader').allInnerTexts()).map((t) => t.trim()).filter(Boolean)
}

const toggleFirstColumn = async (page: Page) => {
  await page.getByRole('button', { name: /^Columns$/ }).click()
  const toggle = page.getByRole('checkbox').first()
  await expect(toggle).toBeVisible({ timeout: 15_000 })
  await toggle.click()
  await page.keyboard.press('Escape')
}

test.describe('tables — column visibility survives a reload', () => {
  test('toggling a column changes exactly one header and the change survives a reload', async ({ page }) => {
    test.slow()
    await openControlsTable(page)

    const before = await headerNames(page)
    await toggleFirstColumn(page)

    await expect.poll(async () => (await headerNames(page)).join('|'), { timeout: 15_000 }).not.toBe(before.join('|'))

    const after = await headerNames(page)
    const changed = [...before.filter((h) => !after.includes(h)), ...after.filter((h) => !before.includes(h))]
    expect(changed, 'exactly one header should appear or disappear').toHaveLength(1)

    await openControlsTable(page)
    expect(await headerNames(page)).toEqual(after)

    await toggleFirstColumn(page)
    await expect.poll(async () => (await headerNames(page)).join('|'), { timeout: 15_000 }).toBe(before.join('|'))

    await openControlsTable(page)
    expect(await headerNames(page)).toEqual(before)
  })
})

test.describe('tables — a search term survives navigating away', () => {
  test('the controls search box is repopulated on return', async ({ page }) => {
    test.slow()
    await openControlsTable(page)

    const search = page.getByPlaceholder(/search/i).first()
    await expect(search).toBeVisible({ timeout: 30_000 })
    await search.fill('E2E-CTRL')
    await expect(search).toHaveValue('E2E-CTRL')

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await openControlsTable(page)

    await expect(page.getByPlaceholder(/search/i).first()).toHaveValue('E2E-CTRL', { timeout: 30_000 })
  })
})
