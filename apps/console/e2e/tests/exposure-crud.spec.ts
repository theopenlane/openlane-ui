import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createRisk, type ApiSession } from '../utils/api'

/**
 * Deep exposure/risk flows beyond exposure.spec.ts (create/search/validation on
 * fresh users). Runs as the storage-state Owner; risks seeded via the Owner API.
 *
 * ⏳ Written without running (servers were off). Verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueRiskName = () => `E2E RiskCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('exposure — risks', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Risks$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('a seeded risk detail page renders its name as the heading', async ({ page }) => {
    const name = uniqueRiskName()
    const id = await createRisk(ownerApi, name)

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 20_000 })
  })

  test('search filters risks to the matching seeded risk', async ({ page }) => {
    const a = uniqueRiskName()
    const b = uniqueRiskName()
    await createRisk(ownerApi, a)
    await createRisk(ownerApi, b)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })
})
