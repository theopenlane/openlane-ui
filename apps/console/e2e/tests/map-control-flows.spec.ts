import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { createControl, createSubcontrol, deleteControl, deleteSubcontrol, getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueRef } from '../utils/unique'

let ownerApi: ApiSession
let sharedControlId: string
let targetRefCode: string
let targetControlId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  sharedControlId = readManifest().sharedControlId
  targetRefCode = uniqueRef('E2E-MAPTARGET')
  targetControlId = await createControl(ownerApi, targetRefCode)
})

test.afterAll(async () => {
  if (targetControlId) await deleteControl(ownerApi, targetControlId)
})

const openMapControl = async (page: Page) => {
  await page.goto(`/controls/${sharedControlId}/map-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 60_000 })
}

const cardTrigger = (page: Page, title: 'From' | 'To') =>
  page
    .getByRole('button')
    .filter({ has: page.getByRole('heading', { level: 3, name: title, exact: true }) })
    .first()

const expandMatchedGroup = async (page: Page) => {
  const group = page.getByRole('button', { name: /^Custom \d+$/ }).first()
  await expect(group).toBeVisible({ timeout: 30_000 })
  if ((await group.getAttribute('data-state')) !== 'open') await group.click()
}

const dropIntoZone = async (page: Page, refCode: string): Promise<void> => {
  const chip = page.locator('[draggable="true"]').filter({ hasText: refCode }).first()
  await expect(chip).toBeVisible({ timeout: 60_000 })
  await chip.click({ button: 'right' })
  await page.getByRole('button', { name: 'Add to Mapping' }).click()
  await expect(page.getByText('Drag controls here')).toHaveCount(0, { timeout: 30_000 })
}

const expandCard = async (page: Page, title: 'From' | 'To') => {
  const trigger = cardTrigger(page, title)
  await expect(trigger).toBeVisible({ timeout: 30_000 })
  if ((await trigger.getAttribute('data-state')) !== 'open') await trigger.click()
  await expect(page.getByPlaceholder('Search by keyword')).toBeVisible({ timeout: 30_000 })
}

const findMappingIdByTarget = async (sess: ApiSession, toControlId: string): Promise<string | null> => {
  const res = await gql<{ mappedControls: { edges: Array<{ node: { id: string } }> } }>(
    sess,
    `query($id: ID!){ mappedControls(where: { hasToControlsWith: [{ id: $id }] }) { edges { node { id } } } }`,
    { id: toControlId },
  )
  return res.data?.mappedControls?.edges?.[0]?.node?.id ?? null
}

test.describe('subcontrols — map control submission', () => {
  test('adding a target control and saving creates the mapping', async ({ page }) => {
    test.slow()
    const subcontrolId = await createSubcontrol(ownerApi, uniqueRef('E2E-MAPSUBMIT'), sharedControlId)
    const targetRef = uniqueRef('E2E-MAPSUBMITTO')
    const targetId = await createControl(ownerApi, targetRef)
    let mappingId: string | null = null

    try {
      await page.goto(`/controls/${sharedControlId}/${subcontrolId}/map-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 60_000 })

      await expandCard(page, 'To')
      await page.getByPlaceholder('Search by keyword').fill(targetRef)
      await expandMatchedGroup(page)

      await dropIntoZone(page, targetRef)

      await page.getByRole('button', { name: 'Save Changes' }).click()
      await expect(page).not.toHaveURL(/\/map-control$/, { timeout: 60_000 })

      mappingId = await findMappingIdByTarget(ownerApi, targetId)
      expect(mappingId).not.toBeNull()
    } finally {
      if (mappingId) await gql(ownerApi, `mutation($id: ID!){ deleteMappedControl(id: $id){ deletedID } }`, { id: mappingId })
      await deleteControl(ownerApi, targetId)
      await deleteSubcontrol(ownerApi, subcontrolId)
    }
  })
})

test.describe('controls — map control page', () => {
  test('expanding the To card reveals the framework, category and keyword filters', async ({ page }) => {
    test.slow()
    await openMapControl(page)

    await expandCard(page, 'To')

    await expect(page.getByText('Select Framework')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Select a category...')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByPlaceholder('Search by keyword')).toBeVisible()
  })

  test('the keyword filter narrows the matched-control results', async ({ page }) => {
    test.slow()
    await openMapControl(page)
    await expandCard(page, 'To')

    await page.getByPlaceholder('Search by keyword').fill(targetRefCode)
    await expandMatchedGroup(page)

    await expect(page.getByText(targetRefCode).first()).toBeVisible({ timeout: 60_000 })
  })

  test('a control added to the To zone can be removed again', async ({ page }) => {
    test.slow()
    await openMapControl(page)
    await expandCard(page, 'To')

    await page.getByPlaceholder('Search by keyword').fill(targetRefCode)
    await expandMatchedGroup(page)
    await dropIntoZone(page, targetRefCode)

    const remove = page.getByRole('button', { name: `Remove ${targetRefCode}` })
    await expect(remove.first()).toBeVisible({ timeout: 30_000 })
    await remove.first().click()

    await expect(page.getByText('Drag controls here')).toBeVisible({ timeout: 30_000 })
  })

  test('the From card collapses when the To card is expanded', async ({ page }) => {
    test.slow()
    await openMapControl(page)

    await expandCard(page, 'From')
    await expect(page.getByPlaceholder('Search by keyword')).toHaveCount(1, { timeout: 30_000 })

    await expandCard(page, 'To')
    await expect(page.getByPlaceholder('Search by keyword')).toHaveCount(1, { timeout: 30_000 })
  })
})
