import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { uniqueRef } from '../utils/unique'
import { clickResilient } from '../utils/menu'
import {
  createControl,
  createSubcontrol,
  createInternalPolicy,
  createProcedure,
  createEvidence,
  createProgram,
  linkControlPolicy,
  linkControlProcedure,
  linkControlEvidence,
  type ApiSession,
  getOwnerApi,
} from '../utils/api'
import { confirmDestructive, expectMutationOk } from '../utils/mutations'

/**
 * Deep controls flows beyond controls.spec.ts (create/search/inline edit on
 * fresh users) and the edit/delete GATING in permissions.spec.ts: the actual
 * owner edit-mode toggle and delete action. Runs as the storage-state Owner;
 * controls seeded via the Owner API with run-unique refCodes.
 *
 * ⏳ Written without running (servers were off). Verify on first run.
 */

let ownerApi: ApiSession
const uniqueRefCode = () => uniqueRef('E2E-CTLCRUD')

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const editControlButton = (page: Page) => page.getByRole('button', { name: 'Edit control' })

test.describe('controls — owner edit + delete (seeded)', () => {
  test('selecting a control row reveals the Bulk Delete action', async ({ page }) => {
    const refCode = uniqueRefCode()
    await createControl(ownerApi, refCode)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    // /controls defaults to the dashboard tab; switch to the table view.
    await page.locator('.lucide-table').first().click()
    await page.getByPlaceholder(/^Search$/).fill(refCode)

    const row = page.getByRole('row').filter({ hasText: refCode })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    // controls-table-toolbar.tsx shows "Bulk Delete (n)" once a row is selected.
    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })

  test('clicking Edit control enters edit mode (Cancel + Save appear)', async ({ page }) => {
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 30_000 })

    await editControlButton(page).click()
    // control-header-actions.tsx swaps to Cancel + Save buttons in edit mode.
    await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible({ timeout: 10_000 })
  })

  test('delete a control via the actions menu redirects to the controls list', async ({ page }) => {
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('control-actions-menu').click()
    await clickResilient(page.getByTestId('control-delete-button'))
    // Confirmation dialog → confirm Delete.
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: /^Delete$/i })
      .click()

    await page.waitForURL(/\/controls(\?|$)/, { timeout: 20_000 })
  })

  test('inline status change on a control persists across reload', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 45_000 })

    const statusTrigger = page.getByTestId('control-status-trigger')
    // Scoped testid, not getByRole('combobox') — the detail page also renders
    // rows-per-page selects in the linked-controls tables (strict-mode clash).
    const statusSelect = page.getByTestId('control-status-select')
    await expect(async () => {
      await statusTrigger.dblclick()
      await expect(statusSelect).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
    await statusSelect.click()
    await page.getByRole('option', { name: /^Approved$/i }).click()

    await expect(statusTrigger).toContainText(/Approved/i, { timeout: 10_000 })

    await page.reload()
    await expect(page.getByTestId('control-status-trigger')).toContainText(/Approved/i, { timeout: 15_000 })
  })
})

