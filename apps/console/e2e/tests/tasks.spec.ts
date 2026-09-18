import { test, expect } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'
import { createTask, readField, type ApiSession, getOwnerApi } from '../utils/api'
import { bulkEditAndSave, selectFirstMatchingRow } from '../utils/mutations'
import { openCreateTaskDialog } from '../utils/tasks'
import { uniqueName } from '../utils/unique'

const taskTitle = (slug: string) => uniqueName(`E2E Task ${slug}`)

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('tasks — list + create', () => {
  test('/automation/tasks renders the Tasks heading', async ({ page }) => {
    await page.goto('/automation/tasks')

    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible()
  })

  test('required validation — submitting Create task with blank title shows the inline error', async ({ page }) => {
    await page.goto('/automation/tasks')
    const dialog = await openCreateTaskDialog(page)

    await dialog.getByRole('button', { name: /^create task$/i }).click()

    await expect(dialog.getByText(/^Title must be at least 2 characters$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — open create dialog, fill title, submit, dialog closes', async ({ page }) => {
    await page.goto('/automation/tasks')

    const dialog = await openCreateTaskDialog(page)
    await expect(dialog.getByText(/Create a new Task/i)).toBeVisible()

    const title = taskTitle('create')
    await dialog.getByLabel(/^Title$/).fill(title)

    // taskKindName defaults to "Uncategorized" so we don't need to touch the Type combobox
    await dialog.getByRole('button', { name: /^create task$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })

  test('search by title filters server-side — second task disappears when first title is typed', async ({ page }) => {
    await page.goto('/automation/tasks')

    const a = taskTitle('search-a')
    const b = taskTitle('search-b')
    for (const title of [a, b]) {
      const dialog = await openCreateTaskDialog(page)
      await dialog.getByLabel(/^Title$/).fill(title)
      await dialog.getByRole('button', { name: /^create task$/i }).click()
      await expect(dialog).toBeHidden({ timeout: 15_000 })
    }

    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible()
  })

  test('toggle to Board view via TableCardView — table no longer rendered', async ({ page }) => {
    await page.goto('/automation/tasks')

    await page.getByLabel(/^Board view$/).click()

    await expect(page.getByRole('table')).toHaveCount(0, { timeout: 5_000 })
  })

  test('column visibility menu opens with the column list', async ({ page }) => {
    await page.goto('/automation/tasks')

    await page.getByRole('button', { name: /^columns$/i }).click()

    await expect(page.getByRole('menu')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/^Title$/).last()).toBeVisible()
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/automation/tasks')

    const filterButton = page.getByRole('button', { name: /^Filter( \d+)?$/ })
    await expect(filterButton).toBeVisible({ timeout: 20_000 })
    await filterButton.click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the full create-task dialog exposes the rich fields', async ({ page }) => {
    await page.goto('/automation/tasks')
    const dialog = await openCreateTaskDialog(page)

    await expect(dialog.getByText('Create a new Task')).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Title', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Details', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Assign team member')).toBeVisible()
    await expect(dialog.getByText('Due date')).toBeVisible()
  })

  test('bulk delete — selecting a task row, clicking Bulk Delete, confirming removes the row', async ({ page }) => {
    await page.goto('/automation/tasks')

    const dialog = await openCreateTaskDialog(page)
    const title = taskTitle('bulk-del')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByRole('checkbox').first().check()
    await page.getByRole('button', { name: /^Bulk Delete \(1\)$/i }).click()

    const confirm = page.getByRole('alertdialog', { name: /delete selected tasks/i })
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^delete$/i }).click()

    await expect(page.getByRole('cell').filter({ hasText: title })).toHaveCount(0, { timeout: 15_000 })
  })

  test('selecting a task row reveals the Bulk Edit dialog trigger', async ({ page }) => {
    await page.goto('/automation/tasks')

    const dialog = await openCreateTaskDialog(page)
    const title = taskTitle('bulk')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByRole('checkbox').first().check()

    await expect(page.getByRole('button', { name: /^Bulk Edit \(1\)$/i })).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /^Bulk Edit \(1\)$/i }).click()

    await expect(page.getByRole('dialog', { name: /^bulk edit$/i })).toBeVisible({ timeout: 10_000 })
  })

  test('clearing the search input restores both task rows', async ({ page }) => {
    await page.goto('/automation/tasks')

    const token = `clear-${RUN_ID}-${Date.now().toString(36)}`
    const a = `E2E Task ${token}-a`
    const b = `E2E Task ${token}-b`
    for (const t of [a, b]) {
      const dialog = await openCreateTaskDialog(page)
      await dialog.getByLabel(/^Title$/).fill(t)
      await dialog.getByRole('button', { name: /^create task$/i }).click()
      await expect(dialog).toBeHidden({ timeout: 15_000 })
    }

    await page.getByPlaceholder(/^Search$/).fill(token)
    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(1, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(1, { timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(1, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(token)
    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(1, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(1, { timeout: 15_000 })
  })

  test('clicking a task row opens the details sheet with the task title visible', async ({ page }) => {
    await page.goto('/automation/tasks')

    const dialog = await openCreateTaskDialog(page)

    const title = taskTitle('detail')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    const titleCell = page.getByRole('cell').filter({ hasText: title }).first()
    await expect(titleCell).toBeVisible({ timeout: 15_000 })
    await titleCell.click()

    await expect(page).toHaveURL(/\?id=/, { timeout: 15_000 })

    const detailSheet = page.getByRole('dialog')
    await expect(detailSheet).toBeVisible({ timeout: 10_000 })
    await expect(detailSheet.getByText(title).first()).toBeVisible()
  })

  test('after create, the new task is visible in the table on /automation/tasks', async ({ page }) => {
    await page.goto('/automation/tasks')

    const dialog = await openCreateTaskDialog(page)

    const title = taskTitle('listed')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    await expect(page.getByRole('cell').filter({ hasText: title }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('tasks — detail sheet (seeded)', () => {
  test('marking a seeded task complete shows the completion confirmation', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('complete'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    const markComplete = sheet.getByRole('button', { name: /^mark as complete$/i })
    await expect(markComplete).toBeVisible({ timeout: 20_000 })

    await markComplete.click()
    await expect(page.getByText(/marked as complete/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(markComplete).toBeDisabled({ timeout: 15_000 })
  })

  test('inline-editing a seeded task title persists the change', async ({ page }) => {
    const original = taskTitle('edit')
    const id = await createTask(ownerApi, original)

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(original).first()).toBeVisible({ timeout: 20_000 })

    const updated = `${original} edited`
    await sheet.getByText(original).first().dblclick()
    const input = sheet.getByRole('textbox').first()
    await input.fill(updated)
    await input.press('Enter')

    await expect(page.getByText(/task updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the Completed quick filter activates from the Filter menu', async ({ page }) => {
    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    const completed = page.getByRole('button', { name: /^Completed$/ })
    await expect(completed).toBeVisible({ timeout: 10_000 })

    await completed.click()
    await expect(completed).toHaveClass(/is-active/, { timeout: 10_000 })
  })
})

test.describe('tasks — detail sheet inline edits (seeded)', () => {
  test('inline-editing status from Open to In Progress persists with a toast', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('status'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    const statusValue = sheet.getByText('Open', { exact: true }).first()
    await expect(statusValue).toBeVisible({ timeout: 20_000 })

    const trigger = sheet.getByRole('combobox').first()
    await expect(async () => {
      await statusValue.dblclick()
      await expect(trigger).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 40_000 })
    await trigger.click()
    await page.getByRole('option', { name: 'In Progress', exact: true }).click()

    await expect(page.getByText(/task updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('inline-editing the due date opens the calendar popover', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('due'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    const dueLabel = sheet.getByText('Due Date', { exact: true })
    await expect(dueLabel).toBeVisible({ timeout: 20_000 })

    const dueRow = dueLabel.locator('xpath=..')
    await dueRow.hover()
    await dueRow.getByRole('button', { name: /^Edit$/ }).click()

    await sheet.getByRole('button', { name: /Select a date:/ }).click()
    await expect(page.getByRole('grid').first()).toBeVisible({ timeout: 10_000 })
  })

  test('the detail sheet exposes the Assignee, Status, Due Date, Task Type and Tags rows', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('props'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 20_000 })

    for (const label of ['Assignee', 'Due Date', 'Status', 'Task Type', 'Tags']) {
      await expect(sheet.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    }
  })
})

test.describe('tasks — quick filters', () => {
  for (const label of ['Open', 'My Tasks', 'Overdue', 'Due This Week', 'Unassigned']) {
    test(`the "${label}" quick filter toggles active`, async ({ page }) => {
      await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 20_000 })

      const quick = page.getByRole('button', { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
      // The Filter menu's quick-filter buttons render after async filter fields resolve (org members/programs/kinds)
      await expect(async () => {
        if (!(await quick.isVisible())) await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
        await expect(quick).toBeVisible({ timeout: 3_000 })
      }).toPass({ timeout: 25_000 })

      await quick.click()
      await expect.poll(async () => (await quick.getAttribute('class'))?.includes('is-active') ?? false, { timeout: 30_000 }).toBe(true)
    })
  }
})

test.describe('tasks — column sorting', () => {
  test('clicking the Title header sorts the column ascending', async ({ page }) => {
    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 20_000 })

    const titleHeader = page.getByRole('columnheader', { name: /Title/ })
    await expect(titleHeader).toBeVisible({ timeout: 20_000 })

    await titleHeader.getByTitle('Sort by Title').click()
    await expect(titleHeader).toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })

    await titleHeader.getByTitle('Sort by Title').click()
    await expect(titleHeader).toHaveAttribute('aria-sort', 'descending', { timeout: 10_000 })
  })

  test('the Status and Due Date headers are sortable', async ({ page }) => {
    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 20_000 })

    const statusHeader = page.getByRole('columnheader', { name: /Status/ })
    await expect(statusHeader).toBeVisible({ timeout: 20_000 })
    await statusHeader.getByTitle('Sort by Status').click()
    await expect(statusHeader).toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })

    const dueHeader = page.getByRole('columnheader', { name: /Due Date/ })
    await dueHeader.getByTitle('Sort by Due Date').click()
    await expect(dueHeader).toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })
  })
})

freshTest.describe('tasks — fresh org', () => {
  freshTest('empty state — fresh org has no task rows', async ({ page }) => {
    await seedLoggedInUser(page, 'tasks-empty')

    await page.goto('/automation/tasks')

    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: /^E2E Task/ })).toHaveCount(0, { timeout: 5_000 })
  })
})

test.describe('tasks — status filter defaults (ISS-2454)', () => {
  test('the Status filter offers every status, including the previously hidden ones', async ({ page }) => {
    test.slow()
    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()

    const filterMenu = page.getByRole('menu')
    await expect(filterMenu).toBeVisible({ timeout: 15_000 })
    await expect(filterMenu.getByText('Status', { exact: true })).toBeVisible()

    await expect(filterMenu.getByText(/^Open$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(filterMenu.getByText(/^In progress$/i).first()).toBeVisible()
    await expect(filterMenu.getByText(/^In review$/i).first()).toBeVisible()

    await expect(filterMenu.getByText(/^Completed$/).first()).toBeVisible()
    await expect(filterMenu.getByText(/^Wont do$/i).first()).toBeVisible()
  })
})

test.describe('tasks — slideout status formatting (ISS-2484)', () => {
  test('the detail sheet Status row shows a human label, not a raw enum value', async ({ page }) => {
    test.slow()
    const taskId = await createTask(ownerApi, taskTitle('status-format'))

    await page.goto(`/automation/tasks?id=${taskId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByText('Status', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

    await expect(sheet.getByText(/^(OPEN|IN_PROGRESS|IN_REVIEW|COMPLETED|WONT_DO)$/)).toHaveCount(0)
    await expect(sheet.getByText(/^(Open|In progress|In review|Completed|Wont do)$/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('tasks — assignee edit does not open the slideout (ISS-2592)', () => {
  test('choosing an assignee from the table leaves the slideout closed', async ({ page }) => {
    test.slow()
    const title = taskTitle('assignee-inline')
    await createTask(ownerApi, title)

    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)
    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 45_000 })

    const combobox = row.getByRole('combobox').first()
    const option = page.getByRole('option').nth(1)
    await expect(async () => {
      if (!(await combobox.isVisible().catch(() => false))) {
        await row.getByText('Not assigned', { exact: true }).click({ timeout: 5_000 })
      }
      await expect(combobox).toBeVisible({ timeout: 3_000 })
      if ((await option.count()) === 0) {
        await combobox.click({ timeout: 5_000 })
      }
      await expect(option).toBeVisible({ timeout: 5_000 })
      await option.click({ timeout: 5_000 })
    }).toPass({ timeout: 45_000 })

    await expect(page.getByRole('dialog')).toHaveCount(0)
  })
})

test.describe('tasks — card view is sticky (ISS-2715 / ISS-2776)', () => {
  test('switching to the card view survives a reload', async ({ page }) => {
    test.slow()
    await createTask(ownerApi, taskTitle('board-view'))

    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

    const boardButton = page.getByRole('button', { name: 'Board view' })
    await expect(boardButton).toBeVisible({ timeout: 20_000 })

    await boardButton.click()
    await expect(boardButton).toHaveClass(/bg-btn-secondary/, { timeout: 15_000 })

    await page.reload()
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

    await expect(page.getByRole('button', { name: 'Board view' })).toHaveClass(/bg-btn-secondary/, { timeout: 30_000 })
  })
})

test.describe('tasks — templates (ISS-2714)', () => {
  test('the create control offers both a blank task and a template', async ({ page }) => {
    test.slow()
    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })

    const create = page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .first()
    await expect(create).toBeVisible({ timeout: 30_000 })
    await create.click()

    await expect(page.getByText(/template/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('a seeded task appears in the list, which excludes templates', async ({ page }) => {
    test.slow()
    const title = taskTitle('template-exclusion')
    await createTask(ownerApi, title)

    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByPlaceholder(/^Search$/).fill(title)

    await expect(page.getByRole('row').filter({ hasText: title })).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('tasks — bulk edit applies', () => {
  test('bulk editing a selected task persists the new status', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E TaskBulk')
    const id = await createTask(ownerApi, title)

    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded' })
    await selectFirstMatchingRow(page, title)

    const chosen = await bulkEditAndSave({ page, field: 'Status', operationName: 'UpdateBulkTask' })

    await expect.poll(async () => readField(ownerApi, 'task', id, 'status'), { timeout: 60_000 }).toBe(chosen.toUpperCase().replace(/ /g, '_'))
  })
})
