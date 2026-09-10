import { test, expect } from '../fixtures/auth'
import { test as freshTest, type Page } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'
import { dismissDraftRestore } from '../utils/drafts'

import { RUN_ID } from '../utils/constants'
import { expectMutationOk } from '../utils/mutations'

const policyName = (slug: string) => `E2E Policy ${slug} ${RUN_ID} ${Date.now().toString(36)}`

test.describe('policies — create + view', () => {
  test('happy path — create a policy and land on the view page', async ({ page }) => {
    await page.goto('/policies/create')
    await dismissDraftRestore(page)

    const name = policyName('create')
    await page.getByLabel(/^Title$/).fill(name)

    await page.getByRole('button', { name: /^save changes$/i }).click()

    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  })

  test('required validation — submitting without a title stays on create and shows the inline error', async ({ page }) => {
    await page.goto('/policies/create')
    await dismissDraftRestore(page)
    await page.getByRole('button', { name: /^save changes$/i }).click()

    await expect(page).toHaveURL(/\/policies\/create(\?|$)/)
    await expect(page.getByText(/^Name is required$/)).toBeVisible()
  })

  test('table view search: typing the title filters via backend (other policy disappears)', async ({ page }) => {
    const a = policyName('search-a')
    const b = policyName('search-b')
    for (const name of [a, b]) {
      await page.goto('/policies/create')
      await dismissDraftRestore(page)
      await page.getByLabel(/^Title$/).fill(name)
      await page.getByRole('button', { name: /^save changes$/i }).click()
      await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })
    }

    await page.goto('/policies')
    await page.locator('.lucide-table').first().click()

    await page.getByPlaceholder(/^Search$/).fill(b)

    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(0, { timeout: 15_000 })
  })

  test('toggle to table view: TabSwitcher Table icon → table renders the policy', async ({ page }) => {
    await page.goto('/policies/create')
    await dismissDraftRestore(page)
    const name = policyName('table')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    await page.goto('/policies')

    await page.locator('.lucide-table').first().click()

    await page.getByPlaceholder(/^Search$/).fill(name)

    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('newly created policy appears in the dashboard recent-activity feed', async ({ page }) => {
    await page.goto('/policies/create')
    await dismissDraftRestore(page)
    const name = policyName('list')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    await page.goto('/policies')
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('policies — edit', () => {
  test('inline title rename: policy title edit path → type → Enter → reload → new title persists', async ({ page }) => {
    await page.goto('/policies/create')
    await dismissDraftRestore(page)
    const original = policyName('edit-orig')
    await page.getByLabel(/^Title$/).fill(original)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    const original_h1 = page.getByRole('heading', { level: 1, name: original })
    await expect(original_h1).toBeVisible({ timeout: 15_000 })

    const updated = policyName('edit-new')
    await expect(async () => {
      const h1 = page.getByRole('heading', { level: 1 }).first()
      await h1.dispatchEvent('dblclick')
      const titleInput = page.getByRole('textbox').first()
      await expect(titleInput).toBeVisible({ timeout: 2_000 })
      await titleInput.fill(updated)
      await expectMutationOk(page, 'UpdateInternalPolicy', async () => {
        await titleInput.press('Enter')
      })
      await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 10_000 })
    }).toPass({ timeout: 60_000 })

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: double-click status → select Pending → reload → new status persists', async ({ page }) => {
    await page.goto('/policies/create')
    await dismissDraftRestore(page)
    const name = policyName('status')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    const statusTrigger = page.getByTestId('policy-status-trigger')
    await expect(statusTrigger).toContainText(/^Draft$/)

    const statusSelect = page.getByRole('combobox')
    await expect(async () => {
      await statusTrigger.dblclick()
      await expect(statusSelect).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })

    await statusSelect.click()
    await page.getByRole('option', { name: /^Pending$/i }).click()

    await expect(statusTrigger).toContainText(/^Pending$/, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('policy-status-trigger')).toContainText(/^Pending$/, { timeout: 15_000 })
  })
})

test.describe('policies — create form details', () => {
  const statusCardSelect = (page: Page, label: string) =>
    page
      .locator('div.grid')
      .filter({ has: page.getByText(label, { exact: true }) })
      .getByRole('combobox')
      .first()

  test('set status dropdown — choosing Published updates the trigger', async ({ page }) => {
    await page.goto('/policies/create', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/^Title$/).fill(policyName('status-dd'))

    const statusTrigger = statusCardSelect(page, 'Status')
    await expect(statusTrigger).toBeVisible({ timeout: 15_000 })
    await statusTrigger.click()
    await page.getByRole('option', { name: /^Published$/ }).click()
    await expect(statusTrigger).toContainText(/Published/, { timeout: 10_000 })
  })

  test('set approval required flag — toggling the dropdown to False persists in the trigger', async ({ page }) => {
    await page.goto('/policies/create', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/^Title$/).fill(policyName('approval'))

    const approvalTrigger = statusCardSelect(page, 'Approval Required')
    await expect(approvalTrigger).toBeVisible({ timeout: 15_000 })
    await expect(approvalTrigger).toContainText(/true/i)
    await approvalTrigger.click()
    await page.getByRole('option', { name: /^False$/ }).click()
    await expect(approvalTrigger).toContainText(/false/i, { timeout: 10_000 })
  })

  test('set review frequency — choosing a frequency updates the trigger', async ({ page }) => {
    await page.goto('/policies/create', { waitUntil: 'domcontentloaded' })
    await page.getByLabel(/^Title$/).fill(policyName('review-freq'))

    const freqTrigger = statusCardSelect(page, 'Reviewing Frequency')
    await expect(freqTrigger).toBeVisible({ timeout: 15_000 })
    await freqTrigger.click()
    const option = page.getByRole('option', { name: /^Monthly$/ })
    await expect(option).toBeVisible({ timeout: 10_000 })
    await option.click()
    await expect(freqTrigger).toContainText(/Monthly/, { timeout: 10_000 })
  })

  test('edit policy details (rich text editor) — typed body is created and renders on the view page', async ({ page }) => {
    test.slow()
    await page.goto('/policies/create', { waitUntil: 'domcontentloaded' })
    const name = policyName('rich-text')
    await page.getByLabel(/^Title$/).fill(name)

    const marker = `E2E body ${RUN_ID} ${Date.now().toString(36)}`
    const editor = page.locator('[contenteditable="true"]').first()
    await expect(editor).toBeVisible({ timeout: 20_000 })
    await editor.click()
    await page.keyboard.type(marker)
    await expect(editor).toContainText(marker, { timeout: 10_000 })

    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(marker).first()).toBeVisible({ timeout: 15_000 })
  })
})

freshTest.describe('policies — fresh org', () => {
  freshTest('empty policies list shows the "Create Custom Policy" CTA for a fresh user', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-empty')

    await page.goto('/policies')

    const emptyRegion = page.getByRole('region', { name: /create policies/i })
    await expect(emptyRegion).toBeVisible()
    await expect(emptyRegion.getByText(/create custom policy/i)).toBeVisible()
  })
})
