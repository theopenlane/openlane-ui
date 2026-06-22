import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Owner-only settings pages.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/organization-settings', heading: /^Organization settings$/ },
  { path: '/organization-settings/general-settings', heading: /^General$/ },
  { path: '/organization-settings/custom-data', heading: /^Custom Data$/ },
  { path: '/organization-settings/billing', heading: /^Billing$/ },
  { path: '/organization-settings/authentication', heading: /^Authentication$/ },
  { path: '/organization-settings/integrations', heading: /^Integrations$/ },
  { path: '/organization-settings/logs', heading: /^Audit Logs$/ },
  { path: '/organization-settings/subscribers', heading: /^Subscribers$/ },
]

test.describe('organization-settings — pages render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })

      // PageHeading from @repo/ui renders the heading as an <h2>. Generous
      // timeout absorbs first-hit route compilation in the dev server.
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })
    })
  }
})

/**
 * Custom Data deep flow: the Custom Tags / Custom Enums tab toggle and the
 * Create Tag sheet. Opening the sheet (and asserting its form) is the stable
 * coverage; an actual tag create persists in the shared org but is harmless —
 * left out here to keep the run idempotent.
 *
 * ⏳ Written without running; selectors grounded in custom-data-page.tsx +
 * custom-tags-tab.tsx + create-tag-sheet.tsx. Verify on first run.
 */
test.describe('organization-settings — custom data (owner)', () => {
  test('Custom Tags / Custom Enums tab toggle switches the active tab', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    const tags = page.getByRole('tab', { name: 'Custom Tags' })
    const enums = page.getByRole('tab', { name: 'Custom Enums' })
    await expect(tags).toBeVisible()
    await expect(enums).toBeVisible()

    await enums.click()
    await expect(enums).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
    await expect(tags).toHaveAttribute('aria-selected', 'false')
  })

  test('Create Tag opens the create-tag sheet with a name field', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create Tag$/ }).click()

    // create-tag-sheet.tsx: SheetTitle "Create Custom Tag" + a "Name" field.
    await expect(page.getByText('Create Custom Tag')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Name', { exact: true })).toBeVisible()
  })

  test('Custom Enums tab → Create Enum opens the create-enum sheet', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await page.getByRole('button', { name: /^Create Enum$/ }).click()

    // create-enum-sheet.tsx opens (isCreate) with a "Name" field in the sheet.
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('Name', { exact: true })).toBeVisible()
  })

  test('the Custom Tags tab exposes search + a column-visibility menu', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    // custom-tags-tab.tsx: search "Search tags..." + shared ColumnVisibilityMenu.
    await expect(page.getByPlaceholder('Search tags...')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('the Custom Enums tab exposes its own search box', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    // custom-enums-tab.tsx: search "Search enums...".
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('organization-settings — integrations marketplace (owner)', () => {
  test('the marketplace shows the All / Installed filter tabs', async ({ page }) => {
    await page.goto('/organization-settings/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    // integrations-toolbar.tsx renders Radix tabs labelled "All (N)" / "Installed (N)".
    await expect(page.getByRole('tab', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^Installed \(\d+\)$/ })).toBeVisible()
  })
})

test.describe('organization-settings — billing (owner)', () => {
  test('billing page renders the Billing Settings section with Address + Email', async ({ page }) => {
    await page.goto('/organization-settings/billing', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Billing$/ })).toBeVisible({ timeout: 20_000 })

    // billing-settings.tsx: "Billing Settings" h2 + "Address" / "Email" h3.
    await expect(page.getByRole('heading', { name: 'Billing Settings' }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Address' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Email' }).first()).toBeVisible()
  })
})

test.describe('organization-settings — general settings (owner)', () => {
  test('shows the Organization name, Transfer ownership + Delete organization sections', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^General$/ })).toBeVisible({ timeout: 20_000 })

    // PanelHeaders from organization-name-form / transfer-ownership / organization-delete.
    await expect(page.getByText('Organization name').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible()
    await expect(page.getByText('Delete organization').first()).toBeVisible()
  })
})

test.describe('organization-settings — authentication (owner)', () => {
  test('shows the Allowed Domains + SSO Configuration sections', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Authentication$/ })).toBeVisible({ timeout: 20_000 })

    // allowed-domains.tsx PanelHeader + sso.tsx <h3>SSO Configuration</h3>.
    await expect(page.getByRole('heading', { name: 'Allowed domains' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'SSO Configuration' }).first()).toBeVisible()
  })

  test('an invalid allowed-domain shows a validation error (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Allowed domains' })).toBeVisible({ timeout: 20_000 })

    // allowed-domains.tsx validates with isValidDomain BEFORE mutating, so an
    // invalid value surfaces the inline error and never touches the org setting.
    await page.getByPlaceholder('example.com').fill('not a valid domain!!')
    await page.getByRole('button', { name: /^Add Domain$/ }).click()
    await expect(page.getByText(/is not a valid domain/i)).toBeVisible({ timeout: 10_000 })
  })
})
