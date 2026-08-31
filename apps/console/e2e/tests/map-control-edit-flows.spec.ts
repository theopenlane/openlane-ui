import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { createControl, createMappedControl, createSubcontrol, deleteControl, deleteMappedControl, deleteSubcontrol, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

let ownerApi: ApiSession
let fromControlId: string
let toControlId: string
let toRefCode: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  fromControlId = readManifest().sharedControlId
  toRefCode = uniqueRef('E2E-MAPTO')
  toControlId = await createControl(ownerApi, toRefCode)
})

test.afterAll(async () => {
  if (toControlId) await deleteControl(ownerApi, toControlId)
})

const openEditMapping = async (page: Page, mappedControlId: string) => {
  await page.goto(`/controls/${fromControlId}/edit-map-control?mappedControlId=${mappedControlId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 60_000 })
}

test.describe('controls — edit an existing control mapping', () => {
  test('the saved mapping loads into the relation form', async ({ page }) => {
    test.slow()
    const mappedControlId = await createMappedControl(ownerApi, fromControlId, toControlId, 'SUBSET')

    try {
      await openEditMapping(page, mappedControlId)

      await expect(page.getByRole('combobox').filter({ hasText: /^Subset$/ })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText(readManifest().sharedControlRefCode).first()).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText(toRefCode).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteMappedControl(ownerApi, mappedControlId)
    }
  })

  test('changing the relation type and description persists', async ({ page }) => {
    test.slow()
    const mappedControlId = await createMappedControl(ownerApi, fromControlId, toControlId, 'EQUAL')
    const description = uniqueName('E2E mapping note')

    try {
      await openEditMapping(page, mappedControlId)

      await page
        .getByRole('combobox')
        .filter({ hasText: /^Equal$/ })
        .click()
      await page.getByRole('option', { name: 'Superset', exact: true }).click()
      await page.getByPlaceholder('Add description...').fill(description)
      await page.getByRole('button', { name: 'Save Changes' }).click()

      await expect(toast(page, 'Map Control updated!')).toBeVisible({ timeout: 60_000 })

      await openEditMapping(page, mappedControlId)
      await expect(page.getByRole('combobox').filter({ hasText: /^Superset$/ })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByPlaceholder('Add description...')).toHaveValue(description, { timeout: 30_000 })
    } finally {
      await deleteMappedControl(ownerApi, mappedControlId)
    }
  })

  test('deleting the mapping asks for confirmation and reports success', async ({ page }) => {
    test.slow()
    const mappedControlId = await createMappedControl(ownerApi, fromControlId, toControlId)
    let deletedInUi = false

    try {
      await openEditMapping(page, mappedControlId)

      await page.getByRole('button', { name: /^Delete mapping$/ }).click()
      const confirmation = page.getByRole('alertdialog')
      await expect(confirmation.getByRole('heading', { name: /^Delete mapping$/ })).toBeVisible({ timeout: 15_000 })
      await confirmation.getByRole('button', { name: /^Delete$/ }).click()

      await expect(toast(page, 'Mapping deleted')).toBeVisible({ timeout: 60_000 })
      deletedInUi = true
    } finally {
      if (!deletedInUi) await deleteMappedControl(ownerApi, mappedControlId)
    }
  })

  test('the subcontrol edit-mapping route loads the same relation form', async ({ page }) => {
    test.slow()
    const subcontrolId = await createSubcontrol(ownerApi, uniqueRef('E2E-MAPSUB'), fromControlId)
    const mappedControlId = await createMappedControl(ownerApi, fromControlId, toControlId)

    try {
      await page.goto(`/controls/${fromControlId}/${subcontrolId}/edit-map-control?mappedControlId=${mappedControlId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

      await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText('From', { exact: true })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByText('To', { exact: true })).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteMappedControl(ownerApi, mappedControlId)
      await deleteSubcontrol(ownerApi, subcontrolId)
    }
  })
})
