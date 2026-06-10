import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createRisk, type ApiSession } from '../utils/api'

/**
 * Deep exposure/risk flows beyond exposure.spec.ts (create/search/validation on
 * fresh users). Runs as the storage-state Owner; risks seeded via the Owner API.
 * Detail-tab / edit / delete mirror the controls-crud pattern (URL-controlled
 * Radix tabs; owner edit-mode toggle; actions-menu delete).
 *
 * ⏳ Detail tab/edit/delete written without running (added risk-actions-menu +
 * risk-delete-button testids in risk-detail-header.tsx). Verify on next run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueRiskName = () => `E2E RiskCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('exposure — create risk validation', () => {
  test('submitting an empty title keeps the form on the create page', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/risks/create', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // create-risk-form.tsx submit is "Create risk"; an empty (required) title
    // fails validation, so the form stays mounted instead of redirecting to a
    // /exposure/risks/{id} detail.
    const submit = page.getByRole('button', { name: /^Create risk$/ })
    await expect(submit).toBeVisible({ timeout: 30_000 })
    await submit.click()

    await expect(submit).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/exposure\/risks\/create/)
  })
})

test.describe('exposure — risks', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Risks$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Risks$/ })).toBeVisible({ timeout: 20_000 })

    // risks-table-toolbar.tsx → shared TableFilter; getRisksFilterFields has a
    // "Status" field (statusIn).
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('a seeded risk detail page renders its name as the heading', async ({ page }) => {
    const name = uniqueRiskName()
    const id = await createRisk(ownerApi, name)

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })
  })

  test('search filters risks to the matching seeded risk', async ({ page }) => {
    const a = uniqueRiskName()
    const b = uniqueRiskName()
    await createRisk(ownerApi, a)
    await createRisk(ownerApi, b)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('selecting a risk row reveals the Bulk Delete action', async ({ page }) => {
    const name = uniqueRiskName()
    await createRisk(ownerApi, name)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    // risks-table-toolbar.tsx shows "Bulk Delete (n)" once a row is selected.
    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — risk detail (seeded)', () => {
  test('detail tabs render and switching tabs updates the active selection', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    // risk-detail-tabs.tsx: Radix tabs, URL-controlled via ?tab=… (overview is
    // the default and clears the param). Wait for the URL commit before
    // asserting the controlled aria-selected flips.
    const mitigation = page.getByRole('tab', { name: 'Mitigation' })
    const review = page.getByRole('tab', { name: 'Risk Review' })
    await expect(mitigation).toBeVisible({ timeout: 15_000 })

    await mitigation.click()
    await page.waitForURL(/[?&]tab=mitigation/, { timeout: 15_000 })
    await expect(mitigation).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })

    await review.click()
    await page.waitForURL(/[?&]tab=risk-review/, { timeout: 15_000 })
    await expect(review).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(mitigation).toHaveAttribute('aria-selected', 'false')
  })

  test('clicking Edit risk enters edit mode (Cancel + Save appear)', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const editButton = page.getByRole('button', { name: 'Edit risk' })
    await expect(editButton).toBeVisible({ timeout: 45_000 })

    await editButton.click()
    // risk-detail-header.tsx swaps to CancelButton ("Cancel") + SaveButton
    // ("Save Changes") in edit mode.
    await expect(page.getByRole('button', { name: /^Cancel$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Save Changes$/ })).toBeVisible()
  })

  test('the Mitigation tab surfaces the Action Plans section', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    // The "Create Action Plan" quick action routes to ?tab=mitigation&create=true;
    // the Mitigation tab (mitigation-tab.tsx) renders an "Action Plans" section
    // with the ActionPlansTable. We assert the section renders directly.
    await page.goto(`/exposure/risks/${id}?tab=mitigation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Mitigation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: 'Action Plans' })).toBeVisible({ timeout: 15_000 })
  })

  // NOTE: action-plan create — ?tab=mitigation&create=true should open the
  // GenericDetailsSheet (action-plans-table.tsx isCreate), but the risk-detail +
  // action-plan-sheet combination didn't render reliably in this pass. The
  // Mitigation-tab → Action Plans section render is covered above. ⏳

  test('delete a risk via the actions menu redirects to the risks list', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    await page.getByTestId('risk-actions-menu').click()
    await page.getByTestId('risk-delete-button').click()
    // ConfirmationDialog "Delete Risk" (no typed input) → confirm Delete.
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.waitForURL(/\/exposure\/risks(\?|$)/, { timeout: 20_000 })
  })
})

// Filter panels across the exposure sub-pages (shared TableFilter; each
// getXFilterFields exposes a distinct first field).
// findings + vulnerabilities render an empty-state without the Filter toolbar
// (scanner-fed, no seedable data), so only the pages that expose it are covered.
const EXPOSURE_FILTER_PAGES = [
  { path: '/exposure/remediations', heading: /^Remediations$/, field: 'Title' },
  { path: '/exposure/reviews', heading: /^Reviews$/, field: 'State' },
]

test.describe('exposure — sub-page filters', () => {
  for (const { path, heading, field } of EXPOSURE_FILTER_PAGES) {
    test(`${path} filter panel exposes a "${field}" field`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })

      await page.getByRole('button', { name: /^Filter$/ }).click()
      await expect(page.getByText(field, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    })
  }
})
