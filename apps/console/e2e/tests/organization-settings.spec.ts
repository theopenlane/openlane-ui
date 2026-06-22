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

  /**
   * Custom Enums tab: the enum-group filter Select, the column-visibility menu,
   * and column-header sorting. All three are client-side / read-only — filtering
   * and sorting only re-query reads, the visibility menu only toggles local state.
   *
   * Selectors grounded in custom-enums-tab.tsx (group Select + ColumnVisibilityMenu)
   * + custom-enums-config.ts (ENUM_GROUPS rendered lowercased) + data-table.tsx
   * (sortable header is role=button with title "Sort by <label>"; the <th> carries
   * aria-sort). The default group is "Environments" and the default sort is Name ASC.
   */
  test('Custom Enums: the group filter Select lists enum groups and switches the active group', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })

    // The group Select trigger shows the lowercased default group ("environments").
    // Scope past the pagination page-size combobox by matching its text.
    const groupSelect = page.getByRole('combobox').filter({ hasText: 'environments' })
    await expect(groupSelect).toBeVisible({ timeout: 10_000 })
    await groupSelect.click()

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    // ENUM_GROUP_MAP labels are lowercased in the options.
    await expect(listbox.getByRole('option', { name: 'all enums' })).toBeVisible()
    await listbox.getByRole('option', { name: 'scopes' }).click()

    // After selecting, the trigger reflects the new group.
    await expect(page.getByRole('combobox').filter({ hasText: 'scopes' })).toBeVisible({ timeout: 10_000 })
  })

  test('Custom Enums: the column-visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })

    // Shared ColumnVisibilityMenu trigger labelled "Columns".
    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Description', { exact: true })).toBeVisible()
  })

  test('Custom Enums: clicking the Name column header toggles its aria-sort (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })

    // data-table.tsx renders the sortable header as a clickable role=button whose
    // accessible name is the column label "Name" (title "Sort by Name" is advisory).
    const nameHeader = page.getByRole('button', { name: 'Name', exact: true })
    await expect(nameHeader).toBeVisible({ timeout: 15_000 })

    // Default sort is Name ASC → the enclosing columnheader (<th>) has aria-sort="ascending".
    const th = page.getByRole('columnheader').filter({ hasText: 'Name' }).first()
    await expect(th).toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })

    await nameHeader.click()
    await expect(th).toHaveAttribute('aria-sort', 'descending', { timeout: 10_000 })
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

  test('Configure/Edit SSO switches into the SSO edit form (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'SSO Configuration' }).first()).toBeVisible({ timeout: 20_000 })

    // sso.tsx SSOOverview button reads "Configure SSO" (unconfigured) or
    // "Edit Configuration" (configured); both flip viewMode to the edit form
    // client-side — no mutation happens until the form is submitted.
    await page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ }).click()

    // The edit form exposes the Identity Provider + Client ID labelled fields.
    await expect(page.getByText('Identity Provider', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Client ID', { exact: true })).toBeVisible()
  })
})

/**
 * Read-only / validation-only coverage that does NOT mutate the shared org.
 * The org-name "Save Changes" path is exercised with an invalid value so Zod
 * blocks the submit before any updateOrganization mutation fires; the billing
 * + subscribers + integrations assertions are pure renders.
 */
