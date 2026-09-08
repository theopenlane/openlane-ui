import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'

import { uniqueName } from '../utils/unique'

const vendorName = (slug: string) => uniqueName(`E2E Vendor ${slug}`)

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

const advanceToLastStep = async (dialog: ReturnType<Page['getByRole']>) => {
  const next = dialog.getByRole('button', { name: /^next$/i })
  for (let step = 0; step < 10; step++) {
    if (!(await next.isVisible().catch(() => false))) break
    await next.click()
  }
  await expect(dialog.getByRole('button', { name: /^create$/i })).toBeVisible({ timeout: 10_000 })
}

test.describe('registry — vendor create wizard', () => {
  test('happy path — name-only step wizard creates a vendor visible on /registry/vendors', async ({ page }) => {
    await page.goto('/registry/vendors')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const name = vendorName('create')
    await dialog.getByLabel(/^Vendor Name/).fill(name)

    await advanceToLastStep(dialog)

    await dialog.getByRole('button', { name: /^create$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 30_000 })
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('clicking a vendor row opens the detail page (full-page route)', async ({ page }) => {
    await page.goto('/registry/vendors')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()
    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const name = vendorName('detail')
    await dialog.getByLabel(/^Vendor Name/).fill(name)
    await advanceToLastStep(dialog)
    await dialog.getByRole('button', { name: /^create$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 30_000 })

    await page.getByRole('cell').filter({ hasText: name }).first().click()

    await page.waitForURL(/\/registry\/vendors\/[^/]+(\?|$)/, { timeout: 15_000 })
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

    await dialog.getByRole('button', { name: /^next$/i }).click()

    await expect(dialog.getByText(/^(Name is required|Required)$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('registry — legacy redirects', () => {
  test('/registry/vulnerabilities redirects to /exposure/vulnerabilities', async ({ page }) => {
    await page.goto('/registry/vulnerabilities')

    await expect(page).toHaveURL(/\/exposure\/vulnerabilities(\?|$)/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('registry — vendor list controls', () => {
  test('vendor filter panel exposes the documented Status/Scope/Source filters', async ({ page }) => {
    test.slow() // heavy registry route → cold dev compile
    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    for (const label of ['Status', 'Scope', 'Source Type', 'Relationship State', 'Security Questionnaire Status']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    }
  })

  test('vendor column visibility menu toggles a column off', async ({ page }) => {
    test.slow()
    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

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

    const header = page.getByRole('columnheader', { name: /Display Name/ }).first()
    await expect(header).toBeVisible({ timeout: 15_000 })
    await expect(header).toHaveAttribute('aria-sort', 'none')
    await header.getByText('Display Name').click()
    await expect(header).toHaveAttribute('aria-sort', /ascending|descending/, { timeout: 10_000 })
  })
})

test.describe('registry — vendor create Security step (ISS-2410)', () => {
  const openWizardAtSecurity = async (page: Page, name: string) => {
    await page.goto('/registry/vendors')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByLabel(/^Vendor Name/).fill(name)

    const next = dialog.getByRole('button', { name: /^next$/i })
    for (let step = 0; step < 6; step++) {
      if (
        await dialog
          .getByText('Security Features', { exact: true })
          .isVisible()
          .catch(() => false)
      )
        break
      await next.click()
    }
    return dialog
  }

  test('the Security step renders both cards and all security toggles', async ({ page }) => {
    test.slow()
    const dialog = await openWizardAtSecurity(page, vendorName('security-render'))

    await expect(dialog.getByText('Compliance and Risk', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText('Security Features', { exact: true })).toBeVisible()

    await expect(dialog.getByText('Has SOC 2', { exact: true })).toBeVisible()
    await expect(dialog.getByText('SOC 2 Period End', { exact: true })).toBeVisible()
    await expect(dialog.getByText('SSO Enforced', { exact: true })).toBeVisible()
    await expect(dialog.getByText('MFA Supported', { exact: true })).toBeVisible()
    await expect(dialog.getByText('MFA Enforced', { exact: true })).toBeVisible()
  })

  test('a vendor can be created with the security toggles set', async ({ page }) => {
    test.slow()
    const name = vendorName('security-create')
    const dialog = await openWizardAtSecurity(page, name)
    await expect(dialog.getByText('Security Features', { exact: true })).toBeVisible({ timeout: 15_000 })

    const soc2 = dialog.getByRole('checkbox').first()
    await soc2.click()
    await expect(soc2).toBeChecked()

    await advanceToLastStep(dialog)
    await dialog.getByRole('button', { name: /^create$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 30_000 })

    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('registry — vendor create is domain-first (ISS-2525)', () => {
  test('step 1 leads with the Vendor domain field and its prefill hint', async ({ page }) => {
    test.slow()
    await page.goto('/registry/vendors')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create vendor/i })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await expect(dialog.getByText('Vendor domain', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText(/We'll use this to find vendor details and prefill what we can\./)).toBeVisible()
    await expect(dialog.getByPlaceholder('example.com')).toBeVisible()

    const domainBox = await dialog.getByText('Vendor domain', { exact: true }).boundingBox()
    const nameBox = await dialog.getByLabel(/^Vendor Name/).boundingBox()
    expect(domainBox && nameBox && domainBox.y < nameBox.y).toBe(true)
  })
})
