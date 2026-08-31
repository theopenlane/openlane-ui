import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, deleteCustomTypeEnum, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { pickCalendarDay } from '../utils/calendar'
import { uniqueName } from '../utils/unique'

const deleteProcedure = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteProcedure(id: $id){ deletedID } }`, { id })
}

const openCreate = async (page: Page) => {
  await page.goto('/procedures/create', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible({ timeout: 60_000 })
}

const chooseFromSelect = async (page: Page, trigger: string, option: string) => {
  await page.getByRole('combobox', { name: trigger }).click()
  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible({ timeout: 20_000 })
  await listbox.getByRole('option', { name: option, exact: true }).click()
}

let ownerApi: ApiSession
let procedureKind: string
let procedureKindId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  procedureKind = uniqueName('E2E Procedure Kind')
  procedureKindId = await createCustomTypeEnum(ownerApi, procedureKind, 'kind', 'procedure')
})

test.afterAll(async () => {
  if (procedureKindId) await deleteCustomTypeEnum(ownerApi, procedureKindId)
})

test.describe('procedures — create form', () => {
  test('a procedure created with its full metadata lands on the view page', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Procedure full')
    let procedureId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)

      await chooseFromSelect(page, 'Approval Required', 'True')
      await chooseFromSelect(page, 'Reviewing Frequency', 'Yearly')

      await page.getByText('Select type', { exact: true }).click()
      await page.getByRole('option', { name: procedureKind }).first().click()

      await page.getByRole('button', { name: /^Save Procedure$/ }).click()

      await expect(page.getByText('Procedure Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page).toHaveURL(/\/procedures\/[^/]+\/view$/, { timeout: 60_000 })

      procedureId = page.url().split('/').slice(-2)[0] ?? ''
      expect(procedureId).not.toBe('')
      await expect(page.getByText(procedureKind).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (procedureId) await deleteProcedure(ownerApi, procedureId)
    }
  })

  test('the review date calendar sets a date on the form', async ({ page }) => {
    test.slow()
    await openCreate(page)

    const calendar = page.getByRole('button', { name: /Select a date/ }).first()
    await expect(calendar).toBeVisible({ timeout: 30_000 })
    await calendar.click()

    await pickCalendarDay(page, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))

    await expect(page.getByRole('button', { name: /Select a date/ })).toHaveCount(0, { timeout: 20_000 })
  })

  test('a tag typed into the Tags card is attached to the created procedure', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Procedure tagged')
    const tag = `e2e-tag-${Date.now().toString(36)}`
    let procedureId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)

      const tagInput = page.getByPlaceholder('Add tag...')
      await expect(tagInput).toBeVisible({ timeout: 30_000 })
      await tagInput.fill(tag)
      await tagInput.press('Enter')

      await page.getByRole('button', { name: /^Save Procedure$/ }).click()
      await expect(page.getByText('Procedure Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page).toHaveURL(/\/procedures\/[^/]+\/view$/, { timeout: 60_000 })

      procedureId = page.url().split('/').slice(-2)[0] ?? ''
      await expect(page.getByText(tag).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (procedureId) await deleteProcedure(ownerApi, procedureId)
    }
  })

  test('Create another keeps the metadata and clears the title', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Procedure multi')
    let procedureId = ''

    try {
      await openCreate(page)
      await page.getByLabel('Title', { exact: true }).fill(name)
      await chooseFromSelect(page, 'Approval Required', 'True')

      await page.getByRole('switch', { name: 'Create another procedure' }).click()
      await page.getByRole('button', { name: /^Save Procedure$/ }).click()

      await expect(page.getByText('Procedure Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })

      await expect(page).toHaveURL(/\/procedures\/create$/, { timeout: 30_000 })
      await expect(page.getByLabel('Title', { exact: true })).toHaveValue('', { timeout: 30_000 })
      await expect(page.getByRole('combobox', { name: 'Approval Required' })).toContainText('true', { timeout: 20_000 })

      const found = await gql<{ procedures: { edges: Array<{ node: { id: string } }> } }>(ownerApi, `query($name: String!){ procedures(where: { name: $name }) { edges { node { id } } } }`, { name })
      procedureId = found.data?.procedures?.edges?.[0]?.node?.id ?? ''
    } finally {
      if (procedureId) await deleteProcedure(ownerApi, procedureId)
    }
  })
})
