import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createTask, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { waitForMutation } from '../utils/mutations'

const DATA_TYPE = 'Tasks'

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const openReportBuilder = async (page: Page): Promise<void> => {
  await page.goto('/reports/custom', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Report data type' })).toBeVisible({ timeout: 60_000 })
}

const chooseDataType = async (page: Page, label: string): Promise<void> => {
  await page.getByRole('button', { name: 'Report data type' }).click()
  await page.getByPlaceholder('Search...').fill(label)
  await page.getByRole('option', { name: label, exact: true }).click()
  await expect(page.getByRole('button', { name: 'Report data type' })).toContainText(label, { timeout: 15_000 })
}

const pickTitleContains = async (page: Page, value: string): Promise<void> => {
  await page.getByRole('combobox', { name: 'Filter field' }).last().click()
  await page.getByRole('option', { name: 'Title', exact: true }).click()

  await page.getByRole('combobox', { name: 'Filter operator' }).last().click()
  await page.getByRole('option', { name: 'contains', exact: true }).click()

  await page.getByLabel('Filter value').last().fill(value)
}

const addTitleFilter = async (page: Page, value: string): Promise<void> => {
  await page.getByRole('button', { name: 'Add filter' }).click()
  await pickTitleContains(page, value)
}

const runReport = async (page: Page): Promise<void> => {
  const run = page.getByRole('button', { name: 'Run report' })
  await expect(run).toBeEnabled({ timeout: 30_000 })

  const pending = waitForMutation(page, 'CustomReport')
  await run.click()
  expect((await pending).ok(), 'the generated report query was rejected').toBe(true)
}

const resultRow = (page: Page, text: string): Locator => page.getByRole('row').filter({ hasText: text }).first()

test.describe('reports — custom report builder', () => {
  test('a data type plus its default columns runs and returns the seeded record', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Report Task')
    await createTask(ownerApi, title)

    await openReportBuilder(page)
    await chooseDataType(page, DATA_TYPE)
    await addTitleFilter(page, title)
    await runReport(page)

    await expect(resultRow(page, title)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('1 total records', { exact: true })).toBeVisible({ timeout: 30_000 })
  })

  test('Run report stays disabled until a data type and a column are chosen', async ({ page }) => {
    test.slow()
    await openReportBuilder(page)

    const run = page.getByRole('button', { name: 'Run report' })
    await expect(run).toBeDisabled()

    await chooseDataType(page, DATA_TYPE)
    await expect(run).toBeEnabled({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Select all', exact: true }).click()
    await page.getByRole('button', { name: 'Deselect all', exact: true }).click()

    await expect(run).toBeDisabled({ timeout: 15_000 })
    await expect(page.getByText('Select at least one column to run this report.')).toBeVisible({ timeout: 15_000 })
  })

  test('a filter with no value blocks the run until it is filled in', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Report Incomplete')
    await createTask(ownerApi, title)

    await openReportBuilder(page)
    await chooseDataType(page, DATA_TYPE)

    await page.getByRole('button', { name: 'Add filter' }).click()

    const run = page.getByRole('button', { name: 'Run report' })
    await expect(run).toBeDisabled({ timeout: 15_000 })
    await expect(page.getByText('Give every filter a value, or remove it, before running this report.')).toBeVisible({ timeout: 15_000 })

    await pickTitleContains(page, title)
    await runReport(page)

    await expect(resultRow(page, title)).toBeVisible({ timeout: 30_000 })
  })

  test('the Query tab shows the generated GraphQL for the chosen data type', async ({ page }) => {
    test.slow()
    await openReportBuilder(page)
    await chooseDataType(page, DATA_TYPE)

    await page.getByRole('tab', { name: 'Query' }).click()

    const generated = page.locator('pre').first()
    await expect(generated).toContainText('query CustomReport', { timeout: 30_000 })
    await expect(generated).toContainText('tasks(')

    await page.getByRole('button', { name: 'Copy', exact: true }).click()
    await expect(page.getByText('Copied to clipboard', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('a maximum-records cap still returns the matching rows', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E Report Limit')
    await createTask(ownerApi, `${prefix} one`)
    await createTask(ownerApi, `${prefix} two`)

    await openReportBuilder(page)
    await chooseDataType(page, DATA_TYPE)
    await addTitleFilter(page, prefix)

    await page.getByLabel('Maximum records').click()
    await page.getByRole('option', { name: 'First 100', exact: true }).click()

    await runReport(page)

    await expect(resultRow(page, `${prefix} one`)).toBeVisible({ timeout: 30_000 })
    await expect(resultRow(page, `${prefix} two`)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('2 total records', { exact: true })).toBeVisible({ timeout: 30_000 })
  })

  test('a report that has been run is replayed from the History menu', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Report History')
    await createTask(ownerApi, title)

    await openReportBuilder(page)
    await chooseDataType(page, DATA_TYPE)
    await addTitleFilter(page, title)
    await runReport(page)
    await expect(resultRow(page, title)).toBeVisible({ timeout: 30_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Report data type' })).toBeVisible({ timeout: 60_000 })

    const history = page.getByRole('button', { name: 'History' })
    await expect(history).toBeVisible({ timeout: 30_000 })
    await history.click()

    const entry = page.getByRole('menuitem').filter({ hasText: 'Tasks filtered by Title' }).first()
    await expect(entry).toBeVisible({ timeout: 15_000 })

    const pending = waitForMutation(page, 'CustomReport')
    await entry.click()
    expect((await pending).ok()).toBe(true)

    await expect(resultRow(page, title)).toBeVisible({ timeout: 30_000 })
  })

  test('the CSV export downloads the rows the report returned', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Report Export')
    await createTask(ownerApi, title)

    await openReportBuilder(page)
    await chooseDataType(page, DATA_TYPE)
    await addTitleFilter(page, title)
    await runReport(page)
    await expect(resultRow(page, title)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Export' }).click()

    const downloading = page.waitForEvent('download', { timeout: 60_000 })
    await page.getByRole('menuitem', { name: 'CSV', exact: true }).click()
    const download = await downloading

    expect(download.suggestedFilename()).toContain('tasks-report')
    await expect(page.getByText('Export complete', { exact: true })).toBeVisible({ timeout: 30_000 })
  })
})
