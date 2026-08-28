import { type Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { createAsset, createContact, createVendor, createSystemDetail, gql, type ApiSession, getOwnerApi } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { expectMutationOk } from '../utils/mutations'

/**
 * Deep registry flows beyond registry.spec.ts (list render + vendor create on
 * fresh users): server-side search for assets and contacts. Runs as the
 * storage-state Owner; entities seeded via the Owner API with run-unique names.
 */

let ownerApi: ApiSession

// createAsset (utils/api.ts) only sets `name`; the Asset Type filter needs a
// typed row, so seed one inline through the same /query client with assetType.
const createAssetTyped = async (sess: ApiSession, name: string, assetType: string): Promise<string> => {
  const res = await gql<{ createAsset: { asset: { id: string } } }>(sess, `mutation($input: CreateAssetInput!){ createAsset(input: $input){ asset { id } } }`, { input: { name, assetType } })
  const id = res.data?.createAsset?.asset?.id
  if (!id) throw new Error(`createAssetTyped failed: ${JSON.stringify(res.errors)}`)
  return id
}

const openCreateSheet = async (page: Page) => {
  await page
    .getByRole('button', { name: /^Create$/ })
    .first()
    .click()
  const sheet = page.getByRole('dialog')
  await expect(sheet).toBeVisible({ timeout: 15_000 })
  return sheet
}

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
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

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
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

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
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

// NOTE: registry platforms — the `createPlatform` seeder works, but the
// platforms dashboard doesn't surface a freshly-seeded platform reliably
// (pagination/sort) and the heavy /registry/platforms/[id] detail route didn't
// render a bare-seeded platform within budget. Seeder kept as infra. ⏳

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

      await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
      await expect(page.getByText(field, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    })
  }
})

