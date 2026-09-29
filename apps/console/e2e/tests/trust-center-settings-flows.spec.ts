import type { Page, Route } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { createSubprocessor, createTrustCenterSubprocessor, getDemoApi, getTrustCenterId, gql, type ApiSession } from '../utils/api'
import { expectMutationOk, toast } from '../utils/mutations'
import { uniqueName } from '../utils/unique'

const requireDemoOrg = () => test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')

const openTrustCenterPage = async (page: Page, route: string) => {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })
}

interface LiveSetting {
  id: string
  noindexDefaultDomain: boolean | null
}

const readLiveSetting = async (sess: ApiSession): Promise<LiveSetting> => {
  const res = await gql<{ trustCenters: { edges: Array<{ node: { setting: LiveSetting | null } }> } }>(sess, `{ trustCenters(first: 1) { edges { node { setting { id noindexDefaultDomain } } } } }`)
  const setting = res.data?.trustCenters?.edges?.[0]?.node?.setting
  if (!setting) throw new Error('readLiveSetting: demo trust center has no live setting')
  return setting
}

const setNoIndex = async (sess: ApiSession, settingId: string, value: boolean): Promise<void> => {
  const res = await gql(sess, `mutation($id: ID!, $input: UpdateTrustCenterSettingInput!){ updateTrustCenterSetting(id: $id, input: $input){ trustCenterSetting { id } } }`, {
    id: settingId,
    input: { noindexDefaultDomain: value },
  })
  if (res.errors?.length) throw new Error(`setNoIndex failed: ${JSON.stringify(res.errors)}`)
}

