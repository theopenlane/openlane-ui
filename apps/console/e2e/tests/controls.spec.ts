import { expect, test } from '@playwright/test'

import { RUN_ID } from '../utils/constants'
import { seedLoggedInUser } from '../utils/seedUser'

const refCodeFor = (slug: string) => `E2E-${slug}-${RUN_ID}-${Date.now().toString(36)}`

test.describe('controls — create + view', () => {
  test('empty controls list shows the "Create controls" empty state for a fresh user', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-empty')

    await page.goto('/controls')

    // Empty state region — see control-report/control-empty.tsx
    // (aria-label="Create controls"). Inner CardTitles are <div>s, not
    // headings, so we match by text rather than role.
    const emptyRegion = page.getByRole('region', { name: /create controls/i })
    await expect(emptyRegion).toBeVisible()
    await expect(emptyRegion.getByText(/create custom controls/i)).toBeVisible()
  })

  test('required validation — submitting without a Ref Code stays on create-control and shows the inline error', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-required')

    await page.goto('/controls/create-control')

    // The Create button is the form's submit. There are other "Create"
    // buttons further down the page (association sections), so scope to
    // the form's submit button.
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()

    await expect(page).toHaveURL(/\/controls\/create-control(\?|$)/)
    // Zod schema in create-control/use-form-schema.ts: refCode.min(1,
    // 'Ref Code is required') → the message is rendered next to the
    // input via the FormField error path.
    await expect(page.getByText(/^Ref Code is required$/)).toBeVisible()
  })

  test('search by ref code filters server-side — second control disappears when the first ref is typed', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-search')

    const a = refCodeFor('search-a')
    const b = refCodeFor('search-b')
    for (const refCode of [a, b]) {
      await page.goto('/controls/create-control')
      await page.locator('input[name="refCode"]').fill(refCode)
      await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
      await page.waitForURL(/\/controls\/[^/]+(\?|$)/, { timeout: 30_000 })
    }

    await page.goto('/controls')
    // /controls defaults to the dashboard tab; switch to the table view
    // (Lucide Table icon in the TabSwitcher) so the search input renders.
    await page.locator('.lucide-table').first().click()

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible()
  })

  test('happy path — create a control and land on the detail page', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-create')

    await page.goto('/controls/create-control')

    const refCode = refCodeFor('ctl')
    // Ref Code is the only required field — the form's zod schema only
    // demands controlID for subcontrols, not for top-level controls.
    // The Ref Code <Label> is not htmlFor-associated to its <Input>, so
    // we target the input by its react-hook-form-injected name attribute.
    await page.locator('input[name="refCode"]').fill(refCode)

    // The submit button reads "Create". There are other "Create" buttons
    // elsewhere on the page (e.g. inside association sections) — scope
    // to the form's submit button to disambiguate.
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()

    // Form redirects to /controls/{id} on success.
    await page.waitForURL(/\/controls\/[^/]+(\?|$)/, { timeout: 30_000 })

    // Detail page renders the refCode as an h1.
    await expect(page.getByRole('heading', { level: 1, name: refCode })).toBeVisible({ timeout: 15_000 })
  })

  test('create-subcontrol — submitting without a Parent Control shows the inline error', async ({ page }) => {
    await seedLoggedInUser(page, 'sub-required')

    await page.goto('/controls/create-subcontrol')

    // Subcontrol form requires both refCode and controlID. Fill refCode
    // so we surface the controlID-specific error rather than the
    // refCode error.
    await page.locator('input[name="refCode"]').fill(refCodeFor('sub-req'))

    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()

    // controlFormSchema's superRefine adds 'Parent Control is required'
    // when isCreateSubcontrol && controlID is empty. Surfaced under the
    // Parent Control select.
    await expect(page).toHaveURL(/\/controls\/create-subcontrol(\?|$)/)
    await expect(page.getByText(/^Parent Control is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('newly created control appears in the controls table view', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-listed')

    await page.goto('/controls/create-control')
    const refCode = refCodeFor('listed')
    await page.locator('input[name="refCode"]').fill(refCode)
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
    await page.waitForURL(/\/controls\/[^/]+(\?|$)/, { timeout: 30_000 })

    await page.goto('/controls')
    await page.locator('.lucide-table').first().click()

    await expect(page.getByRole('cell').filter({ hasText: refCode }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('inline title rename: double-click h1 → edit refCode → Enter → reload → new refCode persists', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-edit')

    // Create the control first — same flow as the happy path above.
    await page.goto('/controls/create-control')
    const original = refCodeFor('orig')
    await page.locator('input[name="refCode"]').fill(original)
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
    await page.waitForURL(/\/controls\/[^/]+(\?|$)/, { timeout: 30_000 })

    const originalH1 = page.getByRole('heading', { level: 1, name: original })
    await expect(originalH1).toBeVisible({ timeout: 15_000 })

    // form-fields/title-field.tsx wraps the h1 in HoverPencilWrapper +
    // an onDoubleClick handler. Double-click swaps in two side-by-side
    // inputs (refCode + title) wrapped in a parent <div> with
    // onBlur=handleGroupBlur. The blur handler fires updateControl
    // only when focus leaves the *group* (relatedTarget check).
    await originalH1.dblclick()

    // Both inputs are htmlFor-linked: refCode and title.
    const refCodeInput = page.getByLabel(/^Ref Code/)
    await expect(refCodeInput).toBeVisible({ timeout: 5_000 })

    const updated = refCodeFor('updt')
    await refCodeInput.fill(updated)

    // Pressing Enter inside the input triggers handleKeyDown →
    // input.blur(). With no other focusable element inside the group
    // taking focus, relatedTarget is null/body, the contains() check
    // is false, and handleGroupBlur fires the updateControl mutation.
    await refCodeInput.press('Enter')

    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 10_000 })

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: updated })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 1, name: original })).toHaveCount(0)
  })

  test('inline status change: double-click status → select Preparing → reload → new status persists', async ({ page }) => {
    await seedLoggedInUser(page, 'ctl-status')

    await page.goto('/controls/create-control')
    const refCode = refCodeFor('status')
    await page.locator('input[name="refCode"]').fill(refCode)
    await page.locator('form button[type="submit"]', { hasText: /^create$/i }).click()
    await page.waitForURL(/\/controls\/[^/]+(\?|$)/, { timeout: 30_000 })

    const statusTrigger = page.getByTestId('control-status-trigger')
    await expect(statusTrigger).toContainText(/^Not Implemented$/)

    await statusTrigger.dblclick()

    const statusSelect = page.getByRole('combobox')
    await expect(statusSelect).toBeVisible({ timeout: 5_000 })
    await statusSelect.click()
    await page.getByRole('option', { name: /^Preparing$/i }).click()

    await expect(statusTrigger).toContainText(/^Preparing$/, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('control-status-trigger')).toContainText(/^Preparing$/, { timeout: 15_000 })
  })
})