test.describe('registry — entity CRUD', () => {
  test('creating an asset via the slideout shows the success confirmation', async ({ page }) => {
    test.slow()
    await page.goto('/registry/assets', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Assets$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E Asset'))
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(page.getByText(/asset created/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('creating an asset requires a Name', async ({ page }) => {
    test.slow()
    await page.goto('/registry/assets', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Assets$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet.getByText(/required|Invalid input/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('deleting a seeded asset from the detail sheet confirms and removes it', async ({ page }) => {
    test.slow()
    const id = await createAsset(ownerApi, uniqueName('E2E Asset'))

    await page.goto(`/registry/assets?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 20_000 })

    await page
      .getByRole('button', { name: /^Delete$/ })
      .first()
      .click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText('Delete Asset')).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText(/asset deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('creating a contact via the slideout shows the success confirmation', async ({ page }) => {
    test.slow()
    await page.goto('/registry/contacts', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Contacts$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E Contact'))
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(page.getByText(/contact created/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('creating a contact requires a Full Name', async ({ page }) => {
    test.slow()
    await page.goto('/registry/contacts', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Contacts$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet.getByText(/required|Invalid input/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('deleting a seeded contact from the detail sheet confirms and removes it', async ({ page }) => {
    test.slow()
    const id = await createContact(ownerApi, uniqueName('E2E Contact'))

    await page.goto(`/registry/contacts?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 20_000 })

    await page
      .getByRole('button', { name: /^Delete$/ })
      .first()
      .click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText('Delete Contact')).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText(/contact deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('creating personnel via the slideout shows the success confirmation', async ({ page }) => {
    test.slow()
    await page.goto('/registry/personnel', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Personnel$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E Person'))
    await sheet.getByRole('textbox', { name: 'Email', exact: true }).fill(`e2e-person-${Date.now().toString(36)}@example.com`)
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    // The slideout closes on a successful create (the success toast title is
    // derived from the objectType — "Identityholder Created" — so assert the
    // close rather than entity-specific copy).
    await expect(sheet).toBeHidden({ timeout: 15_000 })
  })

  test('creating personnel requires a Full Name', async ({ page }) => {
    test.slow()
    await page.goto('/registry/personnel', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Personnel$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet.getByText(/required|Invalid input/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('creating a system detail via the slideout shows the success confirmation', async ({ page }) => {
    test.slow()
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E System'))
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    // The slideout closes on a successful create (toast title is "Systemdetail
    // Created", derived from objectType — assert the close, not the copy).
    await expect(sheet).toBeHidden({ timeout: 15_000 })
  })

  test('creating a system detail requires a System Name', async ({ page }) => {
    test.slow()
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet.getByText(/required|Invalid input/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('editing a seeded asset and saving shows the updated confirmation', async ({ page }) => {
    test.slow()
    const id = await createAsset(ownerApi, uniqueName('E2E Asset'))

    await page.goto(`/registry/assets?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page
      .getByRole('button', { name: /^Edit$/ })
      .first()
      .click()

    const sheet = page.getByRole('dialog')
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E Asset Edited'))
    await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(/asset updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('editing a seeded contact and saving shows the updated confirmation', async ({ page }) => {
    test.slow()
    const id = await createContact(ownerApi, uniqueName('E2E Contact'))

    await page.goto(`/registry/contacts?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page
      .getByRole('button', { name: /^Edit$/ })
      .first()
      .click()

    const sheet = page.getByRole('dialog')
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E Contact Edited'))
    await sheet.getByRole('textbox', { name: 'Email', exact: true }).fill(`e2e-contact-${Date.now().toString(36)}@example.com`)
    await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(/contact updated/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('registry — personnel + system-detail edit/delete', () => {
  // No API seeder exists for personnel/system-details, so each test first
  // creates the record through the UI slideout, then drives edit/delete.

  // Personnel detail is a FULL PAGE (/registry/personnel/[id]); the edit toast
  // is hardcoded "Personnel updated" in personnel-detail-page.tsx. System-detail
  // detail is the crud-base GenericDetailsSheet (?id=), whose update toast is
  // derived from objectType "SystemDetail" → "Systemdetail Updated".

  const createPersonnelViaUI = async (page: Page, name: string) => {
    await page.goto('/registry/personnel', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Personnel$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(name)
    await sheet.getByRole('textbox', { name: 'Email', exact: true }).fill(`e2e-person-${Date.now().toString(36)}@example.com`)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet).toBeHidden({ timeout: 20_000 })
  }

  const createSystemDetailViaUI = async (page: Page, name: string) => {
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(name)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet).toBeHidden({ timeout: 20_000 })
  }

  test('editing UI-created personnel from the detail page shows the updated confirmation', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Person')
    await createPersonnelViaUI(page, name)

    // personnel/table/table.tsx onRowClick → push(/registry/personnel/[id]).
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.click()

    await page.waitForURL(/\/registry\/personnel\/[^/]+$/, { timeout: 30_000 })

    // personnel-detail-header.tsx: the page-level Edit button carries
    // aria-label="Edit personnel" and toggles isEditing → renders SaveButton.
    await page.getByRole('button', { name: 'Edit personnel' }).click()

    const save = page.getByRole('button', { name: /^Save Changes$/ })
    await expect(save).toBeVisible({ timeout: 15_000 })

    // In edit mode the registered "fullName" <Input> is the first textbox.
    const fullName = page.getByRole('textbox').first()
    await fullName.fill(uniqueName('E2E Person Edited'))
    await save.click()

    await expect(page.getByText(/personnel updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('editing UI-created system detail from the slideout shows the updated confirmation', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E System')
    await createSystemDetailViaUI(page, name)

    // system-details/table/table.tsx onRowClick → replace({ id }); the detail
    // GenericDetailsSheet opens from ?id=.
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.click()

    await page
      .getByRole('button', { name: /^Edit$/ })
      .first()
      .click()

    const sheet = page.getByRole('dialog')
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E System Edited'))
    await sheet.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(/systemdetail updated/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('bulk deleting a UI-created system detail removes it from the list', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E System')
    await createSystemDetailViaUI(page, name)

    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    // Per-row select checkbox (header select-all is disabled); selecting reveals
    // the toolbar "Bulk Delete" button (table-toolbar.tsx).
    await row.getByRole('checkbox').click()
    await page.getByRole('button', { name: /^Bulk Delete/ }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByRole('cell').filter({ hasText: name })).toHaveCount(0, { timeout: 20_000 })
  })
})

test.describe('registry — server-side search', () => {
  // Each list page wires server-side search via searchFields →
  // *ContainsFold OR clauses (crud-base/page.tsx). Seed two run-unique rows
  // and assert search narrows to the matching one.

  test('vendors search narrows to the matching seeded vendor (displayNameContainsFold)', async ({ page }) => {
    test.slow()
    const a = uniqueName('E2E Vendor')
    const b = uniqueName('E2E Vendor')
    await createVendor(ownerApi, a)
    await createVendor(ownerApi, b)

    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder(/^Search$/).fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('system-details search narrows to the matching UI-created system (systemNameContainsFold)', async ({ page }) => {
    test.slow()
    const a = uniqueName('E2E System')
    const b = uniqueName('E2E System')

    // No API seeder for system-details → create both via the slideout.
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 20_000 })
    for (const name of [a, b]) {
      const sheet = await openCreateSheet(page)
      await sheet.getByRole('textbox').first().fill(name)
      await sheet.getByRole('button', { name: /^Create$/ }).click()
      await expect(sheet).toBeHidden({ timeout: 20_000 })
    }

    await page.getByPlaceholder(/^Search$/).fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('personnel search narrows to the matching UI-created person (fullNameContainsFold)', async ({ page }) => {
    test.slow()
    const a = uniqueName('E2E Person')
    const b = uniqueName('E2E Person')

    await page.goto('/registry/personnel', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Personnel$/ })).toBeVisible({ timeout: 20_000 })
    for (const name of [a, b]) {
      const sheet = await openCreateSheet(page)
      await sheet.getByRole('textbox').first().fill(name)
      await sheet.getByRole('textbox', { name: 'Email', exact: true }).fill(`e2e-person-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.com`)
      await sheet.getByRole('button', { name: /^Create$/ }).click()
      await expect(sheet).toBeHidden({ timeout: 20_000 })
    }

    await page.getByPlaceholder(/^Search$/).fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })
})

test.describe('registry — assets filter by type', () => {
  // assets/table/table-config.tsx exposes an "Asset Type" multiselect filter
  // backed by the static AssetAssetType enum (DEVICE/DOMAIN/REPOSITORY/…).
  // Seed a DEVICE-typed asset, then apply the DEVICE filter and assert it
  // survives while a default (untyped) asset drops out.
  test('applying the Asset Type=Device filter keeps the device asset and drops the untyped one', async ({ page }) => {
    test.slow()
    const deviceName = uniqueName('E2E Device Asset')
    const untypedName = uniqueName('E2E Plain Asset')
    await createAssetTyped(ownerApi, deviceName, 'DEVICE')
    await createAsset(ownerApi, untypedName)

    await page.goto('/registry/assets', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Assets$/ })).toBeVisible({ timeout: 20_000 })

    // Confirm both are present before filtering (search-free; small org).
    await page.getByPlaceholder(/^Search$/).fill('E2E')

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    // table-filter.tsx: open the "Asset Type" accordion, then click the
    // "Device" option (a <li> with onClick in the multiselect list), then
    // "View Results". Click the listitem (which carries the handler) and
    // scope to the open filter dropdown to avoid the closed-accordion copies.
    const panel = page.getByRole('menu').last()
    await panel.getByText('Asset Type', { exact: true }).click()
    const deviceOption = panel
      .getByRole('listitem')
      .filter({ hasText: /^Device$/ })
      .first()
    await expect(deviceOption).toBeVisible({ timeout: 10_000 })
    await deviceOption.click()
    await page.getByRole('button', { name: /^View Results$/ }).click()

    await expect(page.getByRole('cell').filter({ hasText: deviceName }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: untypedName })).toHaveCount(0, { timeout: 15_000 })
  })
})

test.describe('registry — vendor bulk delete', () => {
  test('bulk deleting a seeded vendor removes it from the list', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Vendor')
    await createVendor(ownerApi, name)

    await page.goto('/registry/vendors', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vendors$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    // Header select-all is disabled → use the per-row checkbox; selecting
    // reveals the "Bulk Delete (n)" toolbar button (table-toolbar.tsx).
    await row.getByRole('checkbox').click()
    await page.getByRole('button', { name: /^Bulk Delete/ }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByRole('cell').filter({ hasText: name })).toHaveCount(0, { timeout: 20_000 })
  })
})

test.describe('registry — system-detail view + delete', () => {
  const createSystemDetailViaUI = async (page: Page, name: string) => {
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(name)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet).toBeHidden({ timeout: 20_000 })
  }

  test('opening a UI-created system detail via ?id= shows the detail sheet with edit + copy-link', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E System')
    await createSystemDetailViaUI(page, name)

    // system-details/table/table.tsx onRowClick → replace({ id }); the
    // GenericDetailsSheet opens from the resulting ?id= param.
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.click()

    await expect(page.getByRole('button', { name: /^Copy link$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('deleting a UI-created system detail from the detail sheet confirms and removes it', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E System')
    await createSystemDetailViaUI(page, name)

    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.click()

    await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 20_000 })
    await page
      .getByRole('button', { name: /^Delete$/ })
      .first()
      .click()

    // delete-dialog.tsx: entityType "SystemDetail" → toHumanLabel → "System
    // Detail"; dialog title "Delete System Detail", toast "System Detail
    // deleted successfully.".
    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText('Delete System Detail')).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText(/system detail deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('registry — personnel view + delete + bulk', () => {
  const createPersonnelViaUI = async (page: Page, name: string) => {
    await page.goto('/registry/personnel', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Personnel$/ })).toBeVisible({ timeout: 20_000 })

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('textbox').first().fill(name)
    await sheet.getByRole('textbox', { name: 'Email', exact: true }).fill(`e2e-person-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}@example.com`)
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet).toBeHidden({ timeout: 20_000 })
  }

  test('clicking a personnel row navigates to the full-page detail', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Person')
    await createPersonnelViaUI(page, name)

    // personnel/table/table.tsx onRowClick → push(/registry/personnel/[id]).
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.click()

    await page.waitForURL(/\/registry\/personnel\/[^/]+$/, { timeout: 30_000 })
    // personnel-detail-header.tsx renders the page-level "Edit personnel" button.
    await expect(page.getByRole('button', { name: 'Edit personnel' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })

  test('deleting personnel from the detail page menu confirms and shows the success toast', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Person')
    await createPersonnelViaUI(page, name)

    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.click()
    await page.waitForURL(/\/registry\/personnel\/[^/]+$/, { timeout: 30_000 })

    // personnel-detail-header.tsx: the "..." (MoreHorizontal) menu holds the
    // destructive "Delete" item → ConfirmationDialog "Delete Personnel".
    await expect(page.getByRole('button', { name: 'Edit personnel' })).toBeVisible({ timeout: 20_000 })
    await page.locator('button:has(svg.lucide-ellipsis), button:has(svg.lucide-more-horizontal)').last().click()
    await page.getByRole('button', { name: /^Delete$/ }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText('Delete Personnel')).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText(/personnel deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('bulk deleting a UI-created personnel removes it from the list', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Person')
    await createPersonnelViaUI(page, name)

    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name }).first()
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByRole('checkbox').click()
    await page.getByRole('button', { name: /^Bulk Delete/ }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await confirm.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByRole('cell').filter({ hasText: name })).toHaveCount(0, { timeout: 20_000 })
  })
})

/**
 * ISS-2459 — contacts can now be linked to vendors from both sides:
 *
 *  - the contact detail sheet gains a "Linked Vendors" card (linked-vendors.tsx)
 *    with a vendor search popover; it renders only outside create mode
 *  - the contact CREATE form instead shows VendorSuggestion, which proposes
 *    vendors matching the contact email's domain (getEmailDomain, unit-tested in
 *    utils/strings.test.ts)
 *  - the vendor detail Contacts tab gains suggested contacts by the same rule
 *
 * Read-only: the popover is opened but no link is committed.
 */
test.describe('registry — contact linked vendors (ISS-2459)', () => {
  test('the contact detail sheet shows the Linked Vendors card', async ({ page }) => {
    test.slow()
    const fullName = `E2E LinkVend ${RUN_ID} ${Date.now().toString(36)}`
    const id = await createContact(ownerApi, fullName)

    await page.goto(`/registry/contacts?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByText('Linked Vendors', { exact: true })).toBeVisible({ timeout: 20_000 })

    // A freshly seeded contact has none.
    await expect(sheet.getByText('No vendors linked', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('the Linked Vendors card opens a vendor search popover', async ({ page }) => {
    test.slow()
    const fullName = `E2E LinkVend2 ${RUN_ID} ${Date.now().toString(36)}`
    const id = await createContact(ownerApi, fullName)
    await createVendor(ownerApi, `E2E LinkVendCo ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto(`/registry/contacts?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Linked Vendors', { exact: true })).toBeVisible({ timeout: 30_000 })

    // The card's "Link Vendor" trigger opens a Command popover. Nothing is
    // selected, so no link is created.
    await sheet.getByRole('button', { name: /^Link Vendor$/ }).click()

    await expect(page.getByPlaceholder('Search vendors...')).toBeVisible({ timeout: 15_000 })
  })
})

/**
 * #2014 — system details gained many-to-many edges to platforms and programs.
 * The list picked up chip columns for both and matching multiselect filters
 * (the edge→chip flattening helpers are unit-tested in
 * object-association/__tests__).
 */
test.describe('registry — system detail platform/program edges (#2014)', () => {
  test('the system details filter menu exposes Platforms and Programs', async ({ page }) => {
    test.slow()
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText(/^Platforms?$/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the system details Columns menu offers the new edge columns', async ({ page }) => {
    test.slow()
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText(/^Platforms?$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

/**
 * ISS-2528 — system details bulk edit gained Platforms/Programs association
 * fields (splitting the schema into a value part and an association part, and
 * switching the option sources to the *IDs variants), plus date-field sizing.
 *
 * Dialog-OPEN only: rows are selected to surface Bulk Edit but nothing is saved.
 */
test.describe('registry — system details bulk edit associations (ISS-2528)', () => {
  let seededSystemDetailName: string

  test.beforeAll(async () => {
    seededSystemDetailName = uniqueName('E2E SysDetail bulk')
    await createSystemDetail(await getOwnerApi(), seededSystemDetailName)
  })

  test('the bulk edit dialog offers Platforms and Programs alongside the value fields', async ({ page }) => {
    test.slow()
    await page.goto('/registry/system-details', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^System Details$/ })).toBeVisible({ timeout: 30_000 })

    // Seed the row this test operates on rather than skipping when the shared
    // org happens to have none, then search for it so pagination can't bury it.
    await page.getByPlaceholder(/^Search$/).fill(seededSystemDetailName)
    const row = page.getByRole('row').filter({ hasText: seededSystemDetailName })
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Edit/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    // GenericBulkEditDialog does not list the editable fields in the dialog
    // body — it renders a "Select field..." picker whose SelectContent holds
    // them, so the association fields only exist once that select is opened.
    await dialog.getByRole('combobox').first().click()

    const options = page.getByRole('option')
    await expect(options.filter({ hasText: /^Platforms$/ })).toBeVisible({ timeout: 15_000 })
    await expect(options.filter({ hasText: /^Programs$/ })).toBeVisible()
  })
})

/**
 * ISS-2573 — the vendor Risk Review tab warns when a HIGH-risk vendor has no
 * recent review. "Recent" is derived from the vendor's review frequency
 * (useHasRecentReview maps MONTHLY→1 … TRIENNIALLY→36 months, defaulting to
 * YEARLY, with NONE meaning no cutoff at all), checking both the vendor's own
 * lastReviewedAt and any review record inside that window.
 *
 * A seeded vendor carries no risk rating, so the warning branch is unreachable;
 * this pins the negative — the banner must not appear by default — which is what
 * an inverted isHighRisk or a broken recency check would break.
 */
test.describe('registry — vendor high-risk review warning (ISS-2573)', () => {
  test('a plain seeded vendor shows the Risk summary without the high-risk banner', async ({ page }) => {
    test.slow()
    const name = `E2E RiskWarn ${RUN_ID} ${Date.now().toString(36)}`
    const vendorId = await createVendor(ownerApi, name)

    await page.goto(`/registry/vendors/${vendorId}?tab=risk-review`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Risk Review' })).toBeVisible({ timeout: 45_000 })
    await page.getByRole('tab', { name: 'Risk Review' }).click()

    await expect(page.getByRole('heading', { name: /^Risk summary$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('High risk vendor - immediate action required')).toHaveCount(0)
  })
})

test.describe('vendors — contacts and risk review forms', () => {
  test('a contact is added to a vendor from the Contacts tab', async ({ page }) => {
    test.slow()
    const vendorId = await createVendor(ownerApi, uniqueName('E2E Vendor contacts'))

    try {
      const contactName = uniqueName('E2E Vendor contact')

      await page.goto(`/registry/vendors/${vendorId}?tab=contacts`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await page
        .getByRole('button', { name: /^Add Contact$/ })
        .first()
        .click()

      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Add Contact')).toBeVisible({ timeout: 30_000 })
      await dialog.getByRole('textbox').first().fill(contactName)

      await expectMutationOk(page, 'CreateContact', async () => {
        await dialog
          .getByRole('button', { name: /^(Add|Save|Create)/ })
          .last()
          .click()
      })
      await expect(page.getByText(contactName).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await gql(ownerApi, `mutation($id: ID!){ deleteEntity(id: $id){ deletedID } }`, { id: vendorId })
    }
  })

  test('a vendor risk review is submitted from the Risk Review tab', async ({ page }) => {
    test.slow()
    const vendorId = await createVendor(ownerApi, uniqueName('E2E Vendor review'))

    try {
      await page.goto(`/registry/vendors/${vendorId}?tab=risk-review`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      const trigger = page.getByRole('button', { name: /Review|Assess/ }).first()
      await expect(trigger).toBeVisible({ timeout: 30_000 })
      await trigger.click()

      const sheet = page.getByRole('dialog')
      await expect(sheet).toBeVisible({ timeout: 30_000 })

      await expectMutationOk(page, 'UpdateEntity', async () => {
        await sheet.getByRole('button', { name: /^Save/ }).first().click()
      })
    } finally {
      await gql(ownerApi, `mutation($id: ID!){ deleteEntity(id: $id){ deletedID } }`, { id: vendorId })
    }
  })
})
