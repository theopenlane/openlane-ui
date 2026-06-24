import { test, expect, readManifest } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'
import { loginViaApi, createTask, type ApiSession } from '../utils/api'

const taskTitle = (slug: string) => `E2E Task ${slug} ${RUN_ID} ${Date.now().toString(36)}`

let ownerApi: ApiSession

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('tasks — list + create', () => {
  test('/automation/tasks renders the Tasks heading', async ({ page }) => {
    await page.goto('/automation/tasks')

    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible()
  })

  test('required validation — submitting Create task with blank title shows the inline error', async ({ page }) => {
    await page.goto('/automation/tasks')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Schema in tasks/hooks/use-form-schema.ts:
    // title.min(2, 'Title must be at least 2 characters'). Submitting
    // empty surfaces the message under the input.
    await dialog.getByRole('button', { name: /^create task$/i }).click()

    await expect(dialog.getByText(/^Title must be at least 2 characters$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — open create dialog, fill title, submit, dialog closes', async ({ page }) => {
    await page.goto('/automation/tasks')

    // Toolbar has a default-trigger "Create" button (CreateTaskDialog
    // without a custom trigger renders one). Scope to the dialog
    // trigger by also waiting for the dialog title that follows.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Create a new Task/i)).toBeVisible()

    const title = taskTitle('create')
    await dialog.getByLabel(/^Title$/).fill(title)

    // taskKindName defaults to "Uncategorized" so we don't need to touch
    // the Type combobox. Submit via the dialog's "Create task" button
    // (different copy than the trigger's "Create").
    await dialog.getByRole('button', { name: /^create task$/i }).click()

    // Successful create closes the dialog (handleSuccess in the dialog).
    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })

  test('search by title filters server-side — second task disappears when first title is typed', async ({ page }) => {
    await page.goto('/automation/tasks')

    const a = taskTitle('search-a')
    const b = taskTitle('search-b')
    for (const title of [a, b]) {
      await page
        .getByRole('main')
        .getByRole('button', { name: /^create$/i })
        .click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10_000 })
      await dialog.getByLabel(/^Title$/).fill(title)
      await dialog.getByRole('button', { name: /^create task$/i }).click()
      await expect(dialog).toBeHidden({ timeout: 15_000 })
    }

    // The toolbar input has placeholder "Search". TasksPage's
    // debouncedSearch (300ms) feeds into the where clause as
    // titleContainsFold/detailsContainsFold OR.
    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible()
  })

  test('toggle to Card view via TableCardView — table no longer rendered', async ({ page }) => {
    await page.goto('/automation/tasks')

    // TableCardView renders two clickable divs with aria-label "Table
    // view" / "Card view". Click "Card view" → TasksPage swaps to
    // <TaskInfiniteCards />, which has no <table> element.
    await page.getByLabel(/^Card view$/).click()

    // After switch, the data-table grid no longer renders. tanstack-table
    // marks rows with role=row inside its table; a card-only view should
    // have no <table> in the DOM.
    await expect(page.getByRole('table')).toHaveCount(0, { timeout: 5_000 })
  })

  test('column visibility menu opens with the column list', async ({ page }) => {
    await page.goto('/automation/tasks')

    // Toolbar renders ColumnVisibilityMenu's trigger as a Button reading
    // "Columns" with a Columns3 icon. Click → DropdownMenuContent shows
    // each column's checkbox + header label.
    await page.getByRole('button', { name: /^columns$/i }).click()

    // The menu surfaces the Title column among others — at minimum one
    // row should render with the column's header text.
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText(/^Title$/).last()).toBeVisible()
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/automation/tasks')

    // task-table-toolbar.tsx renders the shared TableFilter once its async
    // filterFields (org members / programs / kinds) resolve; getTasksFilterFields
    // includes a "Status" field.
    const filterButton = page.getByRole('button', { name: /^Filter$/ })
    await expect(filterButton).toBeVisible({ timeout: 20_000 })
    await filterButton.click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the full create-task dialog exposes the rich fields', async ({ page }) => {
    await page.goto('/automation/tasks')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    // create-task-form.tsx FormLabels (beyond the required Title): Details,
    // Assign team member, Due date.
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Create a new Task')).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Title', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Details', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Assign team member')).toBeVisible()
    await expect(dialog.getByText('Due date')).toBeVisible()
  })

  test('bulk delete — selecting a task row, clicking Bulk Delete, confirming removes the row', async ({ page }) => {
    await page.goto('/automation/tasks')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const title = taskTitle('bulk-del')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByRole('checkbox').first().check()
    await page.getByRole('button', { name: /^Bulk Delete \(1\)$/i }).click()

    // ConfirmationDialog renders as a Radix AlertDialog (role=alertdialog,
    // not "dialog"). Title is "Delete selected tasks?" — confirm with
    // the destructive "Delete" button (confirmationText prop).
    const confirm = page.getByRole('alertdialog', { name: /delete selected tasks/i })
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^delete$/i }).click()

    // After bulk delete, the row should disappear.
    await expect(page.getByRole('cell').filter({ hasText: title })).toHaveCount(0, { timeout: 15_000 })
  })

  test('selecting a task row reveals the Bulk Edit dialog trigger', async ({ page }) => {
    await page.goto('/automation/tasks')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const title = taskTitle('bulk')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 15_000 })

    // Each row's select column wraps the Checkbox in a stopPropagation
    // div, so the checkbox click doesn't trigger the row's detail-sheet
    // navigation. Pick the first checkbox in the row (column id="select").
    await row.getByRole('checkbox').first().check()

    // The toolbar conditionally renders the BulkEditTasksDialog trigger
    // once selectedTasks.length > 0; the Button label includes the count.
    await expect(page.getByRole('button', { name: /^Bulk Edit \(1\)$/i })).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /^Bulk Edit \(1\)$/i }).click()

    // Dialog title is "Bulk edit".
    await expect(page.getByRole('dialog', { name: /^bulk edit$/i })).toBeVisible({ timeout: 10_000 })
  })

  test('clearing the search input restores both task rows', async ({ page }) => {
    await page.goto('/automation/tasks')

    const token = `clear-${RUN_ID}-${Date.now().toString(36)}`
    const a = `E2E Task ${token}-a`
    const b = `E2E Task ${token}-b`
    for (const t of [a, b]) {
      await page
        .getByRole('main')
        .getByRole('button', { name: /^create$/i })
        .click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10_000 })
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

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const title = taskTitle('detail')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    const titleCell = page.getByRole('cell').filter({ hasText: title }).first()
    await expect(titleCell).toBeVisible({ timeout: 15_000 })
    await titleCell.click()

    // onRowClick → router.replace({ id }) → URL gains ?id=<task-id> →
    // TaskDetailsSheet picks it up. The sheet's SheetTitle (Radix) renders
    // the task title as a heading; the URL also reflects ?id=.
    await expect(page).toHaveURL(/\?id=/, { timeout: 15_000 })

    // The detail sheet renders inside a role=dialog. Scope to it and
    // check the title is shown by the SheetTitle.
    const detailSheet = page.getByRole('dialog')
    await expect(detailSheet).toBeVisible({ timeout: 10_000 })
    await expect(detailSheet.getByText(title).first()).toBeVisible()
  })

  test('after create, the new task is visible in the table on /automation/tasks', async ({ page }) => {
    await page.goto('/automation/tasks')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const title = taskTitle('listed')
    await dialog.getByLabel(/^Title$/).fill(title)
    await dialog.getByRole('button', { name: /^create task$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)

    // Default landing tab is the table (TasksPage activeTab='table'). The
    // title column renders the value as plain text inside a cell.
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

    await page.getByRole('button', { name: /^Filter$/ }).click()
    const completed = page.getByRole('button', { name: /^Completed$/ })
    await expect(completed).toBeVisible({ timeout: 10_000 })

    await completed.click()
    await expect(completed).toHaveClass(/is-active/, { timeout: 10_000 })
  })
})

