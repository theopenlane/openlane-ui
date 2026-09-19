import { test, expect } from '../fixtures/auth'
import { createTask, getOwnerApi, gql, readField, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { dragTo } from '../utils/dragdrop'
import { toast } from '../utils/mutations'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

let ownerApi: ApiSession
let taskId: string
let originalTitle: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  originalTitle = uniqueName('E2E Task lifecycle')
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

test.describe('tasks — board drag and drop (ISS-2790)', () => {
  test('dragging a card into another column moves the task to that status', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Task board move')
    const id = await createTask(ownerApi, title)

    try {
      await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

      await page.getByRole('button', { name: 'Board view' }).click()
      await page.getByPlaceholder(/^Search$/).fill(title)

      const card = page.getByRole('button', { name: title, exact: true })
      await expect(card).toBeVisible({ timeout: 60_000 })

      const target = page.getByText('In Progress', { exact: true }).first()
      await expect(target).toBeVisible({ timeout: 30_000 })

      const moved = toast(page, `${title} moved to In Progress.`)

      await expect(async () => {
        await dragTo(page, card, target)
        await expect(moved).toBeVisible({ timeout: 10_000 })
      }).toPass({ timeout: 90_000 })
      await expect.poll(async () => readField(ownerApi, 'task', id, 'status'), { timeout: 60_000 }).toBe('IN_PROGRESS')
    } finally {
      await gql(ownerApi, `mutation($ids: [ID!]!){ deleteBulkTask(ids: $ids){ deletedIDs } }`, { ids: [id] })
    }
  })
})