test.describe('organization-settings — read-only flows (owner)', () => {
  test('general settings org-name form shows a validation error on a too-short name (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Organization name').first()).toBeVisible({ timeout: 20_000 })

    // organization-name-form.tsx: displayName must be >= 2 chars. Clearing it and
    // submitting via the "Save Changes" button surfaces the inline RHF error and
    // never calls updateOrg, so the shared org's name is untouched.
    const nameInput = page.locator('input[name="displayName"]')
    await expect(nameInput).toBeVisible({ timeout: 15_000 })
    await nameInput.fill('a')

    await page.getByRole('button', { name: /Save Changes/ }).click()
    await expect(page.getByText(/Display name must be at least 2 characters/i)).toBeVisible({ timeout: 10_000 })
  })

  test('integrations marketplace switches to the Coming Soon tab', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    // integrations-toolbar.tsx: underline Radix tabs "All (N)" / "Coming Soon (N)" /
    // "Installed (N)" + a "Search integrations..." box.
    const comingSoon = page.getByRole('tab', { name: /^Coming Soon \(\d+\)$/ })
    await expect(comingSoon).toBeVisible({ timeout: 15_000 })
    await comingSoon.click()
    await expect(comingSoon).toHaveAttribute('data-state', 'active', { timeout: 10_000 })
    await expect(page.getByPlaceholder('Search integrations...')).toBeVisible()
  })

  test('subscribers page renders its search toolbar', async ({ page }) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 20_000 })

    // subscribers-table-toolbar.tsx renders a single "Search" input above the table.
    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 15_000 })
  })

  test('billing page renders the subscription summary section + side navigation', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/billing', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Billing$/ })).toBeVisible({ timeout: 20_000 })

    // pricing-plan.tsx → billing-summary.tsx renders <h2 id="summary">Summary</h2>
    // and side-navigation.tsx renders a "Summary" anchor button. Read-only.
    await expect(page.getByRole('heading', { name: 'Summary' }).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Billing Settings' })).toBeVisible()
  })
})

/**
 * Integrations marketplace + Subscribers additive/dialog-OPEN coverage.
 *
 * The "webhook" surface in this codebase is the one-time secret panel rendered
 * AFTER an integration connect completes (webhook-details-section.tsx) — there is
 * no standalone webhook create/list/delete CRUD under org-settings, so a webhook
 * lifecycle test is not authorable here. The closest non-destructive flows are:
 * the integrations marketplace search (client filters the grid → empty state) and
 * navigating into an integration definition detail page (read-only), plus the
 * subscribers bulk-upload dialog + filter menu (dialog-OPEN, no mutation). All of
 * these are side-effect-free on the shared org.
 *
 * Selectors grounded in integrations-page.tsx + integrations-grid.tsx +
 * available-integration-card.tsx + integration-definition-page.tsx +
 * subscribers-table-toolbar.tsx + bulk-csv-create-subscriber-dialog.tsx +
 * table-filter.tsx (subscriber filter fields).
 */
test.describe('organization-settings — integrations & subscribers (owner)', () => {
  test('marketplace search with no match shows the empty-state message', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    // Wait for the providers to render so the grid is populated before filtering.
    await expect(page.getByRole('tab', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    // integrations-grid.tsx filters client-side; a nonsense query yields the
    // "No integrations match your search." empty state. No mutation.
    await page.getByPlaceholder('Search integrations...').fill('zzz-nonexistent-provider-zzz')
    await expect(page.getByText('No integrations match your search.')).toBeVisible({ timeout: 10_000 })
  })

  test('navigating an integration card opens its definition detail page (read-only)', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('tab', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    // available-integration-card.tsx renders a footer "View" / "Manage" button per
    // active provider that router.push-es to /integrations/[id]. Clicking the first
    // navigates without mutating anything.
    const viewButton = page.getByRole('button', { name: /^(View|Manage)$/ }).first()
    await expect(viewButton).toBeVisible({ timeout: 15_000 })
    await viewButton.click()

    // integration-definition-page.tsx renders an "Integrations" back button.
    await expect(page).toHaveURL(/\/organization-settings\/integrations\/[^/]+$/, { timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Integrations$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('subscribers bulk-upload dialog opens with the CSV format callout', async ({ page }) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 20_000 })

    // subscribers-table-toolbar.tsx hides Export + the bulk-upload dialog behind the
    // shared Menu (menu.tsx) whose default trigger is an ellipsis icon button with
    // aria-label "Action". Open it, then click the BulkCSVCreateSubscriberDialog
    // "Bulk Upload" trigger inside.
    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Bulk Upload$/ }).click()

    // bulk-csv-create-subscriber-dialog.tsx: DialogTitle "Bulk Upload" + "CSV Format"
    // callout. No upload is performed, so no subscriber is created.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('CSV Format')).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()
  })

  test('subscribers filter menu exposes the Email / Active / Verified fields', async ({ page }) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 15_000 })

    // table-filter.tsx: a "Filter" DropdownMenu trigger reveals the configured
    // SUBSCRIBERS_FILTER_FIELDS (Email / Active / Verified). Read-only.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Email', { exact: true })).toBeVisible()
    await expect(menu.getByText('Active', { exact: true })).toBeVisible()
    await expect(menu.getByText('Verified', { exact: true })).toBeVisible()
  })
})

