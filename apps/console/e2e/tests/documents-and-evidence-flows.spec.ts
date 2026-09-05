import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'
import { expectMutationOk } from '../utils/mutations'
import { SAMPLE_PDF, SAMPLE_PNG, uploadFiles } from '../utils/files'
import { createIdentityHolder, createPlatform, createVendor, deletePlatform, getOwnerApi, type ApiSession } from '../utils/api'

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const openUploadDialog = async (page: Page) => {
  const dialog = page.getByRole('dialog')
  await expect(async () => {
    if (!(await dialog.isVisible().catch(() => false))) {
      await page
        .getByRole('button', { name: /^Upload$/ })
        .first()
        .click({ timeout: 5_000 })
    }
    await expect(dialog.getByRole('heading', { name: /^Upload Documents?$/ })).toBeVisible({ timeout: 5_000 })
  }).toPass({ timeout: 60_000 })
  return dialog
}

const uploadDocument = async (page: Page, operationName: string) => {
  const dialog = await openUploadDialog(page)
  await uploadFiles(page, SAMPLE_PDF, dialog.locator('input[type="file"]').first())

  const upload = dialog.getByRole('button', { name: /^Upload$/ })
  await expect(upload).toBeEnabled({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await upload.click()
  })
  await expect(page.getByText('Documents uploaded').first()).toBeVisible({ timeout: 60_000 })
}

const markLastDocumentAsEvidence = async (page: Page, evidenceName: string) => {
  await page
    .getByRole('button', { name: /^Mark as evidence$/i })
    .first()
    .click()

  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: /^Mark as Evidence$/i })).toBeVisible({ timeout: 30_000 })
  await dialog.getByRole('textbox').first().fill(evidenceName)

  await expectMutationOk(page, 'CreateEvidence', async () => {
    await dialog.getByRole('button', { name: /^Create Evidence$/ }).click()
  })
  await expect(page.getByText('Marked as evidence').first()).toBeVisible({ timeout: 60_000 })
}

test.describe('vendor documents', () => {
  test('a document is uploaded and then marked as evidence', async ({ page }) => {
    test.slow()
    const vendorId = await createVendor(ownerApi, uniqueName('E2E Vendor docs'))

    await page.goto(`/registry/vendors/${vendorId}?tab=documents`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await uploadDocument(page, 'UpdateEntityWithFiles')

    await markLastDocumentAsEvidence(page, uniqueName('E2E Vendor evidence'))
  })
})

test.describe('personnel documents', () => {
  test('a document is uploaded and then marked as evidence', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Personnel docs')
    const id = await createIdentityHolder(ownerApi, name, `${name.replace(/[^a-z0-9]/gi, '').toLowerCase()}@e2e-openlane.dev`)

    await page.goto(`/registry/personnel/${id}?tab=documents`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await uploadDocument(page, 'UpdateIdentityHolderWithFiles')

    await markLastDocumentAsEvidence(page, uniqueName('E2E Personnel evidence'))
  })
})

test.describe('platform diagrams', () => {
  test('a diagram is uploaded and marked as evidence', async ({ page }) => {
    test.slow()
    const id = await createPlatform(ownerApi, uniqueName('E2E Platform diagram'))

    try {
      await page.goto(`/registry/platforms/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      const addDiagram = page.getByRole('button', { name: 'Add Diagram' })
      await expect(addDiagram).toBeVisible({ timeout: 30_000 })
      await addDiagram.click()

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByRole('heading', { name: 'Add Diagram' })).toBeVisible({ timeout: 30_000 })

      await dialog.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Architecture Diagram' }).click()
      await uploadFiles(page, SAMPLE_PNG, dialog.locator('input[type="file"]').first())

      await expectMutationOk(page, 'UpdatePlatform', async () => {
        await dialog
          .getByRole('button', { name: /^(Upload|Add|Save)/ })
          .last()
          .click()
      })
      await expect(page.getByText('Diagram uploaded').first()).toBeVisible({ timeout: 60_000 })

      await markLastDocumentAsEvidence(page, uniqueName('E2E Platform evidence'))
    } finally {
      await deletePlatform(ownerApi, id)
    }
  })
})
