import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createProgram, type ApiSession } from '../utils/api'

/**
 * Deep program flows beyond programs.spec.ts (wizard/template picker/create on
 * fresh users). Runs as the storage-state Owner; programs seeded via the Owner
 * API. Covers the framework-wizard stepper scaffold, the settings page
 * (members / import controls / danger zone), and the typed-confirm delete flow.
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
    // Detail page renders the "Overview" <h1> and the program name. (A sibling
    // page-heading also contains "Overview", so pin the exact <h1>.)
    await expect(page.getByRole('heading', { name: 'Overview', exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('programs — framework wizard', () => {
  test('framework-based wizard shows the stepper scaffold', async ({ page }) => {
    test.slow() // heavy wizard route → cold dev compile; no compile step in CI
    await page.goto('/programs/create/framework-based', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // framework-based-wizard.tsx defines the steps via @stepperize; StepHeader
    // renders dot indicators + a "Step X of Y" counter (some steps are hidden,
    // so Y varies). Step 0's content heading is "Select a Framework".
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(/^Step 1 of \d+$/)).toBeVisible()
    await expect(page.getByRole('button', { name: /^continue$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible()
  })

  test('the framework picker opens with searchable options', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/framework-based', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 20_000 })

    // standard-select.tsx → SearchableSingleSelect: clicking the "Select a
    // framework" trigger opens a Command list (Search input + framework options).
    await page.getByText('Select a framework', { exact: true }).click()
    await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('programs — settings + delete (seeded)', () => {
  test('settings page renders members, import controls, and the danger zone', async ({ page }) => {
    test.slow() // heavy settings route → cold dev compile
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Import Controls').first()).toBeVisible()
    await expect(page.getByText('Danger Zone')).toBeVisible()
    // Active (non-archived) program → Archive + Delete affordances.
    await expect(page.getByRole('button', { name: /^Archive$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Delete$/ })).toBeVisible()
  })

  test('deleting a program from the danger zone requires the typed DELETE confirm', async ({ page }) => {
    test.slow() // heavy settings route → cold dev compile
    const name = uniqueProgramName()
    const id = await createProgram(ownerApi, name)

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Delete$/ }).click()

    // ConfirmationDialog (showInput) gates confirm on typing DELETE; the
    // confirm button stays disabled until the text matches.
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const confirm = dialog.getByRole('button', { name: /^Delete$/ })
    await expect(confirm).toBeDisabled()

    await dialog.getByRole('textbox').fill('DELETE')
    await expect(confirm).toBeEnabled()
    await confirm.click()

    // Success toast, then the program is gone.
    await expect(page.getByText(/successfully deleted/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('archiving a program then unarchiving it round-trips the danger-zone state', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // Archive (no typed gate) → success toast → the zone now offers Unarchive.
    await page.getByRole('button', { name: /^Archive$/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Archive$/ })
      .click()
    await expect(page.getByText(/successfully archived/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Unarchive$/ })).toBeVisible({ timeout: 15_000 })

    // Restore — asserting the Archive affordance returns (robust to toast copy).
    await page.getByRole('button', { name: /^Unarchive$/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Unarchive$/ })
      .click()
    await expect(page.getByRole('button', { name: /^Archive$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('Assign opens the Assign User dialog on the settings page', async ({ page }) => {
    test.slow()
    const id = await createProgram(ownerApi, uniqueProgramName())

    await page.goto(`/programs/${id}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // program-settings-assign-user-dialog.tsx default trigger "Assign" → dialog
    // with an "Assign User" heading.
    await page
      .getByRole('button', { name: /^Assign$/ })
      .first()
      .click()
    await expect(page.getByRole('heading', { name: 'Assign User' })).toBeVisible({ timeout: 10_000 })
  })
})
