import type { Page } from '@playwright/test'

import { test, expect, type Role } from '../fixtures/auth'
import { createProcedure, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { inlineCsv } from '../utils/files'
import { expectMutationOk, uploadCsvAndAssert } from '../utils/mutations'
import { uniqueName } from '../utils/unique'
import { PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON } from '../utils/permission-gating'

const deleteProcedure = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteProcedure(id: $id){ deletedID } }`, { id })
}

const openProcedures = async (page: Page) => {
  await page.goto('/procedures', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Action' })).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('row').nth(1)).toBeVisible({ timeout: 30_000 })
}

const openActionMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'Action' }).click()
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('procedures — table toolbar', () => {
  let toolbarProcedureId = ''

  test.beforeAll(async () => {
    toolbarProcedureId = await createProcedure(ownerApi, uniqueName('E2E Procedure toolbar'))
  })

  test.afterAll(async () => {
    if (toolbarProcedureId) await deleteProcedure(ownerApi, toolbarProcedureId)
  })

  test('Export to CSV queues an export job', async ({ page }) => {
    test.slow()
    await openProcedures(page)

    const exportQueued = page.waitForResponse((response) => (response.request().postData() ?? '').includes('CreateExport'), { timeout: 30_000 })
    await openActionMenu(page)
    await page.getByText('Export to CSV', { exact: true }).click()

    expect((await exportQueued).ok()).toBe(true)
  })

  test('Bulk upload opens its CSV dialog and a CSV enables Upload', async ({ page }) => {
    test.slow()
    await openProcedures(page)

    await openActionMenu(page)
    await page.getByText('Bulk upload', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /^Bulk upload$/ })).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()

    await dialog.locator('input[type="file"]').first().setInputFiles(inlineCsv('procedures.csv', 'name,details\nE2E-PROC-1,seeded by e2e\n'))

    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeEnabled({ timeout: 30_000 })
  })

  test('Import existing document opens the import dialog', async ({ page }) => {
    test.slow()
    await openProcedures(page)

    await openActionMenu(page)
    await page.getByText('Import existing document', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /Import Existing Procedure/ })).toBeVisible({ timeout: 30_000 })
  })

  test('sorting by Name reverses the order of a searched procedure pair', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E ProcSort')
    const first = `${prefix} Alpha`
    const last = `${prefix} Zulu`
    const ids = await Promise.all([createProcedure(ownerApi, first), createProcedure(ownerApi, last)])

    try {
      await openProcedures(page)
      await page.getByPlaceholder(/^Search$/).fill(prefix)

      const nameCells = page.getByRole('cell').filter({ hasText: prefix })
      await expect(nameCells).toHaveCount(2, { timeout: 30_000 })
      const namesInOrder = async (): Promise<string[]> => (await nameCells.allInnerTexts()).map((text) => text.trim())

      const header = page.getByRole('button', { name: 'Name', exact: true })
      await expect(header).toBeVisible({ timeout: 30_000 })

      const namesSettled = async (): Promise<string[]> => {
        let previous: string[] = []
        await expect
          .poll(
            async () => {
              const current = await namesInOrder()
              const stable = current.length === 2 && current.join('|') === previous.join('|')
              previous = current
              return stable
            },
            { timeout: 30_000, intervals: [300] },
          )
          .toBe(true)
        return previous
      }

      const nameHeader = page.getByRole('columnheader').filter({ hasText: 'Name' }).first()
      await expect
        .poll(
          async () => {
            if ((await nameHeader.getAttribute('aria-sort')) === 'ascending') return true
            await header.click()
            return false
          },
          { timeout: 40_000, intervals: [500] },
        )
        .toBe(true)
      expect(await namesSettled()).toEqual([first, last])

      await header.click()
      await expect.poll(async () => nameHeader.getAttribute('aria-sort'), { timeout: 20_000 }).toBe('descending')
      await expect.poll(namesInOrder, { timeout: 30_000 }).toEqual([last, first])
    } finally {
      await Promise.all(ids.map((id) => deleteProcedure(ownerApi, id)))
    }
  })

  test('the procedure table paginates a searched set across two pages', async ({ page }) => {
    test.slow()
    const prefix = uniqueName('E2E ProcPage')
    const ids: string[] = []
    for (let index = 1; index <= 11; index += 1) ids.push(await createProcedure(ownerApi, `${prefix} ${index}`))

    try {
      await openProcedures(page)
      await page.getByPlaceholder(/^Search$/).fill(prefix)

      await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 60_000 })
      const firstPage = await page.getByRole('row').allInnerTexts()

      const next = page.getByRole('button', { name: 'Next page' })
      await expect
        .poll(
          async () => {
            if (
              await page
                .getByText('Page 2 of 2')
                .isVisible()
                .catch(() => false)
            )
              return true
            if (await next.isEnabled().catch(() => false)) await next.click()
            return false
          },
          { timeout: 30_000 },
        )
        .toBe(true)

      await expect.poll(async () => page.getByRole('row').allInnerTexts(), { timeout: 30_000 }).not.toEqual(firstPage)
    } finally {
      for (const id of ids) await deleteProcedure(ownerApi, id)
    }
  })
})

test.describe('procedures — create button is permission gated', () => {
  test.skip(!PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON)
  test('the owner sees the Create button', async ({ page }) => {
    test.slow()
    await openProcedures(page)
    await expect(page.getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
  })
})

for (const role of ['member', 'readonly'] as Role[]) {
  test.describe(`procedures — ${role} cannot create`, () => {
    test.use({ authProfile: role })
    test.skip(!PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON)

    test(`${role} sees no Create button on the procedures table`, async ({ page }) => {
      test.slow()
      await page.goto('/procedures', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByRole('button', { name: /^Create$/ })).toHaveCount(0)
    })

    test(`${role} is blocked from the procedure edit page`, async ({ page }) => {
      test.slow()
      const id = await createProcedure(ownerApi, uniqueName('E2E Procedure gated'))

      try {
        await page.goto(`/procedures/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
        await expect(page.getByText(/protected area/i).or(page.getByText(/don't have permission/i))).toBeVisible({ timeout: 60_000 })
      } finally {
        await deleteProcedure(ownerApi, id)
      }
    })
  })
}