test.describe('controls — linking (seeded)', () => {
  test('a policy linked to a control shows in the Documentation tab + Add-Policy dialog opens', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const policyName = `E2E LinkPol ${RUN_ID} ${Date.now().toString(36)}`
    const policyId = await createInternalPolicy(ownerApi, policyName)
    // Link via API (addInternalPolicyIDs) so the Documentation tab has data —
    // the EmptyTabState otherwise hides the policies table + "Add Policy" button.
    await linkControlPolicy(ownerApi, controlId, policyId)

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    // Linked policy renders in the documentation policies-table.
    await expect(page.getByText(policyName).first()).toBeVisible({ timeout: 20_000 })

    // With data present, the "Add Policy" → "Associate Related Objects" dialog
    // (object-link entry point) is now reachable.
    await page.getByRole('button', { name: /^Add Policy$/ }).click()
    await expect(page.getByRole('dialog').getByText('Associate Related Objects')).toBeVisible({ timeout: 10_000 })
  })

  test('a procedure linked to a control shows in the Documentation tab', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const procedureName = `E2E LinkProc ${RUN_ID} ${Date.now().toString(36)}`
    const procedureId = await createProcedure(ownerApi, procedureName)
    await linkControlProcedure(ownerApi, controlId, procedureId)

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    // The documentation procedures-table renders the linked procedure.
    await expect(page.getByText(procedureName).first()).toBeVisible({ timeout: 20_000 })
  })

  test('an evidence record linked to a control shows in the Evidence tab', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const evidenceName = `E2E LinkEv ${RUN_ID} ${Date.now().toString(36)}`
    const evidenceId = await createEvidence(ownerApi, evidenceName)
    await linkControlEvidence(ownerApi, controlId, evidenceId)

    await page.goto(`/controls/${controlId}?tab=evidence`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Evidence' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    // The control evidence-table renders the linked evidence record.
    await expect(page.getByText(evidenceName).first()).toBeVisible({ timeout: 20_000 })
  })

  test('unlinking a policy from a control removes the association chip', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const policyId = await createInternalPolicy(ownerApi, `E2E Unlink ${RUN_ID} ${Date.now().toString(36)}`)
    await linkControlPolicy(ownerApi, controlId, policyId)

    await page.goto(`/controls/${controlId}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 45_000 })

    // The ObjectAssociationSwitch (sidebar) defaults to graph view. Toggle to
    // list (assoc-view-toggle), then expand the collapsed "Policies" accordion
    // section so the linked policy mounts as a removable chip.
    await page.getByTestId('assoc-view-toggle').click()
    const removeX = page.getByTestId('objects-chip-remove')
    if ((await removeX.count()) === 0) {
      await page.getByText('Policies', { exact: true }).click()
    }
    await expect(removeX).toHaveCount(1, { timeout: 15_000 })

    // The chip's X removes the association immediately (useAssociationRemoval,
    // no confirm) → the chip disappears.
    await removeX.first().click()
    await expect(page.getByTestId('objects-chip-remove')).toHaveCount(0, { timeout: 15_000 })
  })
})

test.describe('controls — detail tabs (seeded)', () => {
  test('tab triggers render and switching tabs updates the active selection', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 45_000 })

    // control-tabs-list.tsx renders a Radix TabsTrigger (role=tab) per tab. The
    // active tab is URL-controlled (tabs.tsx: onValueChange → router.replace),
    // except that the fallback tab clears the param instead of setting it.
    const linked = page.getByRole('tab', { name: 'Linked Controls' })
    const evidence = page.getByRole('tab', { name: 'Evidence' })
    await expect(linked).toBeVisible({ timeout: 15_000 })
    await expect(evidence).toBeVisible()

    await linked.click()
    await expect(linked).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    // tabs.tsx updateTabParam DELETES ?tab= for the fallback tab (implementation
    // is hidden on a bare custom control, so Linked Controls is the fallback).
    await expect.poll(() => new URL(page.url()).searchParams.get('tab'), { timeout: 15_000 }).toBeNull()

    await evidence.click()
    await page.waitForURL(/[?&]tab=evidence/, { timeout: 15_000 })
    await expect(evidence).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(linked).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('controls — map + subcontrol (seeded)', () => {
  test('map-control page renders the From and To mapping cards', async ({ page }) => {
    // Heavy route (Plate + control-select bundles) → cold dev-server compile can
    // exceed the default nav budget on first hit. No compile step in CI.
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    // The "Map Control" quick action links here; map-controls-card.tsx renders
    // a From and a To accordion card (each an <h3> heading).
    await page.goto(`/controls/${id}/map-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page).toHaveTitle(/Map Control/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'From', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'To', exact: true })).toBeVisible()
  })

  test('create-subcontrol page renders the form with a reference code field', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    // create-control-form.tsx in subcontrol mode shows the "Create Subcontrol"
    // heading, a Controller-bound refCode input, and a subcontrol-only
    // "Parent Control" combobox (placeholder "Search Control").
    await page.goto(`/controls/${id}/create-subcontrol`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Create Subcontrol', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.locator('input[name="refCode"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder('Search Control')).toBeVisible()
  })
})

