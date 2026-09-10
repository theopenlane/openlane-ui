import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'

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

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })
    })
  }
})

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

    await expect(page.getByText('Create Custom Tag')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Name', { exact: true })).toBeVisible()
  })

  test('Custom Enums tab → Create Enum opens the create-enum sheet', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await page.getByRole('button', { name: /^Create Enum$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('Name', { exact: true })).toBeVisible()
  })

  test('the Custom Tags tab exposes search + a column-visibility menu', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByPlaceholder('Search tags...')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('the Custom Enums tab exposes its own search box', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })
  })

  test('Custom Enums: the group filter Select lists enum groups and switches the active group', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })

    const groupSelect = page.getByRole('combobox').filter({ hasText: 'environments' })
    await expect(groupSelect).toBeVisible({ timeout: 10_000 })
    await groupSelect.click()

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await expect(listbox.getByRole('option', { name: 'all enums' })).toBeVisible()
    await listbox.getByRole('option', { name: 'scopes' }).click()

    await expect(page.getByRole('combobox').filter({ hasText: 'scopes' })).toBeVisible({ timeout: 10_000 })
  })

  test('Custom Enums: the column-visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/organization-settings/custom-data', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Custom Data$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('tab', { name: 'Custom Enums' }).click()
    await expect(page.getByPlaceholder('Search enums...')).toBeVisible({ timeout: 15_000 })

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

    const nameHeader = page.getByRole('button', { name: 'Name', exact: true })
    await expect(nameHeader).toBeVisible({ timeout: 15_000 })

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

    await expect(page.getByRole('heading', { name: 'Billing Settings' }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Address' }).first()).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Email' }).first()).toBeVisible()
  })
})

test.describe('organization-settings — general settings (owner)', () => {
  test('shows the Organization name, Transfer ownership + Delete organization sections', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^General$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Organization name').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible()
    await expect(page.getByText('Delete organization').first()).toBeVisible()
  })
})

test.describe('organization-settings — authentication (owner)', () => {
  test('shows the Allowed Domains + Single Sign-On sections', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Authentication$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('heading', { name: 'Allowed domains' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Single Sign-On (SSO)' }).first()).toBeVisible()
  })

  test('an invalid allowed-domain shows a validation error (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Allowed domains' })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('example.com').fill('not a valid domain!!')
    await page.getByRole('button', { name: /^Add Domain$/ }).click()
    await expect(page.getByText(/is not a valid domain/i)).toBeVisible({ timeout: 10_000 })
  })

  test('Configure/Edit SSO switches into the SSO edit form (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Single Sign-On (SSO)' }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ }).click()

    await expect(page.getByText('Identity Provider', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Client ID', { exact: true })).toBeVisible()
  })
})

test.describe('organization-settings — read-only flows (owner)', () => {
  test('general settings org-name form shows a validation error on a too-short name (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Organization name').first()).toBeVisible({ timeout: 20_000 })

    const nameInput = page.locator('input[name="displayName"]')
    await expect(nameInput).toBeVisible({ timeout: 15_000 })
    await nameInput.fill('a')

    await page.getByRole('button', { name: /Save Changes/ }).click()
    await expect(page.getByText(/Display name must be at least 2 characters/i)).toBeVisible({ timeout: 10_000 })
  })

  test('subscribers page renders its search toolbar', async ({ page }) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 15_000 })
  })

  test('billing page renders the subscription summary section + side navigation', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/billing', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Billing$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('heading', { name: 'Summary' }).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Billing Settings' })).toBeVisible()
  })
})

test.describe('organization-settings — subscribers (owner)', () => {
  test('subscribers bulk-upload dialog opens with the CSV format callout', async ({ page }) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Bulk Upload$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('CSV Format')).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Upload$/ })).toBeDisabled()
  })

  test('subscribers filter menu exposes the Email / Active / Verified fields', async ({ page }) => {
    await page.goto('/organization-settings/subscribers', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Subscribers$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Email', { exact: true })).toBeVisible()
    await expect(menu.getByText('Active', { exact: true })).toBeVisible()
    await expect(menu.getByText('Verified', { exact: true })).toBeVisible()
  })
})

test.describe('organization-settings — general settings dialogs (owner)', () => {
  test('Transfer ownership dialog opens with an Email field and a disabled Transfer button', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Transfer ownership$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('heading', { name: 'Transfer ownership' })).toBeVisible()

    await expect(dialog.getByRole('button', { name: /^Transfer$/ })).toBeDisabled()
  })

  test('Transfer ownership: an invalid email keeps the Transfer button disabled (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Transfer ownership$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder('Email').fill('not-an-email')
    await expect(dialog.getByRole('button', { name: /^Transfer$/ })).toBeDisabled()
  })

  test('Delete organization dialog requires typing DELETE before confirm is enabled (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Delete organization').first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Delete organization$/ }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText(/To confirm, please type/i)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Delete$/ })).toBeDisabled()

    await dialog.getByRole('textbox').fill('nope')
    await expect(dialog.getByRole('button', { name: /^Delete$/ })).toBeDisabled()
  })

  test('general settings renders the Avatar upload panel with a file input', async ({ page }) => {
    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^General$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('heading', { name: 'Avatar' })).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('input[type="file"]')).toHaveCount(1)
  })
})

test.describe('organization-settings — authentication SSO edit form (owner)', () => {
  test('SSO edit form: opening the Identity Provider select lists providers (no mutation)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Single Sign-On (SSO)' }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ }).click()
    await expect(page.getByText('Identity Provider', { exact: true })).toBeVisible({ timeout: 10_000 })

    await page.getByRole('combobox').first().click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await expect(listbox.getByRole('option').first()).toBeVisible()
  })

  test('SSO edit form: the Client ID field accepts input (form-state only, no save)', async ({ page }) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: 'Single Sign-On (SSO)' }).first()).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ }).click()
    await expect(page.getByText('Client ID', { exact: true })).toBeVisible({ timeout: 10_000 })

    const clientId = page.getByPlaceholder('Enter client ID')
    await clientId.fill('e2e-throwaway-client-id')
    await expect(clientId).toHaveValue('e2e-throwaway-client-id')

    await page.getByRole('button', { name: /^Cancel$/ }).click()
    await expect(page.getByRole('button', { name: /^(Configure SSO|Edit Configuration)$/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('organization-settings — support access (#1957)', () => {
  test('the Openlane Support Access panel renders with a status badge and toggle', async ({ page }) => {
    test.slow()
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Authentication$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Openlane Support Access', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/Allow Openlane support engineers to temporarily access your organization/)).toBeVisible()

    await expect(page.getByText(/^● (Enabled|Disabled)$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^(Enable Access|Revoke Access)$/ })).toBeVisible()
  })
})

test.describe('organization-settings — SSO exempt domains (#1957)', () => {
  const openExemptSection = async (page: Page) => {
    await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Authentication$/ })).toBeVisible({ timeout: 20_000 })
    const heading = page.getByText('Exempt Domains', { exact: true })
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

    const input = page.getByPlaceholder('example.com').last()
    await input.fill('not-a-domain')
    await page.getByRole('button', { name: /^Add$/ }).last().click()

    await expect(page.getByText('"not-a-domain" is not a valid domain')).toBeVisible({ timeout: 10_000 })
  })
})

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
