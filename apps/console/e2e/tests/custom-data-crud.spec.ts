import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, createTagDefinition, deleteCustomTypeEnum, deleteTagDefinition, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, name: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })

const openCustomData = async (page: Page, tab: 'tags' | 'enums') => {
  await page.goto(`/organization-settings/custom-data?tab=${tab}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByPlaceholder(tab === 'tags' ? 'Search tags...' : 'Search enums...')).toBeVisible({ timeout: 30_000 })
}

const openRowAction = async (page: Page, row: Locator, trigger: string, item: RegExp): Promise<void> => {
  const menuItem = page.getByRole('menuitem', { name: item })

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!(await menuItem.isVisible().catch(() => false))) {
      await row
        .getByRole('button', { name: trigger })
        .click()
        .catch(() => {})
    }
    try {
      await menuItem.click({ timeout: 5_000 })
      return
    } catch {
      continue
    }
  }

  await menuItem.click({ timeout: 15_000 })
}

const goToPage = async (page: Page, direction: 'Next page' | 'Previous page', expectedLabel: string): Promise<void> => {
  const button = page.getByRole('button', { name: direction })
  await expect
    .poll(
      async () => {
        const arrived = await page
          .getByText(expectedLabel)
          .isVisible()
          .catch(() => false)
        if (arrived) return true
        if (await button.isEnabled().catch(() => false)) await button.click()
        return false
      },
      { timeout: 30_000 },
    )
    .toBe(true)
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('custom data — custom tags', () => {
  test('a tag is created, edited and deleted from the tags tab', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Tag').toLowerCase()

    await openCustomData(page, 'tags')
    await page.getByRole('button', { name: /^Create Tag$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Create Custom Tag')).toBeVisible({ timeout: 20_000 })
    await sheet.getByPlaceholder('e.g. High Priority').fill(name)
    await sheet.getByPlaceholder('e.g. Critical, Urgent').fill('e2e-alias')
    await sheet.getByPlaceholder('Description...').fill('created by e2e')
    await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText('Tag created', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search tags...').fill(name)
    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await expect(row).toContainText('created by e2e')
    await expect(row).toContainText('e2e-alias')

    await openRowAction(page, row, `Tag actions for ${name}`, /^Edit Tag$/)

    await expect(sheet.getByPlaceholder('e.g. High Priority')).toHaveValue(name, { timeout: 20_000 })
    await expect(sheet.getByPlaceholder('e.g. High Priority')).toBeDisabled()
    await sheet.getByPlaceholder('Description...').fill('updated by e2e')
    await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText('Tag updated', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

    await openCustomData(page, 'tags')
    await page.getByPlaceholder('Search tags...').fill(name)
    const persisted = rowFor(page, name)
    await expect(persisted).toContainText('updated by e2e', { timeout: 20_000 })

    await openRowAction(page, persisted, `Tag actions for ${name}`, /^Delete Tag$/)

    const confirmation = page.getByRole('alertdialog')
    await expect(confirmation.getByRole('heading', { name: /^Delete Tag$/ })).toBeVisible({ timeout: 15_000 })
    await confirmation.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText('Tag Deleted', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })
  })

  test('search narrows the tag table to the matching seeded tag', async ({ page }) => {
    const wanted = uniqueName('E2E Tag wanted').toLowerCase()
    const other = uniqueName('E2E Tag other').toLowerCase()
    const ids = await Promise.all([createTagDefinition(ownerApi, wanted), createTagDefinition(ownerApi, other)])

    try {
      await openCustomData(page, 'tags')
      await page.getByPlaceholder('Search tags...').fill(wanted)

      await expect(rowFor(page, wanted)).toBeVisible({ timeout: 20_000 })
      await expect(rowFor(page, other)).toHaveCount(0, { timeout: 20_000 })
    } finally {
      await Promise.all(ids.map((id) => deleteTagDefinition(ownerApi, id)))
    }
  })

  test('the tag table paginates a searched set across two pages', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E TagPage').toLowerCase()
    const names = Array.from({ length: 11 }, (_, i) => `${prefix} ${i + 1}`)
    const ids: string[] = []
    for (const name of names) ids.push(await createTagDefinition(ownerApi, name))

    try {
      await openCustomData(page, 'tags')
      await page.getByPlaceholder('Search tags...').fill(prefix)

      await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 20_000 })
      const firstPage = await page.getByRole('row').allInnerTexts()

      await goToPage(page, 'Next page', 'Page 2 of 2')

      await expect.poll(async () => page.getByRole('row').allInnerTexts(), { timeout: 20_000 }).not.toEqual(firstPage)

      await goToPage(page, 'Previous page', 'Page 1 of 2')
    } finally {
      for (const id of ids) await deleteTagDefinition(ownerApi, id)
    }
  })
})

test.describe('custom data — custom enums', () => {
  test('an enum value is created and deleted from its edit sheet', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Enum')

    await openCustomData(page, 'enums')
    await page.getByRole('button', { name: /^Create Enum$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Create Environment Enum')).toBeVisible({ timeout: 20_000 })
    await sheet.getByLabel('Name', { exact: true }).fill(name)
    await sheet.getByLabel('Description', { exact: true }).fill('created by e2e')
    await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText('Enum created', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search enums...').fill(name)
    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await expect(row).toContainText('created by e2e')

    await openRowAction(page, row, `Enum actions for ${name}`, /^Edit Enum$/)

    await expect(sheet.getByText('Update Environment Enum')).toBeVisible({ timeout: 20_000 })
    await sheet.getByRole('button', { name: /^Delete$/ }).click()

    const confirmation = page.getByRole('alertdialog')
    await expect(confirmation.getByRole('heading', { name: /^Delete Enum Value$/ })).toBeVisible({ timeout: 15_000 })
    await confirmation.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText('Enum deleted', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })
  })

  test('an enum value is edited from its row action menu', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Enum edit')
    const id = await createCustomTypeEnum(ownerApi, name, 'environment')

    try {
      await openCustomData(page, 'enums')
      await page.getByPlaceholder('Search enums...').fill(name)

      const row = rowFor(page, name)
      await expect(row).toBeVisible({ timeout: 20_000 })
      await openRowAction(page, row, `Enum actions for ${name}`, /^Edit Enum$/)

      const sheet = page.getByRole('dialog')
      await expect(sheet.getByLabel('Name', { exact: true })).toBeDisabled({ timeout: 20_000 })
      await sheet.getByLabel('Description', { exact: true }).fill('updated by e2e')
      await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(page.getByText('Enum updated', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

      await openCustomData(page, 'enums')
      await page.getByPlaceholder('Search enums...').fill(name)
      await expect(rowFor(page, name)).toContainText('updated by e2e', { timeout: 20_000 })
    } finally {
      await deleteCustomTypeEnum(ownerApi, id)
    }
  })

  test('the group filter restricts the table to the selected enum group', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Enum grouped')
    const id = await createCustomTypeEnum(ownerApi, name, 'environment')

    try {
      await openCustomData(page, 'enums')
      await page.getByPlaceholder('Search enums...').fill(name)
      await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })

      await page.getByRole('combobox').filter({ hasText: 'environments' }).click()
      await page.getByRole('listbox').getByRole('option', { name: 'scopes' }).click()

      await expect(page.getByRole('combobox').filter({ hasText: 'scopes' })).toBeVisible({ timeout: 15_000 })
      await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })

      await page.getByRole('combobox').filter({ hasText: 'scopes' }).click()
      await page.getByRole('listbox').getByRole('option', { name: 'environments' }).click()

      await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })
    } finally {
      await deleteCustomTypeEnum(ownerApi, id)
    }
  })

  test('the enum table paginates a searched set across two pages', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E EnumPage')
    const ids: string[] = []
    for (let index = 1; index <= 11; index += 1) ids.push(await createCustomTypeEnum(ownerApi, `${prefix} ${index}`, 'environment'))

    try {
      await openCustomData(page, 'enums')
      await page.getByPlaceholder('Search enums...').fill(prefix)

      await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 30_000 })
      const firstPage = await page.getByRole('row').allInnerTexts()

      await goToPage(page, 'Next page', 'Page 2 of 2')
      await expect.poll(async () => page.getByRole('row').allInnerTexts(), { timeout: 30_000 }).not.toEqual(firstPage)
    } finally {
      for (const id of ids) await deleteCustomTypeEnum(ownerApi, id)
    }
  })

  test('hiding an enum column removes exactly that header and the change survives a reload', async ({ page }) => {
    test.slow()
    await openCustomData(page, 'enums')

    const headers = async (): Promise<string[]> => (await page.getByRole('columnheader').allInnerTexts()).map((text) => text.trim()).filter(Boolean)

    await expect.poll(async () => (await headers()).includes('Description'), { timeout: 30_000 }).toBe(true)
    const before = await headers()

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 15_000 })
    await menu.getByRole('checkbox', { name: 'Description' }).click()
    await page.keyboard.press('Escape')

    await expect
      .poll(
        async () => {
          const after = await headers()
          if (after.length === 0 || after.includes('Description')) return null
          return before.filter((header) => header !== 'Description').every((header) => after.includes(header))
        },
        { timeout: 20_000 },
      )
      .toBe(true)

    await openCustomData(page, 'enums')
    await expect.poll(async () => (await headers()).includes('Description'), { timeout: 30_000 }).toBe(false)

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await page.getByRole('menu').getByRole('checkbox', { name: 'Description' }).click()
    await page.keyboard.press('Escape')
    await expect.poll(async () => (await headers()).includes('Description'), { timeout: 20_000 }).toBe(true)
  })

  test('sorting by Name reverses the order of a searched enum set', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E EnumSort')
    const suffixes = ['Alpha', 'Bravo', 'Charlie']
    const ids: string[] = []
    for (const suffix of suffixes) ids.push(await createCustomTypeEnum(ownerApi, `${prefix} ${suffix}`, 'environment'))

    try {
      await openCustomData(page, 'enums')
      await page.getByPlaceholder('Search enums...').fill(prefix)

      const nameCells = page.getByRole('cell').filter({ hasText: prefix })
      const namesInOrder = async (): Promise<string[]> => (await nameCells.allInnerTexts()).map((text) => text.trim())

      const th = page.getByRole('columnheader').filter({ hasText: 'Name' }).first()
      await expect(th).toHaveAttribute('aria-sort', 'ascending', { timeout: 20_000 })
      await expect(nameCells).toHaveCount(suffixes.length, { timeout: 20_000 })
      expect(await namesInOrder()).toEqual(suffixes.map((suffix) => `${prefix} ${suffix}`))

      await page.getByRole('button', { name: 'Name', exact: true }).click()
      await expect(th).toHaveAttribute('aria-sort', 'descending', { timeout: 20_000 })

      await expect
        .poll(async () => (await namesInOrder()).join('|'), { timeout: 20_000 })
        .toBe(
          [...suffixes]
            .reverse()
            .map((suffix) => `${prefix} ${suffix}`)
            .join('|'),
        )
    } finally {
      for (const id of ids) await deleteCustomTypeEnum(ownerApi, id)
    }
  })
})
