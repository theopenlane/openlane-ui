import type { Page } from '@playwright/test'

import { CONTROL_ASSOCIATED_OBJECTS_EXPORT_FIELDS } from '@/components/pages/protected/controls/table/control-export-fields'

import { test, expect } from '../fixtures/auth'
import { createControl, deleteControl, getOwnerApi, type ApiSession } from '../utils/api'
import { findUnknownFieldPaths } from '../utils/graphql-schema'
import { waitForMutation } from '../utils/mutations'
import { uniqueRef } from '../utils/unique'

interface CreateExportRequestBody {
  variables: { input: { exportType: string; fields: string[] } }
}

const openControlsTable = async (page: Page) => {
  await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 }) // 3min
  const tableView = page.getByRole('button', { name: 'Table', exact: true })
  await expect(tableView).toBeVisible({ timeout: 60_000 }) // 1min
  await tableView.click()
  await expect(page.getByRole('button', { name: 'Columns', exact: true })).toBeVisible({ timeout: 60_000 }) // 1min
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 60_000 }) // 1min
}

const showAllColumns = async (page: Page) => {
  await page.getByRole('button', { name: 'Columns', exact: true }).click()
  const menu = page.getByRole('menu')
  await expect(menu).toBeVisible({ timeout: 15_000 }) // 15s

  const toggles = menu.getByRole('checkbox')
  const count = await toggles.count()
  expect(count, 'the Columns menu should list the table columns').toBeGreaterThan(0)

  for (let index = 0; index < count; index += 1) {
    await toggles.nth(index).check()
  }

  await page.keyboard.press('Escape')
  await expect(menu).toBeHidden()
}

test.describe('controls — export', () => {
  let ownerApi: ApiSession
  let controlId = ''

  test.beforeAll(async () => {
    ownerApi = await getOwnerApi()
    controlId = await createControl(ownerApi, uniqueRef('E2E-EXPORT'))
  })

  test.afterAll(async () => {
    if (controlId) await deleteControl(ownerApi, controlId)
  })

  test('exporting with every column shown requests only fields the Control type has', async ({ page }) => {
    test.slow()
    await openControlsTable(page)
    await showAllColumns(page)
    await expect(page.getByRole('columnheader', { name: 'Associated Objects' })).toBeVisible({ timeout: 30_000 }) // 30s

    const exportResponse = waitForMutation(page, 'CreateExport', 30_000) // 30s
    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: 'Export', exact: true }).click({ timeout: 30_000 }) // 30s

    const { input } = ((await exportResponse).request().postDataJSON() as CreateExportRequestBody).variables
    expect(input.exportType).toBe('CONTROL')
    expect(input.fields).toEqual(expect.arrayContaining(CONTROL_ASSOCIATED_OBJECTS_EXPORT_FIELDS))
    expect(await findUnknownFieldPaths(ownerApi, 'Control', input.fields), 'export fields that do not resolve on the Control GraphQL type').toEqual([])
  })
})
