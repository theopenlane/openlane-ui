import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createProcedure, type ApiSession } from '../utils/api'

/**
 * Deep procedures flows beyond procedures.spec.ts (create/search/inline edit/
 * link-to-policy on fresh users). Procedures are a near-clone of policies, so
 * these mirror policies-crud.spec.ts. Runs as the storage-state Owner; entities
 * seeded via the Owner API with run-unique names.
 *
 * ⏳ Written without running (servers were off). Verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueProcedureName = () => `E2E ProcCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('procedures — table tooling', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu').getByText(/^Status$/)).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/procedures', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Procedures$/ })).toBeVisible({ timeout: 20_000 })

    // Shared TableFilter (useProceduresFilters) — mirrors policies-crud.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('procedures — detail (seeded)', () => {
  test('delete a procedure from the detail actions menu redirects to the list', async ({ page }) => {
    const name = uniqueProcedureName()
    const id = await createProcedure(ownerApi, name)

    await page.goto(`/procedures/${id}/view`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })

    await page.getByTestId('procedure-actions-menu').click()
    await page.getByTestId('procedure-delete-button').click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.waitForURL(/\/procedures(\?|$)/, { timeout: 20_000 })
  })
})
