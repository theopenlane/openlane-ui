import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createRisk, type ApiSession } from '../utils/api'

/**
 * Deep exposure/risk flows beyond exposure.spec.ts (create/search/validation on
 * fresh users). Runs as the storage-state Owner; risks seeded via the Owner API.
 * Detail-tab / edit / delete mirror the controls-crud pattern (URL-controlled
 * Radix tabs; owner edit-mode toggle; actions-menu delete).
 *
 * ⏳ Detail tab/edit/delete written without running (added risk-actions-menu +
 * risk-delete-button testids in risk-detail-header.tsx). Verify on next run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueRiskName = () => `E2E RiskCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('exposure — create risk validation', () => {
  test('submitting an empty title keeps the form on the create page', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/risks/create', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // create-risk-form.tsx submit is "Create risk"; an empty (required) title
    // fails validation, so the form stays mounted instead of redirecting to a
    // /exposure/risks/{id} detail.
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

    // risks-table-toolbar.tsx → shared TableFilter; getRisksFilterFields has a
    // "Status" field (statusIn).
    await page.getByRole('button', { name: /^Filter$/ }).click()
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

    // risks-table-toolbar.tsx shows "Bulk Delete (n)" once a row is selected.
    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('exposure — risk detail (seeded)', () => {
  test('detail tabs render and switching tabs updates the active selection', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    // risk-detail-tabs.tsx: Radix tabs, URL-controlled via ?tab=… (overview is
    // the default and clears the param). Wait for the URL commit before
    // asserting the controlled aria-selected flips.
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
    // risk-detail-header.tsx swaps to CancelButton ("Cancel") + SaveButton
    // ("Save Changes") in edit mode.
    await expect(page.getByRole('button', { name: /^Cancel$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Save Changes$/ })).toBeVisible()
  })

  test('the Mitigation tab surfaces the Action Plans section', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    // The "Create Action Plan" quick action routes to ?tab=mitigation&create=true;
    // the Mitigation tab (mitigation-tab.tsx) renders an "Action Plans" section
    // with the ActionPlansTable. We assert the section renders directly.
    await page.goto(`/exposure/risks/${id}?tab=mitigation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Mitigation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })
    await expect(page.getByRole('heading', { name: 'Action Plans' })).toBeVisible({ timeout: 15_000 })
  })

  // NOTE: action-plan create — ?tab=mitigation&create=true should open the
  // GenericDetailsSheet (action-plans-table.tsx isCreate), but the risk-detail +
  // action-plan-sheet combination didn't render reliably in this pass. The
  // Mitigation-tab → Action Plans section render is covered above. ⏳

  test('delete a risk via the actions menu redirects to the risks list', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    await page.getByTestId('risk-actions-menu').click()
    await page.getByTestId('risk-delete-button').click()
    // ConfirmationDialog "Delete Risk" (no typed input) → confirm Delete.
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    await page.waitForURL(/\/exposure\/risks(\?|$)/, { timeout: 20_000 })
  })
})

// Filter panels across the exposure sub-pages (shared TableFilter; each
// getXFilterFields exposes a distinct first field).
// findings + vulnerabilities render an empty-state without the Filter toolbar
// (scanner-fed, no seedable data), so only the pages that expose it are covered.
const EXPOSURE_FILTER_PAGES = [
  { path: '/exposure/remediations', heading: /^Remediations$/, field: 'Title' },
  { path: '/exposure/reviews', heading: /^Reviews$/, field: 'State' },
]

test.describe('exposure — sub-page filters', () => {
  for (const { path, heading, field } of EXPOSURE_FILTER_PAGES) {
    test(`${path} filter panel exposes a "${field}" field`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })

      await page.getByRole('button', { name: /^Filter$/ }).click()
      await expect(page.getByText(field, { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    })
  }
})

// vulnerabilities + scans are scanner-fed (no API seeder in utils/api.ts), so
// these cover the data-independent toolbar/render surface that GenericTablePage
// always mounts: the Columns DropdownMenu, the Filter DropdownMenu (each page's
// getFilterFields exposes a distinct first field), and the slideout create sheet
// (Create button → ?create=true → GenericDetailsSheet role=dialog). No seeded
// data required, so these stay reliable.
test.describe('exposure — scanner sub-pages (toolbar + create)', () => {
  test('/exposure/vulnerabilities Columns menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    // columns.tsx → header 'Display Name' (a visible-by-default column).
    await expect(menu.getByText('Display Name', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/vulnerabilities filter menu exposes a "Security Level" field', async ({ page }) => {
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    // table-config.tsx getFilterFields → first field label is 'Security Level'.
    // The Filter button's accessible name includes an active-filter count badge
    // ("Filter 1") because DEFAULT_FILTER_VALUES = { open: true }, so match on prefix.
    await page.getByRole('button', { name: /^Filter/ }).click()
    await expect(page.getByText('Security Level', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/vulnerabilities Create opens the create sheet', async ({ page }) => {
    await page.goto('/exposure/vulnerabilities', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Vulnerabilities$/ })).toBeVisible({ timeout: 20_000 })

    // GenericTableToolbar Create → replace({ create: 'true' }) → GenericDetailsSheet
    // mounts a Radix Sheet (role=dialog); header.tsx renders "Create Vulnerability".
    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    // header.tsx renders the title twice (sr-only SheetTitle + visible div), so .first().
    await expect(sheet.getByText(/^Create Vulnerability$/).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/scans Columns menu lists toggleable columns', async ({ page }) => {
    await page.goto('/exposure/scans', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Scans$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    // columns.tsx → header 'Target' (the primary visible column).
    await expect(menu.getByText('Target', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/scans filter menu exposes a "Scan Type" field', async ({ page }) => {
    await page.goto('/exposure/scans', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Scans$/ })).toBeVisible({ timeout: 20_000 })

    // table-config.tsx getFilterFields → 'Scan Type' is a scans-specific field.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText('Scan Type', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })
})

// remediations + reviews are GenericTablePage routes (remediations/table/page.tsx,
// reviews/table/page.tsx). Their toolbars (Columns DropdownMenu, Filter
// DropdownMenu, Create button) and the slideout create sheet mount
// data-independently, so these stay reliable without a seeder. Existing
// "exposure — sub-page filters" covers the Filter field; this block adds the
// list heading render, the Columns menu, and the create-sheet open for each,
// plus a full create happy-path for a vulnerability (externalID is the only
// required field; success closes the sheet).
test.describe('exposure — remediations & reviews (toolbar + create)', () => {
  test('/exposure/remediations renders heading and Columns menu lists columns', async ({ page }) => {
    await page.goto('/exposure/remediations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Remediations$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    // remediations/table/columns.tsx → 'Title' is a visible-by-default column.
    await expect(menu.getByText('Title', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/remediations Create opens the "Create Remediation" sheet', async ({ page }) => {
    await page.goto('/exposure/remediations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Remediations$/ })).toBeVisible({ timeout: 20_000 })

    // GenericTableToolbar Create → ?create=true → GenericDetailsSheet (role=dialog);
    // objectType = ObjectTypes.REMEDIATION ('Remediation'), so header.tsx renders
    // "Create Remediation" (twice: sr-only SheetTitle + visible div) → .first().
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
    // reviews/table/columns.tsx → 'Category' is a visible-by-default column.
    await expect(menu.getByText('Category', { exact: true })).toBeVisible({ timeout: 10_000 })
  })

  test('/exposure/reviews Create opens the "Create Review" sheet', async ({ page }) => {
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    // objectType = ObjectTypes.REVIEW ('Review') → header renders "Create Review".
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

    // use-form-schema.ts: externalID (z.string().min(1)) is the only required
    // field; everything else is optional. displayName is the unlabeled primary
    // textbox (name-field.tsx label=""). The External ID input is a labeled
    // TextField in the "External Reference" card — FormLabel wires htmlFor to the
    // input id (form.tsx), so getByLabel resolves it.
    const externalId = `E2E-VULN-${RUN_ID}-${Date.now().toString(36)}`
    await sheet.getByRole('textbox').first().fill(`E2E Vulnerability ${externalId}`)
    await sheet.getByLabel(/^External ID$/).fill(externalId)

    // SaveButton in create mode renders title="Create" (generic-sheet header).
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    // GenericDetailsSheet toast is objectType-derived ("Vulnerability Created"),
    // but the reliable success signal is the Radix Sheet unmounting.
    await expect(sheet).toBeHidden({ timeout: 30_000 })
  })
})

// /exposure/overview — quick-actions navigation, the SLA menu/sheet, the
// critical-counts panel, and the items-requiring-attention table. Everything
// here mounts data-independently (empty-state friendly), so no seeder needed.
test.describe('exposure — overview', () => {
  test('Audit Reviews quick action navigates to /exposure/reviews', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    // exposure-quick-actions.tsx renders cards; "Audit Reviews" routes to reviews.
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

    // items-requiring-attention.tsx always renders the titled card (table or
    // empty-state inside).
    await expect(page.getByText('Items Requiring Attention', { exact: true })).toBeVisible({ timeout: 20_000 })
  })

  test('the Settings menu opens the SLA definitions sheet', async ({ page }) => {
    await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 20_000 })

    // PageHeading actions render a Menu whose trigger is the Settings icon
    // button — the first (and only) button in the page <main> heading row.
    // Clicking it reveals a "Configure SLA"/"View SLA" item that opens
    // ConfigureSlaSheet (role=dialog).
    await page.getByRole('main').getByRole('button').first().click()
    await page.getByText(/^(Configure SLA|View SLA)$/).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    // configure-sla-sheet.tsx overrideHeader: "Configure SLA Definitions" /
    // "View SLA Definitions".
    await expect(sheet.getByText(/SLA Definitions$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

// Risk detail inline edits + quick actions, on a seeded risk owned by the
// storage-state Owner. Mirrors the controls-crud inline-status pattern: status/
// kind/category render as clickable Badges (renderInlineBadge) that swap into a
// RiskLabel Select; the title is an inline Input via HoverPencilWrapper.
test.describe('exposure — risk detail inline edits (seeded)', () => {
  test('inline-editing the title persists the new name', async ({ page }) => {
    test.slow()
    const original = uniqueRiskName()
    const id = await createRisk(ownerApi, original)

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const heading = page.getByRole('heading', { level: 1, name: original })
    await expect(heading).toBeVisible({ timeout: 45_000 })
    // Gate on the "Edit risk" button to confirm the page has hydrated before
    // clicking the heading (otherwise the inline-edit onClick may not be wired
    // yet and the click is a no-op).
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    // risk-detail-header.tsx: clicking the h1 swaps it for an autofocused Input
    // pre-filled with the current name; typing + Enter (blur) calls
    // handleUpdateField({ name }). Retry the click until the rename Input
    // (autofocused, pre-filled with the seeded name) materializes.
    const renamed = uniqueRiskName()
    const editInput = page.locator('input:focus')
    await expect(async () => {
      await heading.click()
      await expect(editInput).toHaveValue(original, { timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
    await editInput.fill(renamed)
    await editInput.press('Enter')

    // Success toast "Risk updated" fires; the heading re-renders with the new
    // name. Reload to confirm the write landed server-side.
    await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible({ timeout: 15_000 })
    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1, name: renamed })).toBeVisible({ timeout: 45_000 })
  })

  test('inline status select updates the status to Mitigated', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    // risk-detail-page.tsx renders a "Status" label (a <p>) above a clickable
    // Badge holding the RiskLabel. Out of edit mode the badge shows the status
    // text; clicking it sets inlineEditField='status' so RiskLabel swaps to a
    // Radix Select. The badge is the <p>'s next sibling in <main>.
    const statusLabel = page
      .getByRole('main')
      .locator('p', { hasText: /^Status$/ })
      .first()
    await expect(statusLabel).toBeVisible({ timeout: 20_000 })
    const statusBadge = statusLabel.locator('xpath=following-sibling::*[1]')
    await statusBadge.click()

    // The badge click flips RiskLabel into a Radix Select trigger (combobox) in
    // <main>; clicking that trigger opens the options listbox.
    const statusCombo = page.getByRole('main').getByRole('combobox').first()
    await expect(statusCombo).toBeVisible({ timeout: 10_000 })
    await statusCombo.click()

    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await listbox.getByRole('option', { name: 'Mitigated' }).click()

    // onChange → handleUpdateField persists; the badge re-renders showing the
    // new status. Toasts duplicate, so assert the badge text in <main> instead.
    await expect(page.getByRole('main').getByText('Mitigated', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the quick-actions bar surfaces Create Task and Start Review', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: 'Edit risk' })).toBeVisible({ timeout: 45_000 })

    // quick-actions.tsx (RiskQuickActions) renders action buttons; for an owner
    // (canEdit) the full set is shown. "Create Task" + "Start Review" are stable
    // labels.
    await expect(page.getByRole('button', { name: 'Create Task' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Start Review' })).toBeVisible()
  })

  test('Start Review quick action opens the Create Review sheet', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const startReview = page.getByRole('button', { name: 'Start Review' })
    await expect(startReview).toBeVisible({ timeout: 45_000 })

    // onClick sets isCreateReviewOpen → CreateReviewSheet mounts a
    // GenericDetailsSheet (role=dialog) titled "Create Review".
    await startReview.click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Review$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

// Risk detail edit-mode properties sidebar — toggling Edit opens the
// SlideBarLayout sidebar (RiskPropertiesSidebar), which surfaces the
// Owners/Impact/Details field groups. Seeded risk, owner session.
test.describe('exposure — risk properties sidebar (seeded)', () => {
  test('edit mode reveals the Owners and Impact property groups', async ({ page }) => {
    test.slow()
    const id = await createRisk(ownerApi, uniqueRiskName())

    await page.goto(`/exposure/risks/${id}`, { waitUntil: 'domcontentloaded' })
    const editButton = page.getByRole('button', { name: 'Edit risk' })
    await expect(editButton).toBeVisible({ timeout: 45_000 })
    await editButton.click()

    // risk-properties-sidebar.tsx renders Cards titled "Owners", "Impact",
    // "Details" with Stakeholder/Delegate, Score/Likelihood, Status/Environment/
    // Scope/Tags fields. The sidebar slides open in edit mode.
    await expect(page.getByRole('heading', { name: /^Owners$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Stakeholder', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Likelihood', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Environment', { exact: true }).first()).toBeVisible()
  })
})

// Risks list bulk actions on seeded risks: selecting a row reveals Bulk Delete
// (covered above) and, for an owner, the Bulk Edit dialog. This block covers
// the bulk-edit dialog open + field picker, and the bulk-delete confirm flow.
test.describe('exposure — risks bulk actions (seeded)', () => {
  test('selecting a row enables Bulk Edit and the dialog exposes a field picker', async ({ page }) => {
    const name = uniqueRiskName()
    await createRisk(ownerApi, name)

    await page.goto('/exposure/risks', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder(/^Search$/).fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    // risks-table-toolbar.tsx renders the BulkEditRisksDialog trigger "Bulk
    // Edit (n)" for owners.
    const bulkEdit = page.getByRole('button', { name: /^Bulk Edit/ })
    await expect(bulkEdit).toBeVisible({ timeout: 10_000 })
    await bulkEdit.click()

    // bulk-edit-risks.tsx dialog: title "Bulk edit" + a "Select field..."
    // Select for the first field row.
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
    // Confirmation alertdialog → confirm Delete.
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/ })
      .click()

    // After deletion the searched row no longer matches.
    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name })).toHaveCount(0, { timeout: 15_000 })
  })
})

// /exposure/reviews · create review + view detail. Reviews is a GenericTablePage;
// the Create button opens the create sheet (title is the only required field).
// No createReview API seeder exists, so the detail-sheet read is exercised by
// first creating a review through the UI, then re-opening it from the list row.
test.describe('exposure — reviews create + detail', () => {
  test('creating a review with a Title closes the create sheet', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByText(/^Create Review$/).first()).toBeVisible({ timeout: 10_000 })

    // use-form-schema.ts: title (z.string().min(1)) is the only required field.
    // The Title TextField is the unlabeled primary textbox (name-field.tsx
    // label="").
    const title = `E2E Review ${RUN_ID} ${Date.now().toString(36)}`
    await sheet.getByRole('textbox').first().fill(title)

    // SaveButton in create mode renders title="Create".
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

    // Find the new row and click it → reviews/table/page.tsx sets ?id and the
    // ViewReviewSheet mounts (role=dialog) showing the review's Title.
    await page.getByPlaceholder(/^Search$/).fill(title)
    const row = page.getByRole('row').filter({ hasText: title })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('cell').filter({ hasText: title }).first().click()

    const detailSheet = page.getByRole('dialog')
    await expect(detailSheet).toBeVisible({ timeout: 15_000 })
    await expect(detailSheet.getByText(title).first()).toBeVisible({ timeout: 10_000 })
  })
})
