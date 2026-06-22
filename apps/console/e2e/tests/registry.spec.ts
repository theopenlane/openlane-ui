import { test, expect } from '../fixtures/auth'

import { RUN_ID } from '../utils/constants'

const vendorName = (slug: string) => `E2E Vendor ${slug} ${RUN_ID} ${Date.now().toString(36)}`

// Each registry subroute renders its name as an <h2> (PageHeading from
// @repo/ui or a literal h2 in the platforms case). One smoke per
// subroute keeps the breadth honest without prescribing layout.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/registry/vendors', heading: /^Vendors$/ },
  { path: '/registry/assets', heading: /^Assets$/ },
  { path: '/registry/personnel', heading: /^Personnel$/ },
  { path: '/registry/contacts', heading: /^Contacts$/ },
  { path: '/registry/system-details', heading: /^System Details$/ },
  { path: '/registry/platforms', heading: /^Platforms$/ },
]

test.describe('registry — list pages render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})

test.describe('registry — vendor create wizard', () => {
  test('happy path — name-only step wizard creates a vendor visible on /registry/vendors', async ({ page }) => {
    await page.goto('/registry/vendors')

    // GenericTablePage renders a "Create" button in the toolbar; click
    // routes to ?create=true which mounts the StepDialog.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Step 1 — Vendor Info. Only `name` is required (Zod min(1)).
    const name = vendorName('create')
    await dialog.getByLabel(/^Vendor Name/).fill(name)

    // Step 2 — Logo (empty schema). Step 3 — Ownership (responsibility
    // fields are .optional().nullable()). Step 4 — Documents (contactIDs
    // optional). Click Next three times to reach the last step.
    await dialog.getByRole('button', { name: /^next$/i }).click()
    await dialog.getByRole('button', { name: /^next$/i }).click()
    await dialog.getByRole('button', { name: /^next$/i }).click()

    // The last step's submit button reads "Create" (SaveButton with
    // title="Create"). Pending state shows "Creating...".
    await dialog.getByRole('button', { name: /^create$/i }).click()

    // Successful create closes the dialog (StepDialog.onClose) and
    // refetches the entities list — the new vendor's name renders in
    // a cell on the vendors table.
    await expect(dialog).toBeHidden({ timeout: 30_000 })
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('clicking a vendor row opens the detail page (full-page route)', async ({ page }) => {
    // Create vendor inline.
    await page.goto('/registry/vendors')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()
    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const name = vendorName('detail')
    await dialog.getByLabel(/^Vendor Name/).fill(name)
    await dialog.getByRole('button', { name: /^next$/i }).click()
    await dialog.getByRole('button', { name: /^next$/i }).click()
    await dialog.getByRole('button', { name: /^next$/i }).click()
    await dialog.getByRole('button', { name: /^create$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 30_000 })

    // Click the vendor's row → GenericTablePage configured viewEditMode
    // type=full-page route="/registry/vendors", so row click navigates
    // to /registry/vendors/[id].
    await page.getByRole('cell').filter({ hasText: name }).first().click()

    await page.waitForURL(/\/registry\/vendors\/[^/]+(\?|$)/, { timeout: 15_000 })
    // Detail page renders the vendor name in a heading-like surface.
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })

  test('required validation — Step 1 Next is blocked when Vendor Name is empty', async ({ page }) => {
    await page.goto('/registry/vendors')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Click Next without filling the name. handleNext validates the
    // current step's schema and surfaces the error under the input.
    // The dialog's FormField renders the schema message but also a
    // generic "Required" hint via FormMessage's reserveSpace, so we
    // match either the schema message or the generic "Required" copy.
    await dialog.getByRole('button', { name: /^next$/i }).click()

    await expect(dialog.getByText(/^(Name is required|Required)$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('registry — legacy redirects', () => {
  test('/registry/vulnerabilities redirects to /exposure/vulnerabilities', async ({ page }) => {
    // page.tsx is a server-side redirect() to /exposure/vulnerabilities.
    await page.goto('/registry/vulnerabilities')

    await expect(page).toHaveURL(/\/exposure\/vulnerabilities(\?|$)/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('registry — vendor list controls', () => {
  // Pure-UI checks against the shared crud-base toolbar (table-toolbar.tsx):
  // the Filter panel (table-filter.tsx) and Columns menu
  // (column-visibility-menu.tsx) are rendered regardless of whether any rows
  // are present, so these need no seeded data.

  test('vendor filter panel exposes the documented Status/Scope/Source filters', async ({ page }) => {
    test.slow() // heavy registry route → cold dev compile
    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter$/ }).click()
    // vendors/table/table-config.tsx getFilterFields → accordion triggers
    // labelled by the FilterField.label string.
    for (const label of ['Status', 'Scope', 'Source Type', 'Relationship State', 'Security Questionnaire Status']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('vendor column visibility menu toggles a column off', async ({ page }) => {
    test.slow()
    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

    // column-visibility-menu.tsx renders a "Columns" trigger → a Radix menu with
    // a per-column row: <Checkbox/> + <div>{header}</div>. "Description" is
    // visible by default (visibilityFields), so its checkbox starts checked;
    // clicking it flips to unchecked.
    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    const descCheckbox = menu
      .locator('div')
      .filter({ has: page.getByText('Description', { exact: true }) })
      .getByRole('checkbox')
      .first()
    await expect(descCheckbox).toBeChecked({ timeout: 10_000 })
    await descCheckbox.click()
    await expect(descCheckbox).not.toBeChecked({ timeout: 10_000 })
  })

  test('vendor column header sort toggles aria-sort on the Display Name column', async ({ page }) => {
    test.slow()
    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

    // data-table.tsx SortableHeaderCell sets aria-sort on the <th> and cycles
    // ascending/descending when the sortable header label is clicked.
    const header = page.getByRole('columnheader', { name: /Display Name/ }).first()
    await expect(header).toBeVisible({ timeout: 15_000 })
    await expect(header).toHaveAttribute('aria-sort', 'none')
    await header.getByText('Display Name').click()
    await expect(header).toHaveAttribute('aria-sort', /ascending|descending/, { timeout: 10_000 })
  })
})