/**
 * General-settings additive/dialog-OPEN coverage that never mutates the shared org.
 *
 * - Transfer ownership opens the dialog; an invalid email keeps the "Transfer"
 *   button disabled (transfer-ownership-dialog.tsx gates on isValidEmail) and a
 *   partial match surfaces the contact suggestion listbox. No transfer fires.
 * - Delete organization opens its alertdialog; the confirm button stays disabled
 *   until "DELETE" is typed (confirmation-dialog.tsx). We never type it, so the
 *   org is untouched.
 * - The Avatar panel renders a dropzone with a hidden file input — render-only.
 *
 * Selectors grounded in organization-name-form.tsx, transfer-ownership.tsx,
 * transfer-ownership-dialog.tsx, organization-delete.tsx, avatar-upload.tsx.
 */
test.describe('organization-settings — general settings dialogs (owner)', () => {
  test('Transfer ownership dialog opens with an Email field and a disabled Transfer button', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Transfer ownership$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('heading', { name: 'Transfer ownership' })).toBeVisible()

    // Empty email → the Transfer button is disabled (isValidEmail gate). No mutation.
    await expect(dialog.getByRole('button', { name: /^Transfer$/ })).toBeDisabled()
  })

  test('Transfer ownership: an invalid email keeps the Transfer button disabled (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Transfer ownership$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // transfer-ownership-dialog.tsx: button disabled while !isValidEmail(email).
    await dialog.getByPlaceholder('Email').fill('not-an-email')
    await expect(dialog.getByRole('button', { name: /^Transfer$/ })).toBeDisabled()
  })

  test('Delete organization dialog requires typing DELETE before confirm is enabled (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Delete organization').first()).toBeVisible({ timeout: 20_000 })

    // organization-delete.tsx ManagementRow action button "Delete organization".
    await page.getByRole('button', { name: /^Delete organization$/ }).click()

    // ConfirmationDialog renders as an alertdialog with showInput; the confirm
    // "Delete" button is disabled until "DELETE" is typed. We never type it.
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/To confirm, please type/i)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Delete$/ })).toBeDisabled()

    // A wrong value keeps it disabled — still no destructive mutation possible.
    await dialog.getByRole('textbox').fill('nope')
    await expect(dialog.getByRole('button', { name: /^Delete$/ })).toBeDisabled()
  })

  test('general settings renders the Avatar upload panel with a file input', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^General$/ })).toBeVisible({ timeout: 20_000 })

    // avatar-upload.tsx PanelHeader "Avatar" + a react-dropzone hidden file input.
    await expect(page.getByRole('heading', { name: 'Avatar' })).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input[type="file"]')).toHaveCount(1)
  })
})

/**
 * Authentication: SSO edit-form interactions + allowed-domain chip rendering.
 * All flows stop short of a Save click, so no updateOrganizationSetting fires.
 *
 * Selectors grounded in sso.tsx (edit form: Identity Provider select / Client ID
 * input) and allowed-domains.tsx (domain chip + Trash2 remove button).
 */
test.describe('organization-settings — authentication SSO edit form (owner)', () => {
  test('SSO edit form: opening the Identity Provider select lists providers (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'SSO Configuration' }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ }).click()
    await expect(page.getByText('Identity Provider', { exact: true })).toBeVisible({ timeout: 10_000 })

    // Open the provider Select; identityProviderOptions render as listbox options.
    await page.getByRole('combobox').first().click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await expect(listbox.getByRole('option').first()).toBeVisible()
  })

  test('SSO edit form: the Client ID field accepts input (form-state only, no save)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'SSO Configuration' }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ }).click()
    await expect(page.getByText('Client ID', { exact: true })).toBeVisible({ timeout: 10_000 })

    // Typing a value updates RHF state only; nothing persists without Save Changes.
    const clientId = page.getByPlaceholder('Enter client ID')
    await clientId.fill('e2e-throwaway-client-id')
    await expect(clientId).toHaveValue('e2e-throwaway-client-id')

    // Cancel discards the edit form back to the overview — no mutation occurred.
    await page.getByRole('button', { name: /^Cancel$/ }).click()
    await expect(page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ })).toBeVisible({ timeout: 10_000 })
  })
})
