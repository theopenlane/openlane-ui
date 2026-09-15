import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createControl, createRisk, getOwnerApi, readField } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'
import { uploadCsvAndAssert } from '../utils/mutations'

interface BulkCsvCase {
  slug: string
  route: string
  operationName: string
  toast: string
  header: string
  row: (name: string) => string
  searchText?: (name: string) => string
}

const scanTarget = (name: string) => `${name.replace(/[^a-z0-9]/gi, '').toLowerCase()}.e2e-openlane.dev`

const CASES: BulkCsvCase[] = [
  { slug: 'assets', route: '/registry/assets', operationName: 'CreateBulkCSVAsset', toast: 'Assets Created', header: 'Name,Description', row: (n) => `${n},seeded by e2e` },
  { slug: 'contacts', route: '/registry/contacts', operationName: 'CreateBulkCSVContact', toast: 'Contacts Created', header: 'FullName', row: (n) => n },
  { slug: 'findings', route: '/exposure/findings', operationName: 'CreateBulkCSVFinding', toast: 'Findings Created', header: 'DisplayName', row: (n) => n },
  {
    slug: 'personnel',
    route: '/registry/personnel',
    operationName: 'CreateBulkCSVIdentityHolder',
    toast: 'Personnels Created',
    header: 'FullName,Email',
    row: (n) => `${n},${n.replace(/[^a-z0-9]/gi, '').toLowerCase()}@e2e-openlane.dev`,
  },
  { slug: 'remediations', route: '/exposure/remediations', operationName: 'CreateBulkCSVRemediation', toast: 'Remediations Created', header: 'Title', row: (n) => n },
  { slug: 'reviews', route: '/exposure/reviews', operationName: 'CreateBulkCsvReview', toast: 'Reviews Created', header: 'Title', row: (n) => n },
  {
    slug: 'scans',
    route: '/exposure/scans',
    operationName: 'CreateBulkCSVScan',
    toast: 'Scans Created',
    header: 'Target',
    row: (n) => scanTarget(n),
    searchText: (n) => scanTarget(n),
  },
  { slug: 'system-details', route: '/registry/system-details', operationName: 'CreateBulkCSVSystemDetail', toast: 'System Details Created', header: 'SystemName', row: (n) => n },
  { slug: 'vendors', route: '/registry/vendors', operationName: 'CreateBulkCSVEntity', toast: 'Vendors Created', header: 'Name', row: (n) => n },
  {
    slug: 'vulnerabilities',
    route: '/exposure/vulnerabilities',
    operationName: 'CreateBulkCSVVulnerability',
    toast: 'Vulnerabilities Created',
    header: 'DisplayName,ExternalId',
    row: (n) => `${n},CVE-${Date.now().toString(36)}`,
  },
]

const openBulkUploadDialog = async (page: Page, route: string) => {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 180_000 })

  const action = page.getByRole('button', { name: 'Action', exact: true })
  await expect(action).toBeVisible({ timeout: 60_000 })
  await action.click()

  await page.getByRole('button', { name: 'Bulk Upload' }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: /^Bulk Upload/i })).toBeVisible({ timeout: 30_000 })
  return dialog
}

test.describe('bulk CSV imports — every generic table dialog actually uploads', () => {
  for (const entity of CASES) {
    test(`uploading a ${entity.slug} CSV creates the record it names`, async ({ page }) => {
      test.slow()
      const name = uniqueName(`E2E Bulk ${entity.slug}`)

      const dialog = await openBulkUploadDialog(page, entity.route)

      await uploadCsvAndAssert({
        page,
        dialog,
        fileName: `${entity.slug}.csv`,
        rows: `${entity.header}\n${entity.row(name)}\n`,
        operationName: entity.operationName,
        expectToast: entity.toast,
      })

      const expected = entity.searchText ? entity.searchText(name) : name
      await page
        .getByPlaceholder(/Search/i)
        .first()
        .fill(expected)
      await expect(page.getByRole('row').filter({ hasText: expected }).first()).toBeVisible({ timeout: 60_000 })
    })
  }
})

test.describe('bulk CSV imports — groups', () => {
  test('uploading a groups CSV creates the group it names', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Bulk group')

    const dialog = await openBulkUploadDialog(page, '/user-management/groups')

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'groups.csv',
      rows: `Name,Description\n${name},seeded by e2e\n`,
      operationName: 'CreateBulkCSVGroup',
      expectToast: 'Groups Created',
    })

    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(name)
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('bulk CSV imports — bespoke dialogs', () => {
  test('uploading a tasks CSV creates the task it names', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Bulk task')

    const dialog = await openBulkUploadDialog(page, '/automation/tasks')

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'tasks.csv',
      rows: `Title,Details\n${title},seeded by e2e\n`,
      operationName: 'CreateBulkCSVTask',
      expectToast: 'Tasks Created',
    })

    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(title)
    await expect(page.getByRole('row').filter({ hasText: title }).first()).toBeVisible({ timeout: 60_000 })
  })

  test('uploading a risks CSV creates the risk it names', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Bulk risk')

    const dialog = await openBulkUploadDialog(page, '/exposure/risks')

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'risks.csv',
      rows: `Name,Details\n${name},seeded by e2e\n`,
      operationName: 'CreateBulkCSVRisk',
      expectToast: 'Risks Created',
    })

    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(name)
    await expect(page.getByRole('row').filter({ hasText: name }).first()).toBeVisible({ timeout: 60_000 })
  })

  test('uploading an action plans CSV from the risk Mitigation tab creates the plan it names', async ({ page }) => {
    test.slow()
    const ownerApi = await getOwnerApi()
    const riskId = await createRisk(ownerApi, uniqueName('E2E Bulk ap risk'))
    const name = uniqueName('E2E Bulk actionplan')

    const dialog = await openBulkUploadDialog(page, `/exposure/risks/${riskId}?tab=mitigation`)

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'action-plans.csv',
      rows: `Name,Title\n${name},${name}\n`,
      operationName: 'CreateBulkCSVActionPlan',
      expectToast: 'Action Plans Created',
    })
  })

  test('uploading an update CSV rewrites an existing control', async ({ page }) => {
    test.slow()
    const ownerApi = await getOwnerApi()
    const refCode = uniqueRef('E2E-BULKUPD')
    const id = await createControl(ownerApi, refCode)
    const description = `rewritten by e2e ${Date.now().toString(36)}`

    await page.goto('/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.locator('.lucide-table').first().click()
    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: 'Update Existing Controls' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Bulk Update Controls' })).toBeVisible({ timeout: 30_000 })

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'controls-update.csv',
      rows: `ID,Description\n${id},${description}\n`,
      operationName: 'UpdateBulkCSVControl',
      expectToast: 'Controls Updated',
    })

    await expect.poll(async () => readField(ownerApi, 'control', id, 'description'), { timeout: 60_000 }).toBe(description)
  })
})