test.describe('procedures — bulk upload submits', () => {
  test('uploading a procedures CSV creates the procedure it names', async ({ page }) => {
    test.slow()
    const name = `E2E-PROC-BULK-${Date.now().toString(36)}`
    await openProcedures(page)

    await openActionMenu(page)
    await page.getByText('Bulk upload', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /^Bulk upload$/ })).toBeVisible({ timeout: 30_000 })

    await uploadCsvAndAssert({
      page,
      dialog,
      fileName: 'procedures.csv',
      rows: `Name,Details\n${name},seeded by e2e\n`,
      operationName: 'CreateBulkCSVProcedure',
      expectToast: 'Procedure Created',
    })

    await page.keyboard.press('Escape')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('row').filter({ hasText: name }).first()).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('procedures — import existing document submits', () => {
  test('uploading a document through Import creates a procedure', async ({ page }) => {
    test.slow()
    await openProcedures(page)

    await openActionMenu(page)
    await page.getByText('Import existing document', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: /Import Existing Procedure/ })).toBeVisible({ timeout: 30_000 })

    await dialog
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: 'procedure.md', mimeType: 'text/markdown', buffer: Buffer.from('# E2E procedure\n\nseeded by e2e\n', 'utf-8') })

    const upload = dialog.getByRole('button', { name: /^Upload$/ })
    await expect(upload).toBeEnabled({ timeout: 30_000 })

    await expectMutationOk(page, 'CreateUploadProcedure', async () => {
      await upload.click()
    })
    await expect(page.getByText('Procedure Created').first()).toBeVisible({ timeout: 60_000 })
  })
})