test.describe('controls — detail sub-routes (seeded)', () => {
  test('clone-control prefills the ref code with a CC- prefix from the source', async ({ page }) => {
    test.slow()
    const refCode = uniqueRefCode()
    const id = await createControl(ownerApi, refCode)

    // create-control-form.tsx detects /clone-control and seeds refCode = `CC-${source}`.
    await page.goto(`/controls/${id}/clone-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.locator('input[name="refCode"]')).toHaveValue(`CC-${refCode}`, { timeout: 45_000 })
  })

  test('map-control exposes the Relation type selector', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    // map-controls-relations.tsx renders a "Relation type" control (Equal/Subset/Superset).
    await page.goto(`/controls/${id}/map-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Relation type', { exact: true }).first()).toBeVisible({ timeout: 45_000 })
  })
})

/**
 * ISS-2357 — the controls table only requests the expensive GraphQL fields for
 * columns that are actually visible. Column defs carry `meta.gqlInclude`
 * (table-config.tsx) and getIncludeVars folds them against the table's
 * VisibilityState into GetAllControls' `include*` variables.
 *
 * The fold itself is unit-tested in get-include-vars.test.ts; this asserts the
 * wiring survives all the way to the wire, which is the part a refactor breaks.
 */
test.describe('controls — dynamic column fetch (ISS-2357)', () => {
  // Capture the include* variables of every GetAllControls request the page makes.
  const watchIncludeVars = (page: Page): (() => Record<string, boolean> | undefined) => {
    let latest: Record<string, boolean> | undefined

    page.on('request', (request) => {
      if (request.method() !== 'POST') return
      const body = request.postData()
      if (!body || !body.includes('GetAllControls')) return
      try {
        const parsed = JSON.parse(body) as { variables?: Record<string, unknown> }
        const vars = parsed.variables ?? {}
        const includes = Object.fromEntries(Object.entries(vars).filter(([key]) => key.startsWith('include'))) as Record<string, boolean>
        if (Object.keys(includes).length) latest = includes
      } catch {
        // non-JSON payloads are not the query we're after
      }
    })

    return () => latest
  }

  const openControlsTable = async (page: Page) => {
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    // /controls defaults to the dashboard tab; switch to the table view.
    await page.locator('.lucide-table').first().click()
    await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 45_000 })
  }

  test('a visible column requests its include var', async ({ page }) => {
    test.slow()
    const includeVars = watchIncludeVars(page)
    await openControlsTable(page)

    await expect.poll(() => includeVars()?.includeDescription, { timeout: 45_000 }).toBe(true)
  })

  test('hiding a column stops its field being requested', async ({ page }) => {
    test.slow()
    const includeVars = watchIncludeVars(page)
    await openControlsTable(page)

    await expect.poll(() => includeVars()?.includeDescription, { timeout: 45_000 }).toBe(true)

    // Each row in the Columns menu is a checkbox BUTTON beside its label —
    // clicking the label text alone does not toggle it.
    await page.getByRole('button', { name: /^Columns$/ }).click()
    const descriptionRow = page
      .getByRole('menu')
      .locator('div.flex.items-center.gap-x-3')
      .filter({ hasText: /^Description$/ })
    await expect(descriptionRow).toBeVisible({ timeout: 15_000 })

    await descriptionRow.getByRole('checkbox').click()
    await expect.poll(() => includeVars()?.includeDescription, { timeout: 30_000 }).toBe(false)

    // Only the hide direction is observable on the wire: re-enabling the column
    // restores a variable set react-query has already cached, so it serves the
    // earlier result without issuing a new request. Asserting a fresh request
    // here would be asserting a cache miss, not the feature.
  })
})