test.describe('tasks — detail sheet inline edits (seeded)', () => {
  // Properties (properties.tsx) renders each field as a labeled row. Double-
  // clicking the value enters inline edit; choosing a new value calls
  // handleUpdateField → toast "Task updated".
  test('inline-editing status from Open to In Progress persists with a toast', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('status'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    // A freshly-seeded task lands in the OPEN status (getEnumLabel → "Open").
    const statusValue = sheet.getByText('Open', { exact: true }).first()
    await expect(statusValue).toBeVisible({ timeout: 20_000 })

    await statusValue.dblclick()
    // The inline Select trigger renders as a combobox. Open it and pick a value.
    const trigger = sheet.getByRole('combobox').first()
    await expect(trigger).toBeVisible({ timeout: 10_000 })
    await trigger.click()
    await page.getByRole('option', { name: 'In Progress', exact: true }).click()

    await expect(page.getByText(/task updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('inline-editing the due date opens the calendar popover', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('due'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    // properties.tsx renders each row as: label paragraph + HoverPencilWrapper
    // whose pencil is an aria-label="Edit" button. Scope to the Due Date row.
    const dueLabel = sheet.getByText('Due Date', { exact: true })
    await expect(dueLabel).toBeVisible({ timeout: 20_000 })

    // The row wraps the label paragraph and the HoverPencilWrapper value (whose
    // pencil is an aria-label="Edit" button) as siblings. Step up to the row,
    // hover to reveal the pencil, then click it.
    const dueRow = dueLabel.locator('xpath=..')
    await dueRow.hover()
    await dueRow.getByRole('button', { name: /^Edit$/ }).click()

    // CalendarPopover trigger (empty state) reads "Select a date:". Click it to
    // surface the calendar grid (the month view renders role=grid).
    await sheet.getByRole('button', { name: /Select a date:/ }).click()
    await expect(page.getByRole('grid').first()).toBeVisible({ timeout: 10_000 })
  })

  test('the detail sheet exposes the Assignee, Status, Due Date, Task Type and Tags rows', async ({ page }) => {
    const id = await createTask(ownerApi, taskTitle('props'))

    await page.goto(`/automation/tasks?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 20_000 })

    // properties.tsx row labels.
    for (const label of ['Assignee', 'Due Date', 'Status', 'Task Type', 'Tags']) {
      await expect(sheet.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    }
  })
})

test.describe('tasks — quick filters', () => {
  // task-table-toolbar.tsx quickFilters render as variant="tag" buttons inside
  // the TableFilter menu; an active one gains the `is-active` class.
  for (const label of ['Open', 'My Tasks', 'Overdue', 'Due This Week', 'Unassigned']) {
    test(`the "${label}" quick filter toggles active`, async ({ page }) => {
      await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 20_000 })

      const quick = page.getByRole('button', { name: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
      // The Filter menu's quick-filter buttons render after async filter fields
      // resolve (org members/programs/kinds) — slow under parallel load. Toggle-
      // safe open: only click Filter if the quick button isn't already shown.
      await expect(async () => {
        if (!(await quick.isVisible())) await page.getByRole('button', { name: /^Filter$/ }).click()
        await expect(quick).toBeVisible({ timeout: 3_000 })
      }).toPass({ timeout: 25_000 })

      await quick.click()
      await expect(quick).toHaveClass(/is-active/, { timeout: 10_000 })
    })
  }
})

test.describe('tasks — column sorting', () => {
  // SortableHeaderCell (packages/ui data-table) sets aria-sort on the <th>
  // (role=columnheader) and toggles none → ascending → descending on click.
  test('clicking the Title header sorts the column ascending', async ({ page }) => {
    await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 20_000 })

    const titleHeader = page.getByRole('columnheader', { name: /Title/ })
    await expect(titleHeader).toBeVisible({ timeout: 20_000 })

    // The inner sort handle carries title="Sort by Title"; clicking it toggles
    // the sort direction. Starts at "none", first click → "ascending".
    await titleHeader.getByTitle('Sort by Title').click()
    await expect(titleHeader).toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })

    // A second click advances to "descending".
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

    // Switching to a different column resets the previous one — only one
    // column sorts at a time, so Due Date becomes ascending and Status none.
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
