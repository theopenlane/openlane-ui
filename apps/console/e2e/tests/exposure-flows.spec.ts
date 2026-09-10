import { test, expect } from '../fixtures/auth'
import { createRisk, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let ownerApi: ApiSession
let riskId: string
let originalName: string
let updatedName: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  originalName = uniqueName('E2E Risk lifecycle')
  updatedName = uniqueRef('E2E-Risk-persisted')
  riskId = await createRisk(ownerApi, originalName)
})

test.afterAll(async () => {
  if (!riskId) return
  await gql(ownerApi, `mutation($ids: [ID!]!){ deleteBulkRisk(ids: $ids){ deletedIDs } }`, { ids: [riskId] })
})

test('risk lifecycle persists full-form title and status edits before deletion', async ({ page }) => {
  test.slow()

  await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Risks$/ })).toBeVisible({ timeout: 30_000 })

  const search = page.getByPlaceholder(/^Search$/)
  await search.fill(originalName)

  const originalRow = page.getByRole('row', { name: new RegExp(escapeRegExp(originalName)) })
  await expect(originalRow).toBeVisible({ timeout: 20_000 })
  await originalRow.getByRole('cell').filter({ hasText: originalName }).first().click()

  await page.waitForURL(new RegExp(`/exposure/risks/${escapeRegExp(riskId)}(?:\\?|$)`), { timeout: 20_000 })
  await page.getByRole('button', { name: 'Edit risk' }).click()
  await page.getByRole('main').getByRole('textbox').first().fill(updatedName)

  const status = page
    .getByRole('main')
    .getByRole('combobox')
    .filter({ hasText: /^(Open|In Progress|Ongoing|Identified|Mitigated|Accepted|Closed|Transferred|Select)/ })
    .first()
  await expect(status).toBeVisible({ timeout: 15_000 })
  await status.click()
  await page.getByRole('option', { name: 'Mitigated', exact: true }).click()
  await expect(page.getByRole('option', { name: 'Mitigated', exact: true })).toBeHidden({ timeout: 10_000 })
  await page.getByRole('button', { name: /^Save Changes$/ }).click()

  await expect(page.getByText('Risk updated', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { level: 1, name: updatedName })).toBeVisible({ timeout: 45_000 })

  const statusLabel = page
    .getByRole('main')
    .locator('p', { hasText: /^Status$/ })
    .first()
  await expect(statusLabel.locator('xpath=following-sibling::*[1]')).toContainText('Mitigated', { timeout: 20_000 })

  await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await search.fill(originalName)
  await expect(page.getByRole('row', { name: new RegExp(escapeRegExp(originalName)) })).toHaveCount(0, { timeout: 20_000 })

  await search.fill(updatedName)
  const updatedRow = page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) })
  await expect(updatedRow).toBeVisible({ timeout: 20_000 })
  await updatedRow.getByRole('cell').filter({ hasText: updatedName }).first().click()

  await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 30_000 })
  await page.getByTestId('risk-actions-menu').click()
  await page.getByTestId('risk-delete-button').click()

  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation.getByRole('heading', { name: /^Delete Risk$/ })).toBeVisible({ timeout: 10_000 })
  await confirmation.getByRole('button', { name: /^Delete$/ }).click()

  await expect(page.getByText('Risk deleted successfully.', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
  await page.waitForURL(/\/exposure\/risks(?:\?|$)/, { timeout: 20_000 })
  await page.getByPlaceholder(/^Search$/).fill(updatedName)
  await expect(page.getByRole('row', { name: new RegExp(escapeRegExp(updatedName)) })).toHaveCount(0, { timeout: 20_000 })
})