/**
 * The control report (#1872) is the DEFAULT tab of /controls — control-switcher.tsx
 * renders ControlReportPage for the 'dashboard' tab and the table only after the
 * TabSwitcher flips. It had no coverage at all.
 *
 * report-toolbar.tsx exposes three dropdown filters ("Filter by:" framework,
 * "Program:", "Report on:") plus Expand/Select actions, and control-table-header.tsx
 * renders the column strip. Coverage derivation is unit-tested in
 * report-coverage.test.ts; these pin the toolbar and grid surface.
 */
test.describe('controls — report view (#1872)', () => {
  const openReport = async (page: Page) => {
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /^Controls$/ }).first()).toBeVisible({ timeout: 45_000 })
  }

  test('the report toolbar renders its three filter dropdowns', async ({ page }) => {
    test.slow()
    await openReport(page)

    // ReportToolbarFilterLabel renders "<label> <value>" inside each trigger.
    await expect(page.getByRole('button', { name: /^Filter by:/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible()
  })

  test('the "Report on:" menu lists the gap filters and a clear action', async ({ page }) => {
    test.slow()
    await openReport(page)

    await page.getByRole('button', { name: /^Report on:/ }).click()

    // The popover is a role=dialog. Its labels ("No owner", "No evidence") also
    // appear as ordinary cell text in the report grid, so scope to the popover.
    const reportMenu = page.getByRole('dialog').filter({ hasText: 'Show controls that:' })
    await expect(reportMenu).toBeVisible({ timeout: 15_000 })

    // REPORT_FILTER_OPTIONS labels (report-filter-options.ts). NO_ORG_CONTROLS /
    // NO_FRAMEWORK_CONTROLS are view-restricted, so only assert the unrestricted ones.
    await expect(reportMenu.getByText('My controls', { exact: true })).toBeVisible()
    await expect(reportMenu.getByText('Not approved', { exact: true })).toBeVisible()
    await expect(reportMenu.getByText('No owner', { exact: true })).toBeVisible()
    await expect(reportMenu.getByText('No evidence', { exact: true })).toBeVisible()
    await expect(reportMenu.getByText('No policies linked', { exact: true })).toBeVisible()
  })

  test('the framework filter offers the Organization Controls view', async ({ page }) => {
    test.slow()
    await openReport(page)

    await page.getByRole('button', { name: /^Filter by:/ }).click()

    // report-toolbar.tsx renders a CUSTOM radio item labelled "Organization Controls".
    await expect(page.getByText('Organization Controls', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('the report grid renders its column header strip', async ({ page }) => {
    test.slow()
    const refCode = uniqueRefCode()
    await createControl(ownerApi, refCode)

    await openReport(page)

    // control-table-header.tsx column labels. "Org coverage" is hidden in the
    // custom view, so assert the always-present ones.
    await expect(page.getByText('Ref Code', { exact: true }).first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText('Evidence', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Policies', { exact: true }).first()).toBeVisible()
  })

  test('the TabSwitcher flips between the report and the table view', async ({ page }) => {
    test.slow()
    await openReport(page)
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 30_000 })

    // Switching to the table replaces the report toolbar with the table toolbar.
    await page.locator('.lucide-table').first().click()
    await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toHaveCount(0)
  })
})

/**
 * ISS-2418 — the Linked Controls tab gained a Status multiselect filter, and the
 * "(N mapped)" count now excludes ARCHIVED org controls. The tables also apply a
 * default hide-archived filter that backs off once the user sets their own
 * status condition — that predicate is unit-tested in has-status-condition.test.ts.
 */
test.describe('controls — linked controls status filter (ISS-2418)', () => {
  test('the Linked Controls tab exposes a Status filter over the control statuses', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${controlId}?tab=linked-controls`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Linked Controls' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    await page
      .getByRole('button', { name: /^Filter( \d+)?$/ })
      .first()
      .click()
    const statusMenu = page.getByRole('menu')
    await expect(statusMenu).toBeVisible({ timeout: 15_000 })
    await statusMenu.getByText('Status', { exact: true }).click()
    // enumToOptions(ControlControlStatus) → getEnumLabel-style titles.
    await expect(page.getByText(/^Approved$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/^Archived$/).first()).toBeVisible()
  })

  test('the mapped-controls count renders alongside the section title', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${controlId}?tab=linked-controls`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Linked Controls' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    // mapped-controls-table.tsx renders countLabel as "(N mapped)"; the count is
    // now the ACTIVE (non-archived) org controls, so assert the shape not a value.
    await expect(page.getByText(/^\(\d+ mapped\)$/).first()).toBeVisible({ timeout: 30_000 })
  })
})

/**
 * ISS-2422 — the control report gained an optional Program filter. The dropdown
 * only renders when the org has at least one non-archived program
 * (report-toolbar.tsx guards on programOptions.length), and the selection is
 * persisted per-org via getOrganizationStorageItem under
 * 'control_report_selected_programs' so it survives a reload.
 */
test.describe('controls — report program filter (ISS-2422)', () => {
  test('the Program filter appears once the org has a program, and persists a selection', async ({ page }) => {
    test.slow()
    const programName = `E2E RptProg ${RUN_ID} ${Date.now().toString(36)}`
    await createProgram(ownerApi, programName)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    const programFilter = page.getByRole('button', { name: /^Program:/ })
    await expect(programFilter).toBeVisible({ timeout: 30_000 })

    // The popover lists one row per program as plain text (no role=checkbox).
    await programFilter.click()
    const programMenu = page.getByRole('dialog').filter({ hasText: programName })
    await expect(programMenu).toBeVisible({ timeout: 15_000 })
    await programMenu.getByText(programName, { exact: true }).first().click()

    // The selection is written to org-scoped localStorage.
    await expect
      .poll(
        async () =>
          page.evaluate(() => {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key?.includes('control_report_selected_programs')) return localStorage.getItem(key)
            }
            return null
          }),
        { timeout: 15_000 },
      )
      .toMatch(/\[".+"\]/)
  })
})

/**
 * ISS-2426 — the control report used to conflate "this org has no controls at
 * all" with "no control matches the current filters" and showed the create-first
 * empty state for both. control-report-page.tsx now tracks the two separately
 * (hasNoOrganizationControls via a totalCount:1 probe vs hasNoReportControls),
 * rendering ReportEmptyState only for the former and ReportNoFilterMatches for
 * the latter.
 *
 * The seeded org always has controls, so the reachable branch is the filter one.
 */
test.describe('controls — report empty states (ISS-2426)', () => {
  test('an org with controls never shows the create-first empty state', async ({ page }) => {
    test.slow()
    await createControl(ownerApi, uniqueRefCode())

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    // The bug this commit fixed was conflating "this org has no controls at all"
    // with "no control matches the filters" — both rendered ReportEmptyState's
    // create-first copy. hasNoOrganizationControls is now a separate totalCount
    // probe, so an org holding controls must never show it, filtered or not.
    await expect(page.getByText(/No controls found\./)).toHaveCount(0)

    // Applying a gap filter must not flip it either. (Stacking every filter
    // cannot empty the list: a freshly seeded control genuinely has no
    // approval, owner, evidence or linked policy, so it matches them all.)
    await page.getByRole('button', { name: /^Report on:/ }).click()
    const gapMenu = page.getByRole('dialog').filter({ hasText: 'Show controls that:' })
    await expect(gapMenu).toBeVisible({ timeout: 15_000 })
    await gapMenu.getByText('No owner', { exact: true }).click()
    await page.keyboard.press('Escape')

    await expect(page.getByText(/No controls found\./)).toHaveCount(0)
  })
})

test.describe('controls — draft status (#1983)', () => {
  test('the Linked Controls status filter offers Draft alongside the other statuses', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${controlId}?tab=linked-controls`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Linked Controls' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    await page
      .getByRole('button', { name: /^Filter( \d+)?$/ })
      .first()
      .click()
    const draftMenu = page.getByRole('menu')
    await expect(draftMenu).toBeVisible({ timeout: 15_000 })
    await draftMenu.getByText('Status', { exact: true }).click()

    await expect(page.getByText(/^Draft$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/^Approved$/).first()).toBeVisible()
  })
})

/**
 * ISS-2523 — the control report's bulk action bar gained "Assign to Program"
 * alongside the existing Assign Owner / status actions, with an optional cascade
 * to mapped controls.
 *
 * Entering selection mode is enough to surface the bar; nothing is applied, so
 * no control is reassigned on the shared org.
 */
test.describe('controls — report bulk assign to program (ISS-2523)', () => {
  test('selection mode surfaces the bulk bar with the Assign to Program action', async ({ page }) => {
    test.slow()
    await createControl(ownerApi, uniqueRefCode())
    await createProgram(ownerApi, `E2E BulkProg ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    // report-toolbar.tsx renders a "Select" toggle that turns on selection mode.
    const selectToggle = page.getByRole('button', { name: /^Select$/ })
    await expect(selectToggle).toBeVisible({ timeout: 30_000 })
    await selectToggle.click()

    // The bar only renders once at least one row is selected.
    const firstCheckbox = page.getByRole('checkbox').first()
    await expect(firstCheckbox).toBeVisible({ timeout: 20_000 })
    await firstCheckbox.click()

    await expect(page.getByRole('button', { name: /^Assign to Program$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Assign Owner$/ })).toBeVisible()
  })

  test('the Assign to Program popover lists programs without applying anything', async ({ page }) => {
    test.slow()
    await createControl(ownerApi, uniqueRefCode())
    await createProgram(ownerApi, `E2E BulkProg2 ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })
    await page.getByRole('button', { name: /^Select$/ }).click()

    const firstCheckbox = page.getByRole('checkbox').first()
    await expect(firstCheckbox).toBeVisible({ timeout: 20_000 })
    await firstCheckbox.click()

    await page.getByRole('button', { name: /^Assign to Program$/ }).click()

    // Popover opens with a program picker. No selection is confirmed.
    await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 15_000 })
  })
})

/**
 * #2041 — CSV upload dialogs used to be rendered INSIDE the toolbar's dropdown
 * menu, so opening the OS file picker dismissed the menu and took the dialog
 * with it. They are now lifted out and driven by state
 * (useControllableOpen + isCloneOpen/isCreateOpen), with the menu item merely
 * setting the flag.
 *
 * The native picker itself is out of reach for Playwright, but the structural
 * fix is assertable: the dialog opens from the menu and survives the menu
 * closing. Dialog-OPEN only — no file is uploaded.
 */
test.describe('controls — CSV dialogs lifted out of the menu (#2041)', () => {
  test('Upload Custom Controls opens a dialog that outlives the dropdown', async ({ page }) => {
    test.slow()
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    await page.getByRole('button', { name: 'Action' }).first().click()
    await page.getByText('Upload Custom Controls', { exact: true }).click()

    // bulk-csv-create-dialog.tsx: DialogTitle "Bulk Upload <plural>" + CSV Format callout.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText(/^Bulk Upload /)).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('CSV Format')).toBeVisible()

    // The menu that launched it is gone, but the dialog remains — the whole point.
    await expect(page.getByText('Upload Custom Controls', { exact: true })).toHaveCount(0)
    await expect(dialog).toBeVisible()
  })
})

/**
 * ISS-2551 — control reviews became viewable: the bespoke
 * controls/tabs/reviews/review-details-sheet.tsx was deleted in favour of the
 * shared review sheet, with a reusable comment list and severity chip.
 *
 * The Reviews tab renders for every control; a seeded control has none, so this
 * pins the tab and its empty surface. Creating a review is auditor-only and the
 * auditor sheet is deliberately never submitted (#35).
 */
test.describe('controls — reviews tab (ISS-2551)', () => {
  test('the Reviews tab is hidden for a control with no reviews', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${controlId}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Linked Controls' })).toBeVisible({ timeout: 45_000 })

    // tabs.tsx hides the reviews tab unless associationCount('reviews') > 0, so
    // a freshly seeded control must not offer it. Creating a review is
    // auditor-only through a sheet this suite never submits (#35).
    await expect(page.getByRole('tab', { name: 'Reviews' })).toHaveCount(0)
  })
})

/**
 * ISS-2687 — the control import dialogs must not offer Openlane's own system
 * standards (OTS and OL Baseline) as importable sources. The exclusion is
 * applied by merging EXCLUDE_SYSTEM_STANDARDS_WHERE into each query via
 * mergeWhere (both unit-tested: constants/standards.test.ts, lib/merge-where.test.ts).
 */
test.describe('controls — system standards excluded from import (ISS-2687)', () => {
  test('the Upload From Standard dialog does not offer the Openlane system standards', async ({ page }) => {
    test.slow()
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    await page.getByRole('button', { name: 'Action' }).first().click()
    await page.getByText('Upload From Standard', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    // Neither system standard may appear as an importable source.
    await expect(dialog.getByText('OL Baseline', { exact: true })).toHaveCount(0)
    await expect(dialog.getByText('OTS', { exact: true })).toHaveCount(0)
  })
})

/**
 * ISS-2752 — tables fired their list query twice on load: `filters` started as
 * `{}` (a valid where-clause) so the query ran immediately, then ran again once
 * the real filters and their async option sources resolved. Filters now start as
 * `null` and filterFields are only built once the option queries succeed, so the
 * query is skipped until its inputs are settled.
 *
 * Counting the requests is the only way to see this — the rendered result is
 * identical either way.
 */
test.describe('controls — no duplicate list query (ISS-2752)', () => {
  test('loading the controls table issues no duplicate GetAllControls request', async ({ page }) => {
    test.slow()
    const variableSets: string[] = []

    page.on('request', (request) => {
      if (request.method() !== 'POST') return
      const body = request.postData()
      if (!body?.includes('GetAllControls')) return
      try {
        const parsed = JSON.parse(body) as { variables?: Record<string, unknown> }
        variableSets.push(JSON.stringify(parsed.variables ?? {}))
      } catch {
        // non-JSON payloads are not the query we're after
      }
    })

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()
    await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 45_000 })

    // Let any second (buggy) request land before asserting.
    await page.waitForTimeout(3_000)

    // The report's totalCount probe (first: 1) and the table's list query are
    // DIFFERENT queries and both legitimate. What this commit fixed is the same
    // query firing twice — once against the initial `{}` filter and again once
    // the real filters resolved — so assert no variable set repeats.
    expect(new Set(variableSets).size).toBe(variableSets.length)
  })
})

test.describe('controls — bulk delete applies', () => {
  test('confirming Bulk Delete removes the selected control', async ({ page }) => {
    test.slow()
    const refCode = uniqueRefCode()
    await createControl(ownerApi, refCode)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()
    await page.getByPlaceholder(/^Search$/).fill(refCode)

    const row = page.getByRole('row').filter({ hasText: refCode })
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    await confirmDestructive(page, 'DeleteBulkControl')

    await expect(page.getByRole('row').filter({ hasText: refCode })).toHaveCount(0, { timeout: 60_000 })
  })
})

test.describe('controls — remaining form submits', () => {
  test('the subcontrol detail form saves an edited description', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const subcontrolId = await createSubcontrol(ownerApi, uniqueRefCode(), controlId)
    const description = `edited by e2e ${Date.now().toString(36)}`

    await page.goto(`/controls/${controlId}/${subcontrolId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: 'Edit control' }).click()

    const editor = page.locator('[contenteditable="true"]').first()
    await expect(editor).toBeVisible({ timeout: 30_000 })
    await editor.click()
    await editor.fill(description)

    await expectMutationOk(page, 'UpdateSubcontrol', async () => {
      await page.getByRole('button', { name: /^Save/ }).first().click()
    })
  })

  test('the procedure slideout opens from the control Documentation tab', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const procedureName = uniqueRefCode().replace('E2E-', 'E2E Procedure ')
    const procedureId = await createProcedure(ownerApi, procedureName)
    await linkControlProcedure(ownerApi, controlId, procedureId)

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByText(procedureName, { exact: true }).first().click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText(procedureName).first()).toBeVisible({ timeout: 30_000 })
  })
})
