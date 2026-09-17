import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { createSubcontrol, deleteSubcontrol, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const sheet = (page: Page): Locator => page.getByRole('dialog')

let ownerApi: ApiSession
let controlId: string
let subcontrolId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  controlId = readManifest().sharedControlId
  subcontrolId = await createSubcontrol(ownerApi, uniqueRef('E2E-SUBDETAIL'), controlId)
})

test.afterAll(async () => {
  if (subcontrolId) await deleteSubcontrol(ownerApi, subcontrolId)
})

const openSubroute = async (page: Page, subroute: string) => {
  await page.goto(`/controls/${controlId}/${subcontrolId}/${subroute}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
}

test.describe('subcontrols — control objectives', () => {
  test.describe.configure({ mode: 'serial' })

  test('an objective created on a subcontrol can be renamed and deleted', async ({ page }) => {
    test.slow()
    await openSubroute(page, 'control-objectives')
    await expect(page.getByRole('heading', { name: 'Control Objectives' })).toBeVisible({ timeout: 60_000 })

    const name = uniqueName('E2E Sub Objective')
    await page
      .getByRole('button', { name: /^Create$/ })
      .first()
      .click()
    await expect(sheet(page).getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
    await sheet(page).getByRole('textbox').first().fill(name)
    await sheet(page)
      .getByRole('button', { name: /^Create$/ })
      .click()
    await expect(toast(page, 'Control Objective created')).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'Objective actions' }).last().click()
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(sheet(page).getByRole('textbox').first()).toHaveValue(name, { timeout: 30_000 })

    const renamed = `${name} revised`
    await sheet(page).getByRole('textbox').first().fill(renamed)
    await sheet(page).getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(page, 'Control Objective updated')).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'Objective actions' }).last().click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(toast(page, 'Control Objective deleted')).toBeVisible({ timeout: 60_000 })
  })

  test('creating an objective without a name is rejected on the subcontrol route', async ({ page }) => {
    test.slow()
    await openSubroute(page, 'control-objectives')
    await expect(page.getByRole('heading', { name: 'Control Objectives' })).toBeVisible({ timeout: 60_000 })

    await page
      .getByRole('button', { name: /^Create$/ })
      .first()
      .click()
    await expect(sheet(page).getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
    await sheet(page)
      .getByRole('button', { name: /^Create$/ })
      .click()

    await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, 'Control Objective created')).toBeHidden()
  })
})

test.describe('subcontrols — control implementations', () => {
  test.describe.configure({ mode: 'serial' })

  test('an implementation created on a subcontrol can be edited and deleted', async ({ page }) => {
    test.slow()
    await openSubroute(page, 'control-implementation')
    await expect(page.getByRole('heading', { name: 'Control Implementations' }).or(page.getByText('Create a new one'))).toBeVisible({ timeout: 60_000 })

    await page
      .getByText('Create a new one')
      .or(page.getByRole('button', { name: /^Create$/ }).first())
      .first()
      .click()
    await expect(sheet(page).getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
    await sheet(page)
      .getByRole('button', { name: /^Create$/ })
      .click()
    await expect(toast(page, 'Control Implementation created')).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'Implementation actions' }).last().click()
    await page.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(sheet(page).getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 30_000 })
    await sheet(page).getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(page, 'Control Implementation updated')).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'Implementation actions' }).last().click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(toast(page, 'Control Implementation deleted')).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('subcontrols — map control', () => {
  test('the subcontrol mapping route renders the From and To cards', async ({ page }) => {
    test.slow()
    await openSubroute(page, 'map-control')

    await expect(page.getByText('From', { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('To', { exact: true })).toBeVisible({ timeout: 30_000 })
  })

  test('the relation type selector offers every mapping type on the subcontrol route', async ({ page }) => {
    test.slow()
    await openSubroute(page, 'map-control')

    await expect(page.getByText('Relation type', { exact: true })).toBeVisible({ timeout: 60_000 })
    await page
      .getByRole('combobox')
      .filter({ hasText: /^(Equal|Subset|Intersection|Partial|Superset)$/ })
      .first()
      .click()

    for (const option of ['Equal', 'Subset', 'Intersection', 'Partial', 'Superset']) {
      await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible({ timeout: 15_000 })
    }
  })

  test('saving a subcontrol mapping with no target control is rejected', async ({ page }) => {
    test.slow()
    await openSubroute(page, 'map-control')

    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(toast(page, 'From control is required').or(toast(page, 'To control is required'))).toBeVisible({ timeout: 30_000 })
    await expect(toast(page, 'Map Control created!')).toBeHidden()
  })
})
