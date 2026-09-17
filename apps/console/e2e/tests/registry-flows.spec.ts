import { test, expect } from '../fixtures/auth'
import { createAsset, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let ownerApi: ApiSession
let assetId: string
let originalName: string
let updatedName: string
let identifier: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  originalName = uniqueName('E2E Asset lifecycle')
  updatedName = uniqueName('E2E Asset persisted')
  identifier = uniqueRef('asset-lifecycle')
  assetId = await createAsset(ownerApi, originalName)
})

test.afterAll(async () => {
  if (!assetId) return
  await gql(ownerApi, `mutation($ids: [ID!]!){ deleteBulkAsset(ids: $ids){ deletedIDs } }`, { ids: [assetId] })
})

test('asset lifecycle persists edited metadata through search before deletion', async ({ page }) => {
  test.slow()

  await page.goto('/registry/assets', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Assets$/ })).toBeVisible({ timeout: 30_000 })

  const search = page.getByPlaceholder(/^Search$/)
  await search.fill(originalName)

  const originalRow = page.getByRole('row', { name: new RegExp(escapeRegExp(originalName)) })
  await expect(originalRow).toBeVisible({ timeout: 20_000 })
  await originalRow.getByRole('cell').filter({ hasText: originalName }).first().click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 20_000 })
  await sheet
    .getByRole('button', { name: /^Edit$/ })
    .first()
    .click()
  await sheet.getByLabel('Identifier', { exact: true }).fill(identifier)
  await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

  await expect(page.getByText('Asset Updated', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(sheet).toBeVisible({ timeout: 30_000 })
  await expect(sheet.getByText(identifier, { exact: true }).first()).toBeVisible({ timeout: 20_000 })
  await expect(sheet.getByText(identifier, { exact: true }).first()).toBeVisible({ timeout: 20_000 })

  await sheet.getByLabel('Close detail sheet').click()
  await expect(sheet).toBeHidden({ timeout: 15_000 })

  await page.goto('/registry/assets', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const search2 = page.getByPlaceholder(/^Search$/)
  await search2.fill(originalName)

  const updatedRow = page.getByRole('row', { name: new RegExp(escapeRegExp(originalName)) })
  await expect(updatedRow).toBeVisible({ timeout: 30_000 })
  await updatedRow.getByRole('cell').filter({ hasText: originalName }).first().click()

  await expect(sheet).toBeVisible({ timeout: 20_000 })
  await sheet.getByRole('button', { name: /^Delete$/ }).click()

  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation.getByRole('heading', { name: /^Delete Asset$/ })).toBeVisible({ timeout: 10_000 })
  await confirmation.getByRole('button', { name: /^Delete$/ }).click()

  await expect(page.getByText('Asset deleted successfully.', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
  await search.fill(updatedName)
  await expect(page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) })).toHaveCount(0, { timeout: 20_000 })
})
