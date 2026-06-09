import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createAsset, createContact, createVendor, type ApiSession } from '../utils/api'

/**
 * Deep registry flows beyond registry.spec.ts (list render + vendor create on
 * fresh users): server-side search for assets and contacts. Runs as the
 * storage-state Owner; entities seeded via the Owner API with run-unique names.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueName = (prefix: string) => `${prefix} ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('registry — assets', () => {
  test('search filters assets to the matching seeded asset', async ({ page }) => {
    const a = uniqueName('E2E Asset')
    const b = uniqueName('E2E Asset')
    await createAsset(ownerApi, a)
    await createAsset(ownerApi, b)

    await page.goto('/registry/assets', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Assets$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder(/^Search$/).fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('opening an asset via ?id= shows the detail sheet with edit + copy-link', async ({ page }) => {
    const id = await createAsset(ownerApi, uniqueName('E2E Asset'))

    // assets/table/table.tsx onRowClick → replace({ id }), so the GenericDetailsSheet
    // opens directly from the query param. Header exposes Copy link + Edit (owner).
    await page.goto(`/registry/assets?id=${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Copy link$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('filter panel exposes an Asset Type filter', async ({ page }) => {
    await page.goto('/registry/assets', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Assets$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText('Asset Type').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('registry — contacts', () => {
  test('search filters contacts to the matching seeded contact', async ({ page }) => {
    const a = uniqueName('E2E Contact')
    const b = uniqueName('E2E Contact')
    await createContact(ownerApi, a)
    await createContact(ownerApi, b)

    await page.goto('/registry/contacts', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Contacts$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder(/^Search$/).fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('opening a contact via ?id= shows the detail sheet with edit + copy-link', async ({ page }) => {
    const id = await createContact(ownerApi, uniqueName('E2E Contact'))

    // contacts/table/table.tsx onRowClick → replace({ id }) (same crud-base sheet).
    await page.goto(`/registry/contacts?id=${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Copy link$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/registry/contacts', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Contacts$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('registry — vendor detail (seeded)', () => {
  test('vendor detail page renders the tab bar (Overview / Documents / Contacts)', async ({ page }) => {
    test.slow()
    const id = await createVendor(ownerApi, uniqueName('E2E Vendor'))

    // vendor-detail-tabs.tsx renders URL-controlled Radix tabs; Overview/
    // Documents/Contacts are always present (Directory is conditional).
    await page.goto(`/registry/vendors/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('tab', { name: 'Documents' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Contacts' })).toBeVisible()
  })

  test('switching vendor tabs updates the active selection (URL-controlled)', async ({ page }) => {
    test.slow()
    const id = await createVendor(ownerApi, uniqueName('E2E Vendor'))

    await page.goto(`/registry/vendors/${id}`, { waitUntil: 'domcontentloaded' })
    const documents = page.getByRole('tab', { name: 'Documents' })
    const contacts = page.getByRole('tab', { name: 'Contacts' })
    await expect(documents).toBeVisible({ timeout: 30_000 })

    // vendor-detail-tabs.tsx is URL-controlled (router.replace ?tab=…); wait for
    // the commit before asserting the controlled aria-selected flips.
    await documents.click()
    await page.waitForURL(/[?&]tab=documents/, { timeout: 15_000 })
    await expect(documents).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })

    await contacts.click()
    await page.waitForURL(/[?&]tab=contacts/, { timeout: 15_000 })
    await expect(contacts).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(documents).toHaveAttribute('aria-selected', 'false')
  })

  test('vendor Contacts tab → Add Contact opens the dialog', async ({ page }) => {
    test.slow()
    const id = await createVendor(ownerApi, uniqueName('E2E Vendor'))

    await page.goto(`/registry/vendors/${id}?tab=contacts`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Contacts' })).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })

    // contacts-tab.tsx "Add Contact" button → add-contact-dialog.tsx (DialogTitle).
    await page.getByRole('button', { name: /^Add Contact$/ }).click()
    await expect(page.getByRole('dialog').getByText('Add Contact')).toBeVisible({ timeout: 10_000 })
  })

  test('vendor Documents tab → Upload opens the document upload dialog', async ({ page }) => {
    test.slow()
    const id = await createVendor(ownerApi, uniqueName('E2E Vendor'))

    await page.goto(`/registry/vendors/${id}?tab=documents`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Documents' })).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })

    // documents-tab.tsx "Upload" → documents-upload-dialog.tsx with title="Upload Documents".
    await page
      .getByRole('button', { name: /^Upload$/ })
      .first()
      .click()
    await expect(page.getByRole('dialog').getByText('Upload Documents')).toBeVisible({ timeout: 10_000 })
  })
})

// Filter panels on the user-managed registry sub-pages (shared TableFilter).
const REGISTRY_FILTER_PAGES = [
  { path: '/registry/personnel', heading: /^Personnel$/, field: 'Status' },
  { path: '/registry/system-details', heading: /^System Details$/, field: 'Sensitivity Level' },
]

test.describe('registry — sub-page filters', () => {
  for (const { path, heading, field } of REGISTRY_FILTER_PAGES) {
    test(`${path} filter panel exposes a "${field}" field`, async ({ page }) => {
      test.slow() // heavy registry route → cold dev compile
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })

      await page.getByRole('button', { name: /^Filter$/ }).click()
      await expect(page.getByText(field, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    })
  }
})
