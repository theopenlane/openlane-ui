import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, createGroup, createInternalPolicy, deleteCustomTypeEnum, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { inlineCsv } from '../utils/files'
import { expectMutationOk, uploadCsvAndAssert } from '../utils/mutations'
import { uniqueName } from '../utils/unique'

const deletePolicy = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteInternalPolicy(id: $id){ deletedID } }`, { id })
}

const findPolicyIdByName = async (sess: ApiSession, name: string): Promise<string> => {
  const res = await gql<{ internalPolicies: { edges: Array<{ node: { id: string } }> } }>(sess, `query($name: String!){ internalPolicies(where: { name: $name }) { edges { node { id } } } }`, { name })
  return res.data?.internalPolicies?.edges?.[0]?.node?.id ?? ''
}

const openCreate = async (page: Page) => {
  await page.goto('/policies/create', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible({ timeout: 60_000 })
}

const chooseFromSelect = async (page: Page, trigger: string, option: string) => {
  await page.getByRole('combobox', { name: trigger }).click()
  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible({ timeout: 20_000 })
  await listbox.getByRole('option', { name: option, exact: true }).click()
}

const openPolicies = async (page: Page) => {
  await page.goto('/policies', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const tableView = page.getByRole('button', { name: 'Table', exact: true })
  await expect(tableView).toBeVisible({ timeout: 60_000 })
  await tableView.click()
  await expect(page.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 30_000 })
}

let ownerApi: ApiSession
let policyKind: string
let policyKindId: string
let approverGroup: string
let approverGroupId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  policyKind = uniqueName('E2E Policy Kind')
  policyKindId = await createCustomTypeEnum(ownerApi, policyKind, 'kind', 'internal_policy')
  approverGroup = uniqueName('E2E Approver Group')
  approverGroupId = await createGroup(ownerApi, approverGroup)
})

test.afterAll(async () => {
  if (policyKindId) await deleteCustomTypeEnum(ownerApi, policyKindId)
  if (approverGroupId) await gql(ownerApi, `mutation($id: ID!){ deleteGroup(id: $id){ deletedID } }`, { id: approverGroupId })
})

test.describe('policies — create form metadata', () => {
  test('a policy created with type and approval metadata lands on its view page', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Policy full')
    let policyId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)

      await chooseFromSelect(page, 'Approval Required', 'True')
      await chooseFromSelect(page, 'Reviewing Frequency', 'Yearly')

      await page.getByText('Select type', { exact: true }).click()
      await page.getByRole('option', { name: policyKind }).first().click()

      await page.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(page.getByText('Policy Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page).toHaveURL(/\/policies\/[^/]+\/view/, { timeout: 60_000 })

      policyId = await findPolicyIdByName(ownerApi, name)
      expect(policyId).not.toBe('')
      await expect(page.getByText(policyKind).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (policyId) await deletePolicy(ownerApi, policyId)
    }
  })

  test('an approver group chosen on the Authority card is attached to the policy', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Policy approver')
    let policyId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)

      await page
        .getByText(/^Select approver/)
        .first()
        .click()
      await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 20_000 })
      await page.getByPlaceholder('Search...').fill(approverGroup)
      await page.getByRole('option', { name: approverGroup }).first().click()

      await page.getByRole('button', { name: /^Save Changes$/ }).click()
      await expect(page.getByText('Policy Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })

      policyId = await findPolicyIdByName(ownerApi, name)
      await expect(page.getByText(approverGroup).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (policyId) await deletePolicy(ownerApi, policyId)
    }
  })

  test('a tag added on the create form is attached to the policy', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Policy tagged')
    const tag = `e2e-policy-tag-${Date.now().toString(36)}`
    let policyId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)

      const tagInput = page.getByPlaceholder('Add tag...')
      await expect(tagInput).toBeVisible({ timeout: 30_000 })
      await tagInput.fill(tag)
      await tagInput.press('Enter')

      await page.getByRole('button', { name: /^Save Changes$/ }).click()
      await expect(page.getByText('Policy Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })

      policyId = await findPolicyIdByName(ownerApi, name)
      await expect(page.getByText(tag).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (policyId) await deletePolicy(ownerApi, policyId)
    }
  })

  test('Create another keeps the metadata and clears the title', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Policy multi')
    let policyId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)
      await chooseFromSelect(page, 'Approval Required', 'True')

      await page.getByRole('switch', { name: 'Create another policy' }).click()
      await page.getByRole('button', { name: /^Save Changes$/ }).click()

      await expect(page.getByText('Policy Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page).toHaveURL(/\/policies\/create$/, { timeout: 30_000 })
      await expect(page.getByLabel('Title', { exact: true })).toHaveValue('', { timeout: 30_000 })
      await expect(page.getByRole('combobox', { name: 'Approval Required' })).toContainText('true', { timeout: 20_000 })

      policyId = await findPolicyIdByName(ownerApi, name)
    } finally {
      if (policyId) await deletePolicy(ownerApi, policyId)
    }
  })
})

test.describe('policies — table toolbar', () => {
  let toolbarPolicyId = ''

  test.beforeAll(async () => {
    toolbarPolicyId = await createInternalPolicy(ownerApi, uniqueName('E2E Policy toolbar'))
  })

  test.afterAll(async () => {
    if (toolbarPolicyId) await deletePolicy(ownerApi, toolbarPolicyId)
  })

  test('Export to CSV queues an export job', async ({ page }) => {
    test.slow()
    await openPolicies(page)

    const exportQueued = page.waitForResponse((response) => (response.request().postData() ?? '').includes('CreateExport'), { timeout: 30_000 })
    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByText('Export to CSV', { exact: true }).click()

    expect((await exportQueued).ok()).toBe(true)
  })

  test('Bulk upload opens its CSV dialog and a CSV enables Upload', async ({ page }) => {
    test.slow()
    await openPolicies(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByText('Bulk upload', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /^Bulk upload$/ })).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()

    await dialog.locator('input[type="file"]').first().setInputFiles(inlineCsv('policies.csv', 'name,details\nE2E-POLICY-1,seeded by e2e\n'))

    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeEnabled({ timeout: 30_000 })
  })

  test('Import existing document opens the import dialog', async ({ page }) => {
    test.slow()
    await openPolicies(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByText('Import existing document', { exact: true }).click()

    await expect(page.getByRole('dialog').getByRole('heading', { name: /Import Existing Policy/ })).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('policies — bulk upload submits', () => {
  test('uploading a policies CSV creates the policy it names', async ({ page }) => {
    test.slow()
    const name = `E2E-POLICY-BULK-${Date.now().toString(36)}`
    await openPolicies(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByText('Bulk upload', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /^Bulk upload$/ })).toBeVisible({ timeout: 30_000 })

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'policies.csv',
      rows: `Name,Details\n${name},seeded by e2e\n`,
      operationName: 'CreateBulkCSVInternalPolicy',
      expectToast: 'Policies Created',
    })

    await page.keyboard.press('Escape')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()
    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('row').filter({ hasText: name }).first()).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('policies — import existing document submits', () => {
  test('uploading a document through Import creates a policy', async ({ page }) => {
    test.slow()
    await openPolicies(page)

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByText('Import existing document', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /Import Existing Policy/ })).toBeVisible({ timeout: 30_000 })

    await dialog
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: 'policy.md', mimeType: 'text/markdown', buffer: Buffer.from('# E2E policy\n\nseeded by e2e\n', 'utf-8') })

    const upload = dialog.getByRole('button', { name: /^Upload Files$/ })
    await expect(upload).toBeEnabled({ timeout: 30_000 })

    await expectMutationOk(page, 'CreateUploadInternalPolicy', async () => {
      await upload.click()
    })
    await expect(page.getByText('Policy Created').first()).toBeVisible({ timeout: 60_000 })
  })
})
