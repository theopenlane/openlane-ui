import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Owner-only settings pages.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/organization-settings', heading: /^Organization Settings$/ },
  { path: '/organization-settings/general-settings', heading: /^General$/ },
  { path: '/organization-settings/custom-data', heading: /^Custom Data$/ },
  { path: '/organization-settings/billing', heading: /^Billing$/ },
  { path: '/organization-settings/authentication', heading: /^Authentication$/ },
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
 * Subscribers additive/dialog-OPEN coverage. The integrations marketplace moved
 * to /automation/integrations and is covered in integrations.spec.ts.
 *
 * The "webhook" surface in this codebase is the one-time secret panel rendered
 * AFTER an integration connect completes (webhook-details-section.tsx) — there is
 * no standalone webhook create/list/delete CRUD under org-settings, so a webhook
 * lifecycle test is not authorable here. The subscribers bulk-upload dialog +
 * filter menu are dialog-OPEN only, so they stay side-effect-free on the shared org.
 *
 * Selectors grounded in subscribers-table-toolbar.tsx +
 * bulk-csv-create-subscriber-dialog.tsx + table-filter.tsx (subscriber filter fields).
 */
test.describe('organization-settings — subscribers (owner)', () => {
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
    await page.getByRole('button', { name: /^Filter/ }).click()
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

/**
 * #1957 (SSO exemption + Openlane support access) added two panels to
 * /organization-settings/authentication:
 *
 *  - support-access.tsx: an "Openlane Support Access" card with an
 *    Enabled/Disabled badge and an Enable/Revoke toggle button.
 *  - sso.tsx: an "Exempt Domains" DomainListEditor whose entries are saved
 *    immediately, guarded client-side by isValidDomain (unit-tested in
 *    utils/strings.test.ts).
 *
 * Support access is never toggled here — enabling it would grant real support
 * engineers access to the shared seeded org. The exempt-domain test drives only
 * the client-side rejection path, which returns before any mutation.
 */
test.describe('organization-settings — support access (#1957)', () => {
  test('the Openlane Support Access panel renders with a status badge and toggle', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Authentication$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Openlane Support Access', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Allow Openlane support engineers to temporarily access your organization/)).toBeVisible()

    // Badge reads "● Enabled" / "● Disabled"; the button mirrors it.
    await expect(page.getByText(/^● (Enabled|Disabled)$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^(Enable Access|Revoke Access)$/ })).toBeVisible()
  })
})

test.describe('organization-settings — SSO exempt domains (#1957)', () => {
  // sso.tsx renders the exempt-domain editor only when isSSOConfigured. The
  // shared seeded org has no IdP wired up, so these skip unless a run happens to
  // have SSO configured — they exist so the surface is asserted wherever it IS
  // reachable, rather than silently going uncovered.
  const openExemptSection = async (page: Page) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Authentication$/ })).toBeVisible({ timeout: 20_000 })
    const heading = page.getByText('Exempt Domains', { exact: true })
    // Give the SSO config query time to resolve before deciding.
    await page.waitForTimeout(2_000)
    return heading.isVisible().catch(() => false)
  }

  test('the Exempt Domains editor renders with its owner-exemption note', async ({ page }) => {
    test.slow()
    test.skip(!(await openExemptSection(page)), 'org has no SSO configured — exempt-domain editor not rendered')

    await expect(page.getByText(/exempt from SSO enforcement\. Changes are saved immediately\./)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/automatically exempt from SSO enforcement/)).toBeVisible()
  })

  test('an invalid exempt domain is rejected client-side without saving', async ({ page }) => {
    test.slow()
    test.skip(!(await openExemptSection(page)), 'org has no SSO configured — exempt-domain editor not rendered')

    // addExemptDomain returns before saveDomains when isValidDomain fails, so
    // this never mutates the org. The exempt editor is the last domain editor on
    // the page (allowed-domains renders above it).
    const input = page.getByPlaceholder('example.com').last()
    await input.fill('not-a-domain')
    await page.getByRole('button', { name: /^Add$/ }).last().click()

    await expect(page.getByText('"not-a-domain" is not a valid domain')).toBeVisible({ timeout: 10_000 })
  })
})

/**
 * ISS-2756 — the org settings page surfaces a copy-able Organization ID for use
 * in the API and integrations, rendered through the shared CopyableText chip
 * with an accessible "Copy organization ID …" label.
 */
test.describe('organization-settings — copyable org id (ISS-2756)', () => {
  test('the settings page shows the Organization ID with a copy control', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^General$/ })).toBeVisible({ timeout: 30_000 })

    await expect(page.getByText('Organization ID', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Use this ID in the Openlane API and integrations.')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Copy organization ID / })).toBeVisible({ timeout: 15_000 })
  })
})
