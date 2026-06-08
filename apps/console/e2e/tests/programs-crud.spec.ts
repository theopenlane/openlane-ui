import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createProgram, type ApiSession } from '../utils/api'

/**
 * Deep program flows beyond programs.spec.ts (wizard/template picker/create on
 * fresh users). Runs as the storage-state Owner; programs seeded via the Owner
 * API. Member assignment / framework control auto-population still to write
 * (need detail-tab selectors confirmed by a run).
 *
 * ⏳ Written without running (servers were off). Verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueProgramName = () => `E2E ProgCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('programs — detail (seeded)', () => {
  test('a seeded program detail page renders the program name', async ({ page }) => {
    const name = uniqueProgramName()
    const id = await createProgram(ownerApi, name)

    await page.goto(`/programs/${id}`, { waitUntil: 'domcontentloaded' })
    // Detail page renders the program name in the Basic Information block.
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 })
  })
})
