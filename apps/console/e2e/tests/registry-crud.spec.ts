import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createAsset, createContact, type ApiSession } from '../utils/api'

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
})
