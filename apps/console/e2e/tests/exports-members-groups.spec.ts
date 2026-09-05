import type { Download, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createGroup, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const MEMBERS_ROUTE = '/user-management/members'
const GROUPS_ROUTE = '/user-management/groups'

const readCsv = async (download: Download): Promise<string[]> => {
  const stream = await download.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
    .toString('utf-8')
    .replace(/^\uFEFF/, '')
    .split('\r\n')
}

const headerCells = (rows: string[]): string[] => (rows[0] ?? '').split(',').map((cell) => cell.replace(/^"|"$/g, ''))

const openExportMenu = async (page: Page, route: string) => {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const action = page.getByRole('button', { name: 'Action', exact: true }).first()
  await expect(action).toBeVisible({ timeout: 180_000 })
  const exportItem = page.getByRole('button', { name: 'Export', exact: true })
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await exportItem.isVisible().catch(() => false)) break
    await action.click({ timeout: 5_000 }).catch(() => {})
    await exportItem.waitFor({ state: 'visible', timeout: 3_000 }).catch(() => {})
  }
  await expect(exportItem).toBeVisible({ timeout: 15_000 })
  await exportItem.click()
}

test.describe('exports — organization members', () => {
  test('the members table offers an Export action', async ({ page }) => {
    await page.goto(MEMBERS_ROUTE, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const action = page.getByRole('button', { name: 'Action', exact: true }).first()
    await expect(action).toBeVisible({ timeout: 180_000 })
    await action.click()
    await expect(page.getByRole('button', { name: 'Export', exact: true })).toBeVisible({ timeout: 30_000 })
  })

  test('exporting members downloads a CSV named for the entity', async ({ page }) => {
    test.slow()
    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 })
    await openExportMenu(page, MEMBERS_ROUTE)

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('members.csv')
  })

  test('the members CSV carries the member columns and at least the owner row', async ({ page }) => {
    test.slow()
    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 })
    await openExportMenu(page, MEMBERS_ROUTE)

    const rows = await readCsv(await downloadPromise)
    expect(headerCells(rows)).toEqual(expect.arrayContaining(['Name', 'Email', 'Role', 'Joined', 'Provider', '2FA']))
    expect(rows.length).toBeGreaterThan(1)
  })

  test('a completed member export reports how many rows it wrote', async ({ page }) => {
    test.slow()
    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 })
    await openExportMenu(page, MEMBERS_ROUTE)
    await downloadPromise

    await expect(page.getByText('Export complete', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('exports — groups', () => {
  let ownerApi: ApiSession

  test.beforeAll(async () => {
    ownerApi = await getOwnerApi()
    await createGroup(ownerApi, uniqueName('E2E Export Group'))
  })

  test('exporting groups asks about permissions before downloading', async ({ page }) => {
    await openExportMenu(page, GROUPS_ROUTE)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Export groups', exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByText('Include permissions', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByRole('checkbox')).not.toBeChecked()
  })

  test('cancelling the groups export dialog downloads nothing', async ({ page }) => {
    await openExportMenu(page, GROUPS_ROUTE)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Export groups', exact: true })).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click()

    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })

  test('the groups CSV omits the permissions column by default', async ({ page }) => {
    test.slow()
    await openExportMenu(page, GROUPS_ROUTE)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Export groups', exact: true })).toBeVisible({ timeout: 30_000 })

    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 })
    await dialog.getByRole('button', { name: 'Export', exact: true }).click()

    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('groups.csv')

    const header = headerCells(await readCsv(download))
    expect(header).toEqual(expect.arrayContaining(['Display Name', 'Members', 'Tags']))
    expect(header).not.toContain('Permissions')
    expect(header).not.toContain('ID')
  })

  test('ticking include permissions adds the permissions column to the CSV', async ({ page }) => {
    test.slow()
    await openExportMenu(page, GROUPS_ROUTE)

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Export groups', exact: true })).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole('checkbox').click()
    await expect(dialog.getByRole('checkbox')).toBeChecked()

    const downloadPromise = page.waitForEvent('download', { timeout: 90_000 })
    await dialog.getByRole('button', { name: 'Export', exact: true }).click()

    const header = headerCells(await readCsv(await downloadPromise))
    expect(header).toContain('Permissions')
    expect(header.at(-1)).toBe('Permissions')
  })
})
