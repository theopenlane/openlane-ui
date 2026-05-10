import { expect, test } from '@playwright/test'

import { RUN_ID } from '../utils/constants'
import { seedLoggedInUser } from '../utils/seedUser'

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
      await seedLoggedInUser(page, `reg-${path.split('/').pop()}`)

      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})

test.describe('registry — vendor create wizard', () => {
  test('happy path — name-only step wizard creates a vendor visible on /registry/vendors', async ({ page }) => {
    await seedLoggedInUser(page, 'reg-vendor-create')

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
    await seedLoggedInUser(page, 'reg-vendor-detail')

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
    await seedLoggedInUser(page, 'reg-vendor-required')

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
