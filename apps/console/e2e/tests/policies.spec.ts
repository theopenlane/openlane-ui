import { expect, test } from '@playwright/test'

import { RUN_ID } from '../utils/constants'
import { seedLoggedInUser } from '../utils/seedUser'

const policyName = (slug: string) => `E2E Policy ${slug} ${RUN_ID} ${Date.now().toString(36)}`

test.describe('policies — create + view', () => {
  test('empty policies list shows the "Create Custom Policy" CTA for a fresh user', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-empty')

    await page.goto('/policies')

    // The empty state is wrapped in a section with aria-label="Create policies"
    // (see policies-empty/policy-empty.tsx). CardTitle inside is a <div>, not
    // an <h*>, so we match by text rather than heading role.
    const emptyRegion = page.getByRole('region', { name: /create policies/i })
    await expect(emptyRegion).toBeVisible()
    await expect(emptyRegion.getByText(/create custom policy/i)).toBeVisible()
  })

  test('happy path — create a policy and land on the view page', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-create')

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
    await seedLoggedInUser(page, 'pol-required')

    await page.goto('/policies/create')
    await page.getByRole('button', { name: /^save changes$/i }).click()

    await expect(page).toHaveURL(/\/policies\/create(\?|$)/)
    await expect(page.getByText(/^Name is required$/)).toBeVisible()
  })

  test('table view search: typing the title filters via backend (other policy disappears)', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-search')

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

    // Both rows are visible before search filters.
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })

    // Type the second title into the toolbar search. The table-toolbar
    // input has placeholder "Search" — there is no other input with that
    // exact placeholder on this page, so we target it directly. Search
    // is debounced 200ms and routes to the backend `titleContainsFold`
    // filter, so we wait for the first policy's row to disappear.
    await page.getByPlaceholder(/^Search$/).fill(b)

    await expect(page.getByRole('cell').filter({ hasText: a })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible()
  })

  test('toggle to table view: TabSwitcher Table icon → table renders the policy', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-table')

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

    // Table view shows the policy name in a cell.
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('newly created policy appears in the dashboard recent-activity feed', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-list')

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
    await seedLoggedInUser(page, 'pol-edit')

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

    // TitleField listens for onDoubleClick on the h1. Chromium's
    // rendered layout intermittently places another layer over the
    // visible title, so a normal pointer dblclick is flaky here even
    // though the edit path itself still works. Dispatch the same
    // dblclick event the component consumes, then continue through the
    // real input/blur persistence path.
    await original_h1.dispatchEvent('dblclick')

    // The input replaces the h1 in the same slot. It's the only
    // textbox inside the title region. Press Enter to fire the
    // synthetic blur, which calls handleUpdate({ name }) (the
    // updateInternalPolicy mutation) and exits edit mode.
    const updated = policyName('edit-new')
    const titleInput = page.getByRole('textbox').first()
    await titleInput.fill(updated)
    await titleInput.press('Enter')

    // The h1 should re-render with the new name almost immediately.
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 10_000 })

    // Persistence check — reload and confirm the new name survived.
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: double-click status → select Pending → reload → new status persists', async ({ page }) => {
    await seedLoggedInUser(page, 'pol-status')

    await page.goto('/policies/create')
    const name = policyName('status')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^save changes$/i }).click()
    await page.waitForURL(/\/policies\/[^/]+\/view/, { timeout: 30_000 })

    const statusTrigger = page.getByTestId('policy-status-trigger')
    await expect(statusTrigger).toContainText(/^Draft$/)

    await statusTrigger.dblclick()

    const statusSelect = page.getByRole('combobox')
    await expect(statusSelect).toBeVisible({ timeout: 5_000 })
    await statusSelect.click()
    await page.getByRole('option', { name: /^Pending$/i }).click()

    await expect(statusTrigger).toContainText(/^Pending$/, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('policy-status-trigger')).toContainText(/^Pending$/, { timeout: 15_000 })
  })
})
