import { addDays, format } from 'date-fns'
import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import type { ApiSession } from '../utils/api'
import { createApiToken, createPersonalAccessToken, deleteApiToken, deletePersonalAccessToken, getAutomationApi, getOwnerOrganization } from '../utils/api-automation'
import { uniqueName } from '../utils/unique'

test.use({ viewport: { width: 1440, height: 1400 } })

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, name: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })

const openTokens = async (page: Page, type: 'api-tokens' | 'personal-access-tokens'): Promise<void> => {
  await page.goto(`/developers/${type}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: type === 'api-tokens' ? 'API Tokens' : 'Personal Access Tokens' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: /^Filter(?: \d+)?$/ })).toBeVisible({ timeout: 30_000 })
}

const resetTokenFilters = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /^Filter(?: \d+)?$/ }).click()
  await page.getByRole('button', { name: 'Reset filters' }).click()
}

const applyNameFilter = async (page: Page, name: string): Promise<void> => {
  await resetTokenFilters(page)
  await page.getByRole('button', { name: /^Filter$/ }).click()
  await page.getByRole('menu').getByRole('button', { name: 'Name' }).click()
  await page.getByPlaceholder('Enter Name').fill(name)
  await page.getByRole('button', { name: 'View Results' }).click()
}

const calendarDayName = (date: Date): RegExp => new RegExp(`${format(date, 'MMMM do')}, ${date.getFullYear()}$`, 'i')

const chooseRangeDate = async (page: Page, endpoint: 'From' | 'To', date: Date): Promise<void> => {
  await page
    .getByText(endpoint, { exact: true })
    .locator('..')
    .getByRole('button', { name: calendarDayName(date) })
    .click()
}

const openTokenEditor = async (page: Page, name: string) => {
  await page.getByRole('button', { name: `Token actions for ${name}` }).click()
  await page.getByRole('menuitem', { name: 'Edit' }).click()
  const dialog = page.getByRole('dialog', { name: 'Edit token' })
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  return dialog
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('API token edit persists description, expiry, and implied permission scopes while keeping the name disabled', async ({ page }) => {
  const name = uniqueName('E2E API token edit')
  const originalDescription = uniqueName('E2E API token original description')
  const updatedDescription = uniqueName('E2E API token updated description')
  const updatedExpiry = format(addDays(new Date(), 180), 'yyyy-MM-dd')
  const id = await createApiToken(ownerApi, name, {
    description: originalDescription,
    expiresAt: addDays(new Date(), 90).toISOString(),
    scopes: ['task:read'],
  })

  try {
    await openTokens(page, 'api-tokens')
    await applyNameFilter(page, name)
    await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })

    const dialog = await openTokenEditor(page, name)
    await expect(dialog.getByPlaceholder('Enter token name')).toBeDisabled()
    await expect(dialog.getByPlaceholder('Enter token name')).toHaveValue(name)
    await dialog.getByPlaceholder('Enter a description (optional)').fill(updatedDescription)
    await dialog.getByLabel('Expiration').fill(updatedExpiry)
    await dialog.getByPlaceholder('Filter permissions...').fill('task')
    await dialog.getByRole('button', { name: /^Task\b/ }).click()
    await dialog.getByRole('checkbox', { name: 'task:write' }).check()
    await expect(dialog.getByRole('checkbox', { name: 'task:read' })).toBeChecked()
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Token updated successfully!', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await applyNameFilter(page, name)
    await expect(rowFor(page, name)).toContainText(updatedDescription, { timeout: 20_000 })
    const persistedDialog = await openTokenEditor(page, name)
    await expect(persistedDialog.getByPlaceholder('Enter token name')).toBeDisabled()
    await expect(persistedDialog.getByPlaceholder('Enter a description (optional)')).toHaveValue(updatedDescription)
    await expect(persistedDialog.getByLabel('Expiration')).toHaveValue(updatedExpiry)
    await persistedDialog.getByPlaceholder('Filter permissions...').fill('task')
    await persistedDialog.getByRole('button', { name: /^Task\b/ }).click()
    await expect(persistedDialog.getByRole('checkbox', { name: 'task:read' })).toBeChecked()
    await expect(persistedDialog.getByRole('checkbox', { name: 'task:write' })).toBeChecked()
  } finally {
    await deleteApiToken(ownerApi, id)
  }
})

test('API token expiry range combines with name filtering and excludes an out-of-range token', async ({ page }) => {
  const prefix = uniqueName('E2E API token expiry filter')
  const inRangeName = `${prefix} in range`
  const outOfRangeName = `${prefix} out of range`
  const filterDate = addDays(new Date(), 3)
  const ids = [
    await createApiToken(ownerApi, inRangeName, { expiresAt: filterDate.toISOString(), scopes: ['task:read'] }),
    await createApiToken(ownerApi, outOfRangeName, { expiresAt: addDays(new Date(), 60).toISOString(), scopes: ['task:read'] }),
  ]

  try {
    await openTokens(page, 'api-tokens')
    await resetTokenFilters(page)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Name' }).click()
    await page.getByPlaceholder('Enter Name').fill(prefix)
    await page.getByRole('menu').getByRole('button', { name: 'Expires At' }).click()
    await page.getByRole('button', { name: 'Pick date range' }).click()
    await chooseRangeDate(page, 'From', filterDate)
    await chooseRangeDate(page, 'To', filterDate)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'View Results' }).click()

    await expect(rowFor(page, inRangeName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, outOfRangeName)).toHaveCount(0)
  } finally {
    for (const id of ids) await deleteApiToken(ownerApi, id)
  }
})

test('API token sorting activates for every sort field that has a rendered column', async ({ page }) => {
  const name = uniqueName('E2E API token sorting')
  const id = await createApiToken(ownerApi, name, { expiresAt: addDays(new Date(), 90).toISOString(), scopes: ['task:read'] })

  try {
    await openTokens(page, 'api-tokens')
    await applyNameFilter(page, name)
    await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })

    for (const headerName of ['Name', 'Expires', 'Last used']) {
      const header = page.getByRole('columnheader', { name: new RegExp(`^${headerName}\\b`, 'i') })
      await expect(header).toBeVisible({ timeout: 30_000 })
      await header.getByRole('button', { name: headerName, exact: true }).click()
      await expect(header).not.toHaveAttribute('aria-sort', 'none')
    }
  } finally {
    await deleteApiToken(ownerApi, id)
  }
})

test('personal access token name filter isolates the matching seeded token', async ({ page }) => {
  const wanted = uniqueName('E2E PAT search wanted')
  const other = uniqueName('E2E PAT search other')
  const ids = [await createPersonalAccessToken(ownerApi, wanted), await createPersonalAccessToken(ownerApi, other)]

  try {
    await openTokens(page, 'personal-access-tokens')
    await applyNameFilter(page, wanted)
    await expect(rowFor(page, wanted)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, other)).toHaveCount(0)
  } finally {
    for (const id of ids) await deletePersonalAccessToken(ownerApi, id)
  }
})

test('personal access token expiry range combines with name filtering and excludes an out-of-range token', async ({ page }) => {
  const prefix = uniqueName('E2E PAT expiry filter')
  const inRangeName = `${prefix} in range`
  const outOfRangeName = `${prefix} out of range`
  const filterDate = addDays(new Date(), 3)
  const ids = [
    await createPersonalAccessToken(ownerApi, inRangeName, { expiresAt: filterDate.toISOString() }),
    await createPersonalAccessToken(ownerApi, outOfRangeName, { expiresAt: addDays(new Date(), 60).toISOString() }),
  ]

  try {
    await openTokens(page, 'personal-access-tokens')
    await resetTokenFilters(page)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Name' }).click()
    await page.getByPlaceholder('Enter Name').fill(prefix)
    await page.getByRole('menu').getByRole('button', { name: 'Expires At' }).click()
    await page.getByRole('button', { name: 'Pick date range' }).click()
    await chooseRangeDate(page, 'From', filterDate)
    await chooseRangeDate(page, 'To', filterDate)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'View Results' }).click()

    await expect(rowFor(page, inRangeName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, outOfRangeName)).toHaveCount(0)
  } finally {
    for (const id of ids) await deletePersonalAccessToken(ownerApi, id)
  }
})

test('personal access token edit persists description, expiry, and its authorized organization', async ({ page }) => {
  const organization = await getOwnerOrganization(ownerApi)
  const name = uniqueName('E2E PAT edit')
  const updatedDescription = uniqueName('E2E PAT updated description')
  const updatedExpiry = format(addDays(new Date(), 120), 'yyyy-MM-dd')
  const id = await createPersonalAccessToken(ownerApi, name, {
    description: uniqueName('E2E PAT original description'),
    expiresAt: addDays(new Date(), 60).toISOString(),
    organizationIDs: [organization.id],
  })

  try {
    await openTokens(page, 'personal-access-tokens')
    await applyNameFilter(page, name)
    await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })

    const dialog = await openTokenEditor(page, name)
    await expect(dialog.getByPlaceholder('Enter token name')).toBeDisabled()
    await dialog.getByPlaceholder('Enter a description (optional)').fill(updatedDescription)
    await dialog.getByLabel('Expiration').fill(updatedExpiry)
    const organizations = dialog.getByRole('button', { name: new RegExp(escapeRegExp(organization.name)) })
    await expect(organizations).toBeVisible({ timeout: 30_000 })
    await organizations.click()
    await expect(page.getByRole('menuitemcheckbox', { name: new RegExp(escapeRegExp(organization.name)) })).toBeChecked()
    await page.keyboard.press('Escape')
    await dialog.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Token updated successfully!', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await applyNameFilter(page, name)
    await expect(rowFor(page, name)).toContainText(updatedDescription, { timeout: 20_000 })
    const persistedDialog = await openTokenEditor(page, name)
    await expect(persistedDialog.getByPlaceholder('Enter token name')).toHaveValue(name)
    await expect(persistedDialog.getByPlaceholder('Enter token name')).toBeDisabled()
    await expect(persistedDialog.getByPlaceholder('Enter a description (optional)')).toHaveValue(updatedDescription)
    await expect(persistedDialog.getByLabel('Expiration')).toHaveValue(updatedExpiry)
    const persistedOrganizations = persistedDialog.getByRole('button', { name: new RegExp(escapeRegExp(organization.name)) })
    await persistedOrganizations.click()
    await expect(page.getByRole('menuitemcheckbox', { name: new RegExp(escapeRegExp(organization.name)) })).toBeChecked()
  } finally {
    await deletePersonalAccessToken(ownerApi, id)
  }
})

test.fixme('personal access token pagination moves between filtered result pages', async ({ page }) => {
  test.info().annotations.push({
    type: 'product-gap',
    description: 'The token GraphQL documents omit first/after/last/before, so a next-page request returns the same rows. The page indicator advances but the result set does not.',
  })
  const prefix = uniqueName('E2E PAT pagination')
  const names = Array.from({ length: 6 }, (_, index) => `${prefix} ${String(index + 1).padStart(2, '0')}`)
  const ids = await Promise.all(names.map((name) => createPersonalAccessToken(ownerApi, name)))

  try {
    await openTokens(page, 'personal-access-tokens')
    await applyNameFilter(page, prefix)
    const pageSize = page.getByText('Rows per page', { exact: true }).locator('..').getByRole('combobox')
    await pageSize.click()
    await page.getByRole('option', { name: '5', exact: true }).click()

    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('row').filter({ hasText: prefix })).toHaveCount(5, { timeout: 20_000 })
    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByText('Page 2 of 2')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('row').filter({ hasText: prefix })).toHaveCount(1, { timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()

    await page.getByRole('button', { name: 'Previous page' }).click()
    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 20_000 })
  } finally {
    for (const id of ids) await deletePersonalAccessToken(ownerApi, id)
  }
})
