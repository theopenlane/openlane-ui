import { test, expect } from '../fixtures/auth'
import { createTask, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let ownerApi: ApiSession
let taskId: string
let originalTitle: string
let updatedTitle: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  originalTitle = uniqueName('E2E Task lifecycle')
  updatedTitle = uniqueRef('E2E-Task-persisted')
  taskId = await createTask(ownerApi, originalTitle)
})

test.afterAll(async () => {
  if (!taskId) return
  await gql(ownerApi, `mutation($ids: [ID!]!){ deleteBulkTask(ids: $ids){ deletedIDs } }`, { ids: [taskId] })
})

test('a seeded task can be found by search and deleted from its detail sheet', async ({ page }) => {
  test.slow()

  await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

  const search = page.getByPlaceholder(/^Search$/)
  await search.fill(originalTitle)

  const originalRow = page.getByRole('row', { name: new RegExp(escapeRegExp(originalTitle)) })
  await expect(originalRow).toBeVisible({ timeout: 20_000 })
  await originalRow.getByRole('cell').filter({ hasText: originalTitle }).first().click()

  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 20_000 })
  await sheet.getByRole('button', { name: 'Action', exact: true }).click()
  const actionMenu = page.getByRole('menu')
  await expect(actionMenu).toBeVisible({ timeout: 15_000 })
  await actionMenu.getByRole('button', { name: 'Delete', exact: true }).click()

  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation.getByRole('heading', { name: /^Delete Task$/ })).toBeVisible({ timeout: 15_000 })

  const confirmDelete = confirmation
    .getByRole('button')
    .filter({ hasText: /^Delete$/ })
    .first()
  await expect(confirmDelete).toBeEnabled({ timeout: 15_000 })
  await confirmDelete.dispatchEvent('click')

  await expect(sheet).toBeHidden({ timeout: 30_000 })
  await page.getByPlaceholder(/^Search$/).fill(originalTitle)
  await expect(page.getByRole('row', { name: new RegExp(escapeRegExp(originalTitle)) })).toHaveCount(0, { timeout: 20_000 })
})
