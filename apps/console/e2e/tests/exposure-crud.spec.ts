import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { createRisk, type ApiSession, getOwnerApi } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { expectMutationOk } from '../utils/mutations'

let ownerApi: ApiSession
const uniqueRiskName = () => uniqueName('E2E RiskCRUD')

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('exposure — create risk validation', () => {
  test('submitting an empty title keeps the form on the create page', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/risks/create', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const submit = page.getByRole('button', { name: /^Create risk$/ })
    await expect(submit).toBeVisible({ timeout: 30_000 })
    await submit.click()

    await expect(submit).toBeVisible({ timeout: 5_000 })
    await expect(page).toHaveURL(/\/exposure\/risks\/create/)
  })
})

test.describe('exposure — risks', () => {
  test('column visibility menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Risks$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('filter panel exposes a Status filter', async ({ page }) => {
    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Risks$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText(/^Status$/).first()).toBeVisible({ timeout: 10_000 })
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

  test('selecting a risk row reveals the Bulk Delete action', async ({ page }) => {
    const name = uniqueRiskName()
    await createRisk(ownerApi, name)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — risk detail (seeded)', () => {
  test('detail tabs render and switching tabs updates the active selection', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    const mitigation = page.getByRole('tab', { name: 'Mitigation' })
    const review = page.getByRole('tab', { name: 'Risk Review' })
    await expect(mitigation).toBeVisible({ timeout: 15_000 })

    await mitigation.click()
    await page.waitForURL(/[?&]tab=mitigation/, { timeout: 15_000 })
    await expect(mitigation).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })

    await review.click()
    await page.waitForURL(/[?&]tab=risk-review/, { timeout: 15_000 })
    await expect(review).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(mitigation).toHaveAttribute('aria-selected', 'false')
  })

  test('clicking Edit risk enters edit mode (Cancel + Save appear)', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const editButton = page.getByRole('button', { name: 'Edit risk' })
    await expect(editButton).toBeVisible({ timeout: 45_000 })

    await editButton.click()
    await expect(page.getByRole('button', { name: /^Cancel$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Save Changes$/ })).toBeVisible()
  })

  test('the Mitigation tab surfaces the Action Plans section', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}?tab=mitigation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Mitigation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: 'Action Plans' })).toBeVisible({ timeout: 15_000 })
  })

  test('delete a risk via the actions menu redirects to the risks list', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    await page.getByTestId('risk-actions-menu').click()
    await page.getByTestId('risk-delete-button').click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.waitForURL(/\/exposure\/risks(\?|$)/, { timeout: 20_000 })
  })
})

const EXPOSURE_FILTER_PAGES = [
  { path: '/exposure/remediations', heading: /^Remediations$/, field: 'Title' },
  { path: '/exposure/reviews', heading: /^Reviews$/, field: 'Status' },
]

test.describe('exposure — sub-page filters', () => {
  for (const { path, heading, field } of EXPOSURE_FILTER_PAGES) {
    test(`${path} filter panel exposes a "${field}" field`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })

      await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
      await expect(page.getByText(field, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    })
  }
})

