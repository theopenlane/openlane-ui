import { test, expect } from '../fixtures/auth'
import { uniqueName, uniqueRef } from '../utils/unique'
import { deleteFirstComment, editFirstComment, postComment } from '../utils/comments'
import { createControl, createSubcontrol, createTask, getOwnerApi, type ApiSession } from '../utils/api'

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const body = (label: string) => `${label} ${Date.now().toString(36)}`

test.describe('comments — control Activity tab', () => {
  test('a comment on a control can be posted, edited and deleted', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRef('E2E-CTRL-COMMENT'))
    const text = body('E2E control comment')
    const edited = `${text} edited`

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('tab', { name: 'Activity' }).click()

    await postComment(page, page, 'UpdateControl', text)
    await editFirstComment(page, 'UpdateControlComment', edited)
    await deleteFirstComment(page, 'DeleteNote', edited)
  })
})

test.describe('comments — subcontrol Activity tab', () => {
  test('a comment on a subcontrol can be posted, edited and deleted', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRef('E2E-SUB-COMMENT'))
    const subcontrolId = await createSubcontrol(ownerApi, uniqueRef('E2E-SUB'), controlId)
    const text = body('E2E subcontrol comment')
    const edited = `${text} edited`

    await page.goto(`/controls/${controlId}/${subcontrolId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('tab', { name: 'Activity' }).click()

    await postComment(page, page, 'UpdateSubcontrol', text)
    await editFirstComment(page, 'UpdateSubcontrolComment', edited)
    await deleteFirstComment(page, 'DeleteNote', edited)
  })
})

test.describe('comments — task Conversation panel', () => {
  test('a comment on a task can be posted, edited and deleted', async ({ page }) => {
    test.slow()
    const id = await createTask(ownerApi, uniqueName('E2E Task comment'))
    const text = body('E2E task comment')
    const edited = `${text} edited`

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Conversation', { exact: true })).toBeVisible({ timeout: 30_000 })

    await postComment(page, page, 'UpdateTask', text)
    await editFirstComment(page, 'UpdateTaskComment', edited)
    await deleteFirstComment(page, 'DeleteNote', edited)
  })
})
