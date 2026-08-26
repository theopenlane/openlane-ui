import { addDays, format } from 'date-fns'
import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, deleteCustomTypeEnum, type ApiSession } from '../utils/api'
import { createAutomationTask, deleteAutomationTask, getAutomationApi, getOwnerUser } from '../utils/api-automation'
import { pickCalendarDay } from '../utils/calendar'
import { uniqueName } from '../utils/unique'

const openTasks = async (page: Page): Promise<void> => {
  await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible({ timeout: 30_000 })
}

const calendarDayName = (date: Date): string => format(date, 'EEEE, MMMM do, yyyy')

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('all rendered task sort columns expose and activate sorting', async ({ page }) => {
  const title = uniqueName('E2E Task sorting')
  const id = await createAutomationTask(ownerApi, title)

  try {
    await openTasks(page)
    await page.getByPlaceholder('Search').fill(title)
    await expect(page.getByRole('row', { name: new RegExp(title) })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: 'Columns' }).click()
    const menu = page.getByRole('menu')
    await menu.getByRole('checkbox', { name: 'Created At' }).check()
    await menu.getByRole('checkbox', { name: 'Last Updated' }).check()
    await page.keyboard.press('Escape')

    for (const headerName of ['Title', 'Due Date', 'Status', 'Created At', 'Last Updated']) {
      const header = page.getByRole('columnheader', { name: new RegExp(`^${headerName}\\b`) })
      await expect(header).toBeVisible({ timeout: 30_000 })
      await header.getByRole('button', { name: headerName, exact: true }).click()
      await expect(header).not.toHaveAttribute('aria-sort', 'none')
    }
  } finally {
    await deleteAutomationTask(ownerApi, id)
  }
})

test('editing every supported task field in the detail sheet persists after reload', async ({ page }) => {
  const originalTitle = uniqueName('E2E Task full edit')
  const updatedTitle = uniqueName('E2E Task updated')
  const updatedDetails = uniqueName('E2E Task details')
  const taskType = uniqueName('E2E Task type')
  const tag = uniqueName('E2E Task tag')
  const dueDate = addDays(new Date(), 14)
  const owner = await getOwnerUser(ownerApi)
  const typeId = await createCustomTypeEnum(ownerApi, taskType, 'kind', 'task')
  const taskId = await createAutomationTask(ownerApi, originalTitle)

  try {
    await page.goto(`/automation/tasks?id=${taskId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(originalTitle, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await sheet.getByRole('button', { name: 'Edit', exact: true }).first().click()

    await sheet.getByLabel('Title').fill(updatedTitle)
    const detailsField = sheet.getByText('Details', { exact: true }).locator('../..').locator('[contenteditable="true"]')
    await detailsField.fill(updatedDetails)

    await sheet
      .getByRole('combobox')
      .filter({ hasText: /^Not Assigned$/ })
      .first()
      .click()
    await page.getByRole('option', { name: owner.displayName, exact: true }).click()

    await sheet.getByRole('button', { name: 'Select a date:' }).click()
    await pickCalendarDay(page, dueDate)

    await sheet
      .getByRole('combobox')
      .filter({ hasText: /^Open$/ })
      .first()
      .click()
    await page.getByRole('option', { name: 'In Progress', exact: true }).click()

    await sheet.getByText('Task Type', { exact: true }).locator('..').getByRole('combobox').first().click()
    await page.getByPlaceholder('Search task type...').fill(taskType)
    await page.getByText(taskType, { exact: true }).click()

    const tagsInput = sheet.getByPlaceholder('Add tag...')
    await tagsInput.fill(tag)
    await tagsInput.press('Enter')
    await sheet.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Task Updated', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    const reloadedSheet = page.getByRole('dialog')
    await expect(reloadedSheet.getByText(updatedTitle, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await expect(reloadedSheet.getByText(updatedDetails, { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(reloadedSheet.getByText(owner.displayName, { exact: true }).last()).toBeVisible({ timeout: 30_000 })
    await expect(reloadedSheet.getByText(format(dueDate, 'MMMM d, yyyy'), { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(reloadedSheet.getByText('In Progress', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(reloadedSheet.getByText(taskType, { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(reloadedSheet.getByText(tag, { exact: true })).toBeVisible({ timeout: 30_000 })
  } finally {
    await deleteAutomationTask(ownerApi, taskId)
    await deleteCustomTypeEnum(ownerApi, typeId)
  }
})
