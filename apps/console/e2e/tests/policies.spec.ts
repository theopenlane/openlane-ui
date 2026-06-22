import { test, expect } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'

const policyName = (slug: string) => `E2E Policy ${slug} ${RUN_ID} ${Date.now().toString(36)}`

test.describe('policies — create + view', () => {
  test('happy path — create a policy and land on the view page', async ({ page }) => {
    await page.goto('/policies/create')

    const name = policyName('create')
    // Title is the only required field — the form pre-populates a Plate.js
    // template for the policy body, status defaults to DRAFT, etc. We just
    // need a name to satisfy the zod schema.
    await page.getByLabel(/^Title$/).fill(name)

    await page.getByRole('button', { name: /^save changes$/i }).click()

    // Form redirects to /policies/{id}/view on success.
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    // View page renders the title as an h1.
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
  })

  test('required validation — submitting without a title stays on create and shows the inline error', async ({ page }) => {
    await page.goto('/policies/create')
    await page.getByRole('button', { name: /^save changes$/i }).click()

    await expect(page).toHaveURL(/\/policies\/create(\?|$)/)
    await expect(page.getByText(/^Name is required$/)).toBeVisible()
  })

  test('table view search: typing the title filters via backend (other policy disappears)', async ({ page }) => {
    // Create two distinct policies in the same fresh org so the table
    // has more than one row to filter against.
    const a = policyName('search-a')
    const b = policyName('search-b')
    for (const name of [a, b]) {
      await page.goto('/policies/create')
      await page.getByLabel(/^Title$/).fill(name)
      await page.getByRole('button', { name: /^save changes$/i }).click()
      await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })
    }

    await page.goto('/policies')
    await page.locator('.lucide-table').first().click()

    // Type the second title into the toolbar search. The table-toolbar
    // input has placeholder "Search" — there is no other input with that
    // exact placeholder on this page, so we target it directly. Search
    // is debounced 200ms and routes to the backend `titleContainsFold`
    // filter. Searching B's full unique title keeps A off the result set
    // even under heavy concurrent data growth in the shared org.
    await page.getByPlaceholder(/^Search$/).fill(b)

    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(0, { timeout: 15_000 })
  })

  test('toggle to table view: TabSwitcher Table icon → table renders the policy', async ({ page }) => {
    // Create one policy first so the table has something to render.
    await page.goto('/policies/create')
    const name = policyName('table')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    await page.goto('/policies')

    // TabSwitcher renders two raw lucide SVGs as triggers (Presentation
    // for dashboard, Table for table view) with no accessible name.
    // Lucide icons get a `lucide-{name}` class — use that to disambiguate.
    await page.locator('.lucide-table').first().click()

    // Search the unique title so the just-created row isn't pushed off
    // the default page by concurrent data growth in the shared org.
    await page.getByPlaceholder(/^Search$/).fill(name)

    // Table view shows the policy name in a cell.
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('newly created policy appears in the dashboard recent-activity feed', async ({ page }) => {
    await page.goto('/policies/create')
    const name = policyName('list')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    // Back to the list (dashboard view by default — the table-view tab
    // switcher is rendered as a plain icon SVG with no accessible name,
    // so testing the dashboard's Recent Activity is more robust). The
    // policy.name is rendered inside a <strong> in recent-activity.tsx.
    await page.goto('/policies')
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('policies — edit', () => {
  test('inline title rename: policy title edit path → type → Enter → reload → new title persists', async ({ page }) => {
    // Create the policy first so we have something to edit. Same flow
    // as the happy-path create test above; kept inline so this spec
    // doesn't need a shared fixture.
    await page.goto('/policies/create')
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
      await titleInput.press('Enter')
      await page.reload()
      await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: double-click status → select Pending → reload → new status persists', async ({ page }) => {
    await page.goto('/policies/create')
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

freshTest.describe('policies — fresh org', () => {
  freshTest('empty policies list shows the "Create Custom Policy" CTA for a fresh user', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-empty')

    await page.goto('/policies')

    const emptyRegion = page.getByRole('region', { name: /create policies/i })
    await expect(emptyRegion).toBeVisible()
    await expect(emptyRegion.getByText(/create custom policy/i)).toBeVisible()
  })
})