const deleteSubprocessorQuietly = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteSubprocessor(id: $id){ deletedID } }`, { id })
}

const deleteTrustCenterSubprocessorQuietly = async (sess: ApiSession, id: string): Promise<void> => {
  await gql(sess, `mutation($id: ID!){ deleteTrustCenterSubprocessor(id: $id){ deletedID } }`, { id })
}

interface TrustCenterPayload {
  data?: {
    trustCenters?: {
      edges?: Array<{ node: { previewDomain: { cnameRecord: string | null } | null; previewSetting: { title?: string | null } | null } }>
    }
  }
}

const isGetTrustCenter = (route: Route): boolean => {
  const body = route.request().postData() ?? ''
  return route.request().method() === 'POST' && /"operationName":"GetTrustCenter"|query GetTrustCenter\b/.test(body)
}

const stubBrandingPreview = async (page: Page, cnameRecord: string | null) => {
  await page.route('**/query', async (route) => {
    if (!isGetTrustCenter(route)) return route.fallback()
    const response = await route.fetch()
    const payload = (await response.json()) as TrustCenterPayload
    const node = payload.data?.trustCenters?.edges?.[0]?.node
    if (node) {
      node.previewDomain = cnameRecord ? { cnameRecord } : null
      if (node.previewSetting) node.previewSetting.title = `${node.previewSetting.title ?? ''} (e2e unpublished draft)`
    }
    await route.fulfill({ response, json: payload })
  })
}

const unpublishedWarning = (page: Page) => page.locator('p').filter({ hasText: 'You have unpublished changes for this setting.' })

test.describe('trust-center — search engine visibility (#2356)', () => {
  test.use({ authProfile: 'demo' })

  test('toggling Hide from search engines persists noindexDefaultDomain on the live setting', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const demoApi = await getDemoApi()
    const original = await readLiveSetting(demoApi)
    const initial = original.noindexDefaultDomain ?? false

    try {
      await openTrustCenterPage(page, '/trust-center/domain')
      const toggle = page.getByRole('switch', { name: 'Hide from search engines' })
      await expect(toggle).toBeVisible({ timeout: 30_000 })
      await expect(toggle).toHaveAttribute('aria-checked', String(initial))
      await expect(toggle).toBeEnabled()

      await expectMutationOk(page, 'UpdateTrustCenterSetting', async () => {
        await toggle.click()
      })
      await expect(toast(page, 'Search engine visibility updated')).toBeVisible({ timeout: 30_000 })
      await expect(toggle).toHaveAttribute('aria-checked', String(!initial), { timeout: 15_000 })
      expect((await readLiveSetting(demoApi)).noindexDefaultDomain).toBe(!initial)

      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('switch', { name: 'Hide from search engines' })).toHaveAttribute('aria-checked', String(!initial), { timeout: 30_000 })
    } finally {
      await setNoIndex(demoApi, original.id, initial)
    }
  })

  test('the search engine toggle explains what it hides', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/domain')

    const toggle = page.getByRole('switch', { name: 'Hide from search engines' })
    await expect(toggle).toBeVisible({ timeout: 30_000 })
    await expect(toggle).toHaveAccessibleDescription(/Prevent search engines like Google from showing this default Trust Center URL in search results\./)
  })
})

test.describe('trust-center — branding unpublished-changes preview link (ISS-3064)', () => {
  test.use({ authProfile: 'demo' })

  test('the unpublished-changes warning links to the preview site in a new tab', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await stubBrandingPreview(page, 'preview-e2e.example.test')
    await openTrustCenterPage(page, '/trust-center/branding')

    const warning = unpublishedWarning(page)
    await expect(warning).toHaveCount(1, { timeout: 30_000 })
    const link = warning.getByRole('link', { name: 'Preview' })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', 'https://preview-e2e.example.test?fresh=1')
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
  })

  test('without a preview domain the warning renders with no Preview link', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await stubBrandingPreview(page, null)
    await openTrustCenterPage(page, '/trust-center/branding')

    const warning = unpublishedWarning(page)
    await expect(warning).toHaveCount(1, { timeout: 30_000 })
    await expect(warning.getByRole('link')).toHaveCount(0)
    await expect(page.getByText('Preview URL not available yet')).toBeVisible()
  })
})

test.describe('trust-center — subprocessor search (ISS-3049)', () => {
  test.use({ authProfile: 'demo' })

  test('the subprocessors table search narrows to the matching row and clears on a miss', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const demoApi = await getDemoApi()
    const name = uniqueName('E2E SubSearch')
    const subprocessorId = await createSubprocessor(demoApi, name)
    const tcSubprocessorId = await createTrustCenterSubprocessor(demoApi, await getTrustCenterId(demoApi), subprocessorId, 'Hosting', ['US'])

    try {
      await openTrustCenterPage(page, '/trust-center/subprocessors')
      const search = page.getByPlaceholder('Search subprocessors...')
      await expect(search).toBeVisible({ timeout: 30_000 })

      const row = page.getByRole('row').filter({ hasText: name })
      await search.fill(name)
      await expect(row).toHaveCount(1, { timeout: 30_000 })
      await expect(page.getByRole('row').filter({ hasText: 'E2E' }).filter({ hasNotText: name })).toHaveCount(0)

      await search.fill(`${name} no-such-subprocessor`)
      await expect(row).toHaveCount(0, { timeout: 30_000 })
    } finally {
      await deleteTrustCenterSubprocessorQuietly(demoApi, tcSubprocessorId)
      await deleteSubprocessorQuietly(demoApi, subprocessorId)
    }
  })

  test('the Add to Trust Center picker finds an unattached subprocessor and keeps the chosen name', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const demoApi = await getDemoApi()
    const name = uniqueName('E2E SubPick')
    const subprocessorId = await createSubprocessor(demoApi, name)

    try {
      await openTrustCenterPage(page, '/trust-center/subprocessors')
      await page.getByRole('button', { name: /^Create$/ }).click()
      await page.getByRole('menuitem', { name: 'Add subprocessor' }).click()
      const dialog = page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: 'Add to Trust Center' }) })
      await expect(dialog).toBeVisible({ timeout: 30_000 })

      await dialog.getByText('Select subprocessor', { exact: true }).click()
      const pickerInput = page.locator('[cmdk-input]')
      await expect(pickerInput).toBeVisible({ timeout: 15_000 })

      await pickerInput.fill('E')
      await expect(page.getByText('Type at least 2 characters to search.', { exact: true })).toBeVisible({ timeout: 15_000 })

      await pickerInput.fill(name)
      const option = page.getByRole('option', { name })
      await expect(option).toHaveCount(1, { timeout: 30_000 })
      await option.click()

      await expect(pickerInput).toBeHidden({ timeout: 15_000 })
      await expect(dialog.getByText(name, { exact: true })).toBeVisible()
      await expect(dialog.getByText('Select subprocessor', { exact: true })).toHaveCount(0)
    } finally {
      await deleteSubprocessorQuietly(demoApi, subprocessorId)
    }
  })
})
