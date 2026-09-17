import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createActionPlan, createRisk, deleteActionPlan, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

let ownerApi: ApiSession
let riskId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  riskId = await createRisk(ownerApi, uniqueName('E2E Risk for action plans'))
})

test.afterAll(async () => {
  if (riskId) await gql(ownerApi, `mutation($id: ID!){ deleteRisk(id: $id){ deletedID } }`, { id: riskId })
})

const findActionPlanId = async (sess: ApiSession, name: string): Promise<string | undefined> => {
  const res = await gql<{ actionPlans: { edges: Array<{ node: { id: string } }> } }>(sess, `query($n: String!){ actionPlans(where: { nameContainsFold: $n }, first: 1){ edges { node { id } } } }`, {
    n: name,
  })
  return res.data?.actionPlans?.edges?.[0]?.node?.id
}

const openActionPlanSheet = async (page: Page, id: string) => {
  await page.goto(`/exposure/risks/${riskId}?tab=mitigation&id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 60_000 })
  return sheet
}

test.describe('exposure — action plans on a risk', () => {
  test('an action plan created from the Mitigation tab is persisted', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Action Plan')
    let id: string | undefined

    try {
      await page.goto(`/exposure/risks/${riskId}?tab=mitigation&create=true`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      const sheet = page.getByRole('dialog')
      await expect(sheet).toBeVisible({ timeout: 60_000 })
      await expect(sheet.getByText('Create Action Plan', { exact: true }).first()).toBeVisible({ timeout: 20_000 })

      await sheet.getByRole('textbox').first().fill(name)
      await sheet.getByLabel(/^Title$/).fill(name)
      await sheet.getByRole('button', { name: /^Create$/ }).click()

      await expect.poll(async () => Boolean(await findActionPlanId(ownerApi, name)), { timeout: 60_000 }).toBe(true)
      id = await findActionPlanId(ownerApi, name)
    } finally {
      if (!id) id = await findActionPlanId(ownerApi, name)
      if (id) await deleteActionPlan(ownerApi, id)
    }
  })

  test('editing an action plan from its detail sheet persists', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Action Plan edit')
    const renamed = `${name} revised`
    const id = await createActionPlan(ownerApi, name, { riskIDs: [riskId], priority: 'MEDIUM' })

    try {
      const sheet = await openActionPlanSheet(page, id)
      await sheet
        .locator('button')
        .filter({ hasText: /^Edit$/ })
        .first()
        .click()

      const primary = sheet.getByRole('textbox').first()
      await expect(primary).toBeEditable({ timeout: 30_000 })
      await primary.fill(renamed)
      await sheet.getByRole('button', { name: /^Save( Changes)?$/ }).click()

      await expect.poll(async () => Boolean(await findActionPlanId(ownerApi, renamed)), { timeout: 60_000 }).toBe(true)
    } finally {
      await deleteActionPlan(ownerApi, id)
    }
  })

  test('deleting an action plan from its detail sheet removes it', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Action Plan delete')
    const id = await createActionPlan(ownerApi, name, { riskIDs: [riskId], priority: 'MEDIUM' })
    let deleted = false

    try {
      const sheet = await openActionPlanSheet(page, id)
      await sheet
        .locator('button')
        .filter({ hasText: /^Delete$/ })
        .first()
        .click()

      const confirmation = page.getByRole('alertdialog')
      await expect(confirmation).toBeVisible({ timeout: 20_000 })
      await confirmation
        .getByRole('button')
        .filter({ hasText: /^Delete$/ })
        .first()
        .click()

      await expect.poll(async () => findActionPlanId(ownerApi, name), { timeout: 60_000 }).toBeFalsy()
      deleted = true
    } finally {
      if (!deleted) await deleteActionPlan(ownerApi, id)
    }
  })
})
