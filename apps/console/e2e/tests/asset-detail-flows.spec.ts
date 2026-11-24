import type { Page, Request } from '@playwright/test'

import { test, expect, type AuthProfile } from '../fixtures/auth'
import { createAsset, createRisk, createVendor, getOwnerApi, gqlData, type ApiSession } from '../utils/api'
import { expectMutationOk, toast, waitForMutation } from '../utils/mutations'
import { uniqueName } from '../utils/unique'

type MutationInput = Record<string, unknown>

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const openAsset = async (page: Page, id: string, name: string, tab?: string): Promise<void> => {
  await page.goto(`/registry/assets/${id}${tab ? `?tab=${tab}` : ''}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 60_000 })
}

const pickRecord = async (page: Page, dialogName: string, fieldLabel: string, recordName: string): Promise<void> => {
  await page
    .getByRole('dialog', { name: dialogName })
    .getByRole('combobox', { name: fieldLabel, exact: true })
    .click({ position: { x: 4, y: 4 } })
  await page.getByPlaceholder('Search...').fill(recordName)
  await page.getByRole('option', { name: recordName, exact: true }).click({ timeout: 30_000 })
}

const saveDialog = async (page: Page, dialogName: string, operationName: string): Promise<MutationInput> => {
  const pending = waitForMutation(page, operationName)
  await expectMutationOk(page, operationName, async () => {
    await page
      .getByRole('dialog', { name: dialogName })
      .getByRole('button', { name: /^Save( Changes)?$/ })
      .click()
  })
  const body = (await pending).request().postDataJSON() as { variables: { input: MutationInput } }
  await expect(page.getByRole('dialog', { name: dialogName })).toBeHidden({ timeout: 30_000 })
  return body.variables.input
}

const isMutation = (request: Request, pattern: RegExp): boolean => request.method() === 'POST' && pattern.test(request.postData() ?? '')

test('vendors can be linked, changed and unlinked, and the changed vendor stays selected', async ({ page }) => {
  test.slow()
  const assetName = uniqueName('E2E Asset vendor')
  const [firstName, secondName, replacementName] = ['A', 'B', 'C'].map((suffix) => uniqueName(`E2E Asset vendor ${suffix}`))
  const [assetId, firstId, secondId, replacementId] = await Promise.all([
    createAsset(ownerApi, assetName),
    createVendor(ownerApi, firstName, firstName),
    createVendor(ownerApi, secondName, secondName),
    createVendor(ownerApi, replacementName, replacementName),
  ])

  await openAsset(page, assetId, assetName, 'vendor')
  await expect(page.getByText('No vendor linked')).toBeVisible({ timeout: 30_000 })

  for (const [name, id] of [
    [firstName, firstId],
    [secondName, secondId],
  ]) {
    await page.getByRole('button', { name: 'Link vendor', exact: true }).click()
    await pickRecord(page, 'Link vendor', 'Vendor', name)
    expect(await saveDialog(page, 'Link vendor', 'UpdateAsset')).toEqual({ addEntityIDs: [id] })
    await expect(page.getByRole('heading', { level: 2, name, exact: true })).toBeVisible({ timeout: 30_000 })
  }

  const vendorTabs = page.getByRole('tablist').filter({ has: page.getByRole('tab', { name: secondName, exact: true }) })
  await expect(vendorTabs.getByRole('tab')).toHaveCount(2)
  const lastTab = vendorTabs.getByRole('tab').last()
  const changedName = (await lastTab.innerText()).trim()
  const changedId = changedName === firstName ? firstId : secondId
  const keptName = changedName === firstName ? secondName : firstName
  await lastTab.click()
  await expect(page.getByRole('heading', { level: 2, name: changedName, exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Change vendor', exact: true }).click()
  await pickRecord(page, 'Change vendor', 'Vendor', replacementName)
  expect(await saveDialog(page, 'Change vendor', 'UpdateAsset')).toEqual({ addEntityIDs: [replacementId], removeEntityIDs: [changedId] })
  await expect(page.getByRole('heading', { level: 2, name: replacementName, exact: true })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('tab', { name: changedName, exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Unlink vendor', exact: true }).click()
  await expectMutationOk(page, 'UpdateAsset', async () => {
    await page.getByRole('alertdialog').getByRole('button', { name: 'Unlink', exact: true }).click()
  })
  await expect(page.getByRole('heading', { level: 2, name: keptName, exact: true })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('heading', { level: 2, name: replacementName, exact: true })).toHaveCount(0)
})

test('linking a second risk is refused before anything is written', async ({ page }) => {
  test.slow()
  const assetName = uniqueName('E2E Asset risk')
  const secondRiskName = uniqueName('E2E Asset risk second')
  const assetId = await createAsset(ownerApi, assetName)
  await Promise.all([createRisk(ownerApi, uniqueName('E2E Asset risk first'), { assetIDs: [assetId] }), createRisk(ownerApi, secondRiskName)])

  await openAsset(page, assetId, assetName, 'exposure')
  await expect(page.getByText(/E2E Asset risk first/).first()).toBeVisible({ timeout: 30_000 })

  const writes: string[] = []
  page.on('request', (request) => {
    if (isMutation(request, /mutation\s+(UpdateAsset|UpdateBulkRisk)\b/i)) writes.push(request.postData() ?? '')
  })

  await page.getByRole('button', { name: 'Link existing', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Associate Related Objects' })
  await dialog.getByRole('combobox').first().click()
  await page.getByRole('option', { name: /^Risks?$/ }).click()
  await dialog.getByRole('textbox').first().fill(secondRiskName)
  await dialog.getByRole('row').filter({ hasText: secondRiskName }).getByRole('checkbox').check({ timeout: 30_000 })
  await dialog.getByRole('button', { name: /^Save( Changes)?$/ }).click()

  await expect(toast(page, /An asset can be linked to one risk/)).toBeVisible({ timeout: 30_000 })
  await expect(dialog).toBeVisible()
  expect(writes).toEqual([])
})

test('Mark Reviewed creates one review and turns Inventory verified ready', async ({ page }) => {
  const assetName = uniqueName('E2E Asset reviewed')
  const assetId = await createAsset(ownerApi, assetName)

  await openAsset(page, assetId, assetName)
  await expect(page.getByText('Not reviewed in the last year')).toBeVisible({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Mark Reviewed', exact: true }).first().click()
  await expectMutationOk(page, 'CreateReview', async () => {
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Mark Reviewed', exact: true })
      .evaluate((button: HTMLButtonElement) => {
        button.click()
        button.click()
        button.click()
      })
  })

  await expect(toast(page, 'Asset marked as reviewed')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/^Last verified /)).toBeVisible({ timeout: 30_000 })
  const { reviews } = await gqlData<{ reviews: { totalCount: number } }>(ownerApi, 'reviews for asset', `query($assetId: ID!){ reviews(where: { hasAssetsWith: [{ id: $assetId }] }){ totalCount } }`, {
    assetId,
  })
  expect(reviews.totalCount).toBe(1)
})

test('connecting assets each way stores each direction once', async ({ page }) => {
  test.slow()
  const assetName = uniqueName('E2E Asset connected')
  const sourceName = uniqueName('E2E Asset source')
  const targetName = uniqueName('E2E Asset target')
  const [assetId, sourceId, targetId] = await Promise.all([createAsset(ownerApi, assetName), createAsset(ownerApi, sourceName), createAsset(ownerApi, targetName)])

  await openAsset(page, assetId, assetName, 'relationships')
  await page.getByRole('button', { name: '0 connections' }).click({ timeout: 30_000 })
  await page.getByRole('button', { name: 'Connect asset', exact: true }).click()
  await pickRecord(page, 'Connect asset', 'Connects to this', sourceName)
  await page.keyboard.press('Escape')
  await pickRecord(page, 'Connect asset', 'This connects to', targetName)
  await page.keyboard.press('Escape')
  await page.getByRole('dialog', { name: 'Connect asset' }).getByRole('button', { name: 'Save', exact: true }).click()
  await expect(toast(page, 'Connections updated')).toBeVisible({ timeout: 30_000 })

  type Edges = { edges: Array<{ node: { id: string } }> }
  const { asset } = await gqlData<{ asset: { connectedAssets: Edges; connectedFrom: Edges } }>(
    ownerApi,
    'asset connections',
    `query($id: ID!){ asset(id: $id){ connectedAssets { edges { node { id } } } connectedFrom { edges { node { id } } } } }`,
    { id: assetId },
  )
  expect(asset.connectedAssets.edges.map(({ node }) => node.id)).toEqual([targetId])
  expect(asset.connectedFrom.edges.map(({ node }) => node.id)).toEqual([sourceId])
})

const READ_ONLY_PROFILES: Array<{ profile: AuthProfile; quickActions: string[] }> = [
  { profile: 'member', quickActions: [] },
  { profile: 'readonly', quickActions: ['Upload Evidence', 'Mark Reviewed'] },
]

for (const { profile, quickActions } of READ_ONLY_PROFILES) {
  test.describe(`asset full page as ${profile}`, () => {
    test.use({ authProfile: profile })

    test('shows the asset without edit, merge or delete', async ({ page }) => {
      const assetName = uniqueName('E2E Asset read only')
      const assetId = await createAsset(ownerApi, assetName)

      await openAsset(page, assetId, assetName)
      const main = page.locator('main')
      await expect(main.getByText('Audit Readiness')).toBeVisible({ timeout: 30_000 })
      await expect(main.getByText('No vulnerability scan in the last 90 days')).toBeVisible({ timeout: 30_000 })
      await expect(main.getByRole('button', { name: 'Customize tabs' })).toBeVisible()

      for (const action of quickActions) await expect(main.getByRole('button', { name: action, exact: true }).first()).toBeVisible({ timeout: 30_000 })
      for (const action of ['Upload Evidence', 'Map Control', 'Link Exposure', 'Mark Reviewed'].filter((name) => !quickActions.includes(name))) {
        await expect(main.getByRole('button', { name: action, exact: true })).toHaveCount(0)
      }
      await expect(page.getByRole('button', { name: 'Edit asset' })).toHaveCount(0)
      await expect(page.getByTestId('asset-actions-menu')).toHaveCount(0)
    })
  })
}
