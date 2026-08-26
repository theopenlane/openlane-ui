import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, createGroup, createRisk, deleteCustomTypeEnum, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const deleteRisk = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteRisk(id: $id){ deletedID } }`, { id })
}

const openCreate = async (page: Page) => {
  await page.goto('/exposure/risks/create', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 60_000 })
}

let ownerApi: ApiSession
let riskKind: string
let riskKindId: string
let riskCategory: string
let riskCategoryId: string
let stakeholderGroup: string
let stakeholderGroupId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  riskKind = uniqueName('E2E Risk Kind')
  riskCategory = uniqueName('E2E Risk Category')
  riskKindId = await createCustomTypeEnum(ownerApi, riskKind, 'kind', 'risk')
  riskCategoryId = await createCustomTypeEnum(ownerApi, riskCategory, 'category', 'risk')
  stakeholderGroup = uniqueName('E2E Stakeholder Group')
  stakeholderGroupId = await createGroup(ownerApi, stakeholderGroup)
})

test.afterAll(async () => {
  if (riskKindId) await deleteCustomTypeEnum(ownerApi, riskKindId)
  if (riskCategoryId) await deleteCustomTypeEnum(ownerApi, riskCategoryId)
  if (stakeholderGroupId) await gql(ownerApi, `mutation($id: ID!){ deleteGroup(id: $id){ deletedID } }`, { id: stakeholderGroupId })
})

test.describe('exposure — risk create properties', () => {
  test('a Type chosen on the create form lands on the created risk', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Risk typed')
    let riskId = ''

    try {
      await openCreate(page)
      await page.getByLabel(/^Title$/).fill(name)

      await page.getByText('Select type', { exact: true }).click()
      await page.getByRole('option', { name: riskKind }).click()
      await expect(page.getByText('Select type', { exact: true })).toHaveCount(0, { timeout: 20_000 })

      await page.getByRole('button', { name: /^Create risk$/ }).click()

      await expect(page).toHaveURL(/\/exposure\/risks\/[^/]+$/, { timeout: 90_000 })
      riskId = page.url().split('/').pop() ?? ''
      await expect(page.getByText(riskKind).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (riskId) await deleteRisk(ownerApi, riskId)
    }
  })

  test('a Category chosen on the create form lands on the created risk', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Risk categorised')
    let riskId = ''

    try {
      await openCreate(page)
      await page.getByLabel(/^Title$/).fill(name)

      await page.getByText('Select category', { exact: true }).click()
      await page.getByRole('option', { name: riskCategory }).click()
      await expect(page.getByText('Select category', { exact: true })).toHaveCount(0, { timeout: 20_000 })

      await page.getByRole('button', { name: /^Create risk$/ }).click()

      await expect(page).toHaveURL(/\/exposure\/risks\/[^/]+$/, { timeout: 90_000 })
      riskId = page.url().split('/').pop() ?? ''
      await expect(page.getByText(riskCategory).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (riskId) await deleteRisk(ownerApi, riskId)
    }
  })

  test('a Stakeholder group chosen on the create form lands on the created risk', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Risk with stakeholder')
    let riskId = ''

    try {
      await openCreate(page)
      await page.getByLabel(/^Title$/).fill(name)

      await page.getByText('Select stakeholder...', { exact: true }).click()
      await expect(page.getByPlaceholder('Search groups...')).toBeVisible({ timeout: 20_000 })
      await page.getByPlaceholder('Search groups...').fill(stakeholderGroup)
      await page.getByRole('option', { name: stakeholderGroup }).first().click()

      await expect(page.getByText('Select stakeholder...', { exact: true })).toHaveCount(0, { timeout: 20_000 })

      await page.getByRole('button', { name: /^Create risk$/ }).click()

      await expect(page).toHaveURL(/\/exposure\/risks\/[^/]+$/, { timeout: 90_000 })
      riskId = page.url().split('/').pop() ?? ''
      await expect(page.getByText(stakeholderGroup).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (riskId) await deleteRisk(ownerApi, riskId)
    }
  })

  test('the Likelihood select offers every likelihood option', async ({ page }) => {
    test.slow()
    await openCreate(page)

    await page.getByText('Select likelihood', { exact: true }).click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 20_000 })

    for (const option of ['Unlikely', 'Likely', 'Highly Likely']) {
      await expect(listbox.getByRole('option', { name: option, exact: true })).toBeVisible({ timeout: 15_000 })
    }
  })
})
