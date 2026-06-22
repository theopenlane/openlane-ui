import { test, expect } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'

const taskTitle = (slug: string) => `E2E Task ${slug} ${RUN_ID} ${Date.now().toString(36)}`

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

freshTest.describe('tasks — fresh org', () => {
  freshTest('empty state — fresh org has no task rows', async ({ page }) => {
    await seedLoggedInUser(page, 'tasks-empty')

    await page.goto('/automation/tasks')

    await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: /^E2E Task/ })).toHaveCount(0, { timeout: 5_000 })
  })
})
