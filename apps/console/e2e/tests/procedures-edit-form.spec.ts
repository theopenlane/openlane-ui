import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, createGroup, createProcedure, deleteCustomTypeEnum, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const deleteProcedure = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteProcedure(id: $id){ deletedID } }`, { id })
}

const openEdit = async (page: Page, id: string) => {
  await page.goto(`/procedures/${id}/edit`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible({ timeout: 60_000 })
}

const chooseFromSelect = async (page: Page, trigger: string, option: string) => {
  await page.getByRole('combobox', { name: trigger }).click()
  const listbox = page.getByRole('listbox')
  await expect(listbox).toBeVisible({ timeout: 20_000 })
  await listbox.getByRole('option', { name: option, exact: true }).click()
}

const save = async (page: Page) => {
  await page
    .getByRole('button', { name: /^Save$/ })
    .first()
    .click()
}

let ownerApi: ApiSession
let procedureKind: string
let procedureKindId: string
let approverGroup: string
let approverGroupId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  procedureKind = uniqueName('E2E Proc Kind edit')
  procedureKindId = await createCustomTypeEnum(ownerApi, procedureKind, 'kind', 'procedure')
  approverGroup = uniqueName('E2E Proc Approver')
  approverGroupId = await createGroup(ownerApi, approverGroup)
})

test.afterAll(async () => {
  if (procedureKindId) await deleteCustomTypeEnum(ownerApi, procedureKindId)
  if (approverGroupId) await gql(ownerApi, `mutation($id: ID!){ deleteGroup(id: $id){ deletedID } }`, { id: approverGroupId })
})

test.describe('procedures — edit form', () => {
  test('approval required and review frequency persist through the edit form', async ({ page }) => {
    test.slow()
    const id = await createProcedure(ownerApi, uniqueName('E2E Procedure edit meta'))

    try {
      await openEdit(page, id)
      await chooseFromSelect(page, 'Approval Required', 'True')
      await chooseFromSelect(page, 'Reviewing Frequency', 'Yearly')
      await save(page)

      await expect(page.getByText(/Procedure (Updated|updated)/).first()).toBeVisible({ timeout: 60_000 })

      await openEdit(page, id)
      await expect(page.getByRole('combobox', { name: 'Approval Required' })).toContainText('true', { timeout: 30_000 })
      await expect(page.getByRole('combobox', { name: 'Reviewing Frequency' })).toContainText('Yearly', { timeout: 30_000 })
    } finally {
      await deleteProcedure(ownerApi, id)
    }
  })

  test('the procedure type creatable select persists the chosen kind', async ({ page }) => {
    test.slow()
    const id = await createProcedure(ownerApi, uniqueName('E2E Procedure edit kind'))

    try {
      await openEdit(page, id)

      await page.getByText('Select type', { exact: true }).click()
      await page.getByRole('option', { name: procedureKind }).first().click()
      await save(page)

      await expect(page.getByText(/Procedure (Updated|updated)/).first()).toBeVisible({ timeout: 60_000 })

      await openEdit(page, id)
      await expect(page.getByText(procedureKind).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteProcedure(ownerApi, id)
    }
  })

  test('an approver group set from the Authority card persists', async ({ page }) => {
    test.slow()
    const id = await createProcedure(ownerApi, uniqueName('E2E Procedure edit approver'))

    try {
      await openEdit(page, id)

      await page
        .getByText(/^Select approver/)
        .first()
        .click()
      await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 20_000 })
      await page.getByPlaceholder('Search...').fill(approverGroup)
      await page.getByRole('option', { name: approverGroup }).first().click()
      await save(page)

      await expect(page.getByText(/Procedure (Updated|updated)/).first()).toBeVisible({ timeout: 60_000 })

      await openEdit(page, id)
      await expect(page.getByText(approverGroup).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteProcedure(ownerApi, id)
    }
  })

  test('a tag added from the edit form persists', async ({ page }) => {
    test.slow()
    const id = await createProcedure(ownerApi, uniqueName('E2E Procedure edit tag'))
    const tag = `e2e-proc-tag-${Date.now().toString(36)}`

    try {
      await openEdit(page, id)

      const tagInput = page.getByPlaceholder('Add tag...')
      await expect(tagInput).toBeVisible({ timeout: 30_000 })
      await tagInput.fill(tag)
      await page.getByRole('option', { name: `Create "${tag}"` }).click()
      await expect(page.getByText(tag, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
      await save(page)

      await expect(page.getByText(/Procedure (Updated|updated)/).first()).toBeVisible({ timeout: 60_000 })

      await openEdit(page, id)
      await expect(page.getByText(tag).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteProcedure(ownerApi, id)
    }
  })

  test('clearing the title blocks the save with a validation message', async ({ page }) => {
    test.slow()
    const id = await createProcedure(ownerApi, uniqueName('E2E Procedure edit invalid'))

    try {
      await openEdit(page, id)
      await page.getByLabel('Title', { exact: true }).fill('')
      await save(page)

      await expect(page).toHaveURL(/\/edit$/, { timeout: 20_000 })
      await expect(page.getByText(/Procedure (Updated|updated)/)).toHaveCount(0)
    } finally {
      await deleteProcedure(ownerApi, id)
    }
  })
})
