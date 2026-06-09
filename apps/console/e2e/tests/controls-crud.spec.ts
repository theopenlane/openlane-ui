import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createControl, createInternalPolicy, createProcedure, createEvidence, linkControlPolicy, linkControlProcedure, linkControlEvidence, type ApiSession } from '../utils/api'

/**
 * Deep controls flows beyond controls.spec.ts (create/search/inline edit on
 * fresh users) and the edit/delete GATING in permissions.spec.ts: the actual
 * owner edit-mode toggle and delete action. Runs as the storage-state Owner;
 * controls seeded via the Owner API with run-unique refCodes.
 *
 * ⏳ Written without running (servers were off). Verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueRefCode = () => `E2E-CTLCRUD-${RUN_ID}-${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

const editControlButton = (page: Page) => page.getByRole('button', { name: 'Edit control' })

test.describe('controls — owner edit + delete (seeded)', () => {
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
    await page.getByTestId('control-delete-button').click()
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

    // status.tsx: double-clicking control-status-trigger swaps it for a Select.
    const statusTrigger = page.getByTestId('control-status-trigger')
    await statusTrigger.dblclick()
    const statusSelect = page.getByRole('combobox')
    await expect(statusSelect).toBeVisible({ timeout: 5_000 })
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
    // active tab is fully URL-controlled (tabs.tsx: onValueChange →
    // router.replace(?tab=…) → re-render), so wait for the URL to commit before
    // asserting the controlled aria-selected state flips.
    const linked = page.getByRole('tab', { name: 'Linked Controls' })
    const evidence = page.getByRole('tab', { name: 'Evidence' })
    await expect(linked).toBeVisible({ timeout: 15_000 })
    await expect(evidence).toBeVisible()

    await linked.click()
    await page.waitForURL(/[?&]tab=linked-controls/, { timeout: 15_000 })
    await expect(linked).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })

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