test.describe('exposure — scanner sub-pages (toolbar + create)', () => {
  test('/exposure/vulnerabilities Columns menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Display Name', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/vulnerabilities filter menu exposes a "Security Level" field', async ({ page }) => {
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('Security Level', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/vulnerabilities Create opens the create sheet', async ({ page }) => {
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Vulnerability$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/scans Columns menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/scans', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Scans$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Target', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/scans filter menu exposes a "Scan Type" field', async ({ page }) => {
    await page.goto('/exposure/scans', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Scans$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('Scan Type', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — remediations & reviews (toolbar + create)', () => {
  test('/exposure/remediations renders heading and Columns menu lists columns', async ({ page }) => {
    await page.goto('/exposure/remediations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Remediations$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Title', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/remediations Create opens the "Create Remediation" sheet', async ({ page }) => {
    await page.goto('/exposure/remediations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Remediations$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Remediation$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/reviews renders heading and Columns menu lists columns', async ({ page }) => {
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Category', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/reviews Create opens the "Create Review" sheet', async ({ page }) => {
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Review$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('creating a vulnerability with an External ID closes the create sheet', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Vulnerability$/).first()).toBeVisible({ timeout: 10_000 })

    const externalId = `E2E-VULN-${RUN_ID}-${Date.now().toString(36)}`
    await sheet.getByRole('textbox').first().fill(`E2E Vulnerability ${externalId}`)
    await sheet.getByLabel(/^External ID$/).fill(externalId)

    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(sheet).toBeHidden({ timeout: 30_000 })
  })
})

test.describe('exposure — overview', () => {
  test('Audit Reviews quick action navigates to /exposure/reviews', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByText('Audit Reviews', { exact: true }).click()
    await page.waitForURL(/\/exposure\/reviews(\?|$)/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('View Findings quick action navigates to /exposure/findings', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByText('View Findings', { exact: true }).click()
    await page.waitForURL(/\/exposure\/findings(\?|$)/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Findings$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('View Vulnerabilities quick action navigates to /exposure/vulnerabilities', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByText('View Vulnerabilities', { exact: true }).click()
    await page.waitForURL(/\/exposure\/vulnerabilities(\?|$)/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('the items-requiring-attention panel renders', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Items Requiring Attention', { exact: true })).toBeVisible({ timeout: 20_000 })
  })

  test('the Settings menu opens the SLA definitions sheet', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('main').getByRole('button').first().click()
    await page.getByText(/^(Configure SLA|View SLA)$/).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/SLA Definitions$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — risk detail inline edits (seeded)', () => {
  test('inline-editing the title persists the new name', async ({ page }) => {
    test.slow()
    const original = uniqueRiskName()
    const id = await createRisk(ownerApi, original)

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { level: 1, name: original })
    await expect(heading).toBeVisible({ timeout: 45_000 })
    // Gate on the "Edit risk" button to confirm the page has hydrated before clicking the heading (otherwise the inline-edit onClick may not be wired yet and the click is a no-op)
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    const renamed = uniqueRiskName()
    const editInput = page.locator('input:focus')
    await expect(async () => {
      await heading.click()
      await expect(editInput).toHaveValue(original, { timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
    await editInput.fill(renamed)
    await editInput.press('Enter')

    await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible({ timeout: 15_000 })
    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible({ timeout: 45_000 })
  })

  test('inline status select updates the status to Mitigated', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    const statusLabel = page
      .getByRole('main')
      .locator('p', { hasText: /^Status$/ })
      .first()
    await expect(statusLabel).toBeVisible({ timeout: 20_000 })
    const statusBadge = statusLabel.locator('xpath=following-sibling::*[1]')
    await statusBadge.click()

    const statusCombo = page.getByRole('main').getByRole('combobox').first()
    await expect(statusCombo).toBeVisible({ timeout: 10_000 })
    await statusCombo.click()

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await listbox.getByRole('option', { name: 'Mitigated' }).click()

    await expect(page.getByRole('main').getByText('Mitigated', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the quick-actions bar surfaces Create Task and Start Review', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.setViewportSize({ width: 1700, height: 900 })
    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    await expect(page.getByRole('button', { name: 'Create Task' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Start Review' })).toBeVisible()
  })

  test('Start Review quick action opens the Create Review sheet', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const startReview = page.getByRole('button', { name: 'Start Review' })
    await expect(startReview).toBeVisible({ timeout: 45_000 })

    await startReview.click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Review$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — risk properties sidebar (seeded)', () => {
  test('edit mode reveals the Owners and Impact property groups', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const editButton = page.getByRole('button', { name: 'Edit risk' })
    await expect(editButton).toBeVisible({ timeout: 45_000 })
    await editButton.click()

    await expect(page.getByRole('heading', { name: /^Owners$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Stakeholder', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Likelihood', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Environment', { exact: true }).first()).toBeVisible()
  })
})

test.describe('exposure — risks bulk actions (seeded)', () => {
  test('selecting a row enables Bulk Edit and the dialog exposes a field picker', async ({ page }) => {
    const name = uniqueRiskName()
    await createRisk(ownerApi, name)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    const bulkEdit = page.getByRole('button', { name: /^Bulk Edit/ })
    await expect(bulkEdit).toBeVisible({ timeout: 10_000 })
    await bulkEdit.click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('Select field...', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('Bulk Delete confirmation removes the selected seeded risk', async ({ page }) => {
    test.slow()
    const name = uniqueRiskName()
    await createRisk(ownerApi, name)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name })).toHaveCount(0, { timeout: 15_000 })
  })
})

test.describe('exposure — reviews create + detail', () => {
  test('creating a review with a Title closes the create sheet', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Review$/).first()).toBeVisible({ timeout: 10_000 })

    const title = `E2E Review ${RUN_ID} ${Date.now().toString(36)}`
    await sheet.getByRole('textbox').first().fill(title)

    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(sheet).toBeHidden({ timeout: 30_000 })
  })

  test('clicking a created review row opens its detail sheet', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    const title = `E2E Review ${RUN_ID} ${Date.now().toString(36)}`
    await page.getByRole('button', { name: /^Create$/ }).click()
    const createSheet = page.getByRole('dialog')
    await expect(createSheet).toBeVisible({ timeout: 15_000 })
    await createSheet.getByRole('textbox').first().fill(title)
    await createSheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(createSheet).toBeHidden({ timeout: 30_000 })

    await page.getByPlaceholder(/^Search$/).fill(title)
    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('cell').filter({ hasText: title }).first().click()

    const detailSheet = page.getByRole('dialog')
    await expect(detailSheet).toBeVisible({ timeout: 15_000 })
    await expect(detailSheet.getByText(title).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — open-only severity chart (ISS-2395)', () => {
  test('the severity chart rows are labelled as Open-scoped', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Open Vulnerabilities', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Open Findings', { exact: true })).toBeVisible()
    await expect(page.getByText('Open Risks', { exact: true })).toBeVisible()
  })

  test('the critical-counts panel still exposes Critical and High drill-throughs', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Critical Exposure', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Critical', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('High', { exact: true }).first()).toBeVisible()
  })

  test('a Critical drill-through persists an open-scoped filter and lands on the table', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText('Critical Exposure', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.getByText('Critical', { exact: true }).first().click()
    await page.waitForURL(/\/exposure\/(vulnerabilities|findings|risks)(\?|$)/, { timeout: 20_000 })

    const stored = await page.evaluate(() => {
      const out: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const value = localStorage.getItem(key)
        if (value && (value.includes('securityLevelIn') || value.includes('impactIn'))) out.push(value)
      }
      return out
    })

    expect(stored.length).toBeGreaterThan(0)
    expect(stored.some((value) => value.includes('"open":true') || value.includes('OPEN'))).toBe(true)
  })
})

test.describe('exposure — review status enum (ISS-2396)', () => {
  test('the reviews Status filter is a multiselect over the enum values', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()

    const filterMenu = page.getByRole('menu')
    await expect(filterMenu).toBeVisible({ timeout: 15_000 })
    await filterMenu.getByText('Status', { exact: true }).click()

    await expect(page.getByText(/^Open$/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/^In progress$/i).first()).toBeVisible()
  })

  test('the reviews Columns menu offers Status, not the removed State column', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })

    await expect(menu.getByText('Status', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('State', { exact: true })).toHaveCount(0)
  })
})

test.describe('exposure — vulnerability External ID filter (ISS-2465)', () => {
  test('the vulnerabilities filter menu exposes an External ID field', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('External ID', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('reviews — create submits', () => {
  test('a review created through the sheet is persisted', async ({ page }) => {
    test.slow()
    const title = uniqueName('E2E Review create')

    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page
      .getByRole('button', { name: /^Create$/ })
      .first()
      .click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('heading', { name: 'Create Review' })).toBeVisible({ timeout: 30_000 })
    await sheet.getByRole('textbox').first().fill(title)

    await expectMutationOk(page, 'CreateReview', async () => {
      await sheet.getByRole('button', { name: /^Create$/ }).click()
    })

    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(title)
    await expect(page.getByRole('row').filter({ hasText: title }).first()).toBeVisible({ timeout: 60_000 })
  })
})
