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
    await page.locator('.lucide-table').first().click()
    await page.getByPlaceholder(/^Search$/).fill(refCode)

    const row = page.getByRole('row').filter({ hasText: refCode })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })

  test('clicking Edit control enters edit mode (Cancel + Save appear)', async ({ page }) => {
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 30_000 })

    await editControlButton(page).click()
    await expect(page.getByRole('button', { name: /^Cancel$/i })).toBeVisible({ timeout: 10_000 })
  })

  test('delete a control via the actions menu redirects to the controls list', async ({ page }) => {
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('control-actions-menu').click()
    await clickResilient(page.getByTestId('control-delete-button'))
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
    // Scoped testid, not getByRole('combobox')
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
    // Link via API (addInternalPolicyIDs) so the Documentation tab has data
    await linkControlPolicy(ownerApi, controlId, policyId)

    await page.goto(`/controls/${controlId}?tab=documentation`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Documentation' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    await expect(page.getByText(policyName).first()).toBeVisible({ timeout: 20_000 })

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

    await expect(page.getByText(evidenceName).first()).toBeVisible({ timeout: 20_000 })
  })

  test('unlinking a policy from a control removes the association chip', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())
    const policyId = await createInternalPolicy(ownerApi, `E2E Unlink ${RUN_ID} ${Date.now().toString(36)}`)
    await linkControlPolicy(ownerApi, controlId, policyId)

    await page.goto(`/controls/${controlId}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 45_000 })

    await page.getByTestId('assoc-view-toggle').click()
    const removeX = page.getByTestId('objects-chip-remove')
    if ((await removeX.count()) === 0) {
      await page.getByText('Policies', { exact: true }).click()
    }
    await expect(removeX).toHaveCount(1, { timeout: 15_000 })

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

    const linked = page.getByRole('tab', { name: 'Linked Controls' })
    const evidence = page.getByRole('tab', { name: 'Evidence' })
    await expect(linked).toBeVisible({ timeout: 15_000 })
    await expect(evidence).toBeVisible()

    await linked.click()
    await expect(linked).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect.poll(() => new URL(page.url()).searchParams.get('tab'), { timeout: 15_000 }).toBeNull()

    await evidence.click()
    await page.waitForURL(/[?&]tab=evidence/, { timeout: 15_000 })
    await expect(evidence).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(linked).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('controls — map + subcontrol (seeded)', () => {
  test('map-control page renders the From and To mapping cards', async ({ page }) => {
    // Heavy route (Plate + control-select bundles) → cold dev-server compile can exceed the default nav budget on first hit
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}/map-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page).toHaveTitle(/Map Control/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'From', exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'To', exact: true })).toBeVisible()
  })

  test('create-subcontrol page renders the form with a reference code field', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

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

    await page.goto(`/controls/${id}/clone-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.locator('input[name="refCode"]')).toHaveValue(`CC-${refCode}`, { timeout: 45_000 })
  })

  test('map-control exposes the Relation type selector', async ({ page }) => {
    test.slow()
    const id = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${id}/map-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Relation type', { exact: true }).first()).toBeVisible({ timeout: 45_000 })
  })
})

test.describe('controls — dynamic column fetch (ISS-2357)', () => {
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
        // non-JSON payloads are not the query under test
      }
    })

    return () => latest
  }

  const openControlsTable = async (page: Page) => {
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
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

    await page.getByRole('button', { name: /^Columns$/ }).click()
    const descriptionRow = page
      .getByRole('menu')
      .locator('div.flex.items-center.gap-x-3')
      .filter({ hasText: /^Description$/ })
    await expect(descriptionRow).toBeVisible({ timeout: 15_000 })

    await descriptionRow.getByRole('checkbox').click()
    await expect.poll(() => includeVars()?.includeDescription, { timeout: 30_000 }).toBe(false)

    // Only the hide direction is observable on the wire: re-enabling the column restores a variable set react-query has already cached, so it serves the earlier result without issuing a new request
  })
})

test.describe('controls — report view (#1872)', () => {
  const openReport = async (page: Page) => {
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { name: /^Controls$/ }).first()).toBeVisible({ timeout: 45_000 })
  }

  test('the report toolbar renders its three filter dropdowns', async ({ page }) => {
    test.slow()
    await openReport(page)

    await expect(page.getByRole('button', { name: /^Filter by:/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible()
  })

  test('the "Report on:" menu lists the gap filters and a clear action', async ({ page }) => {
    test.slow()
    await openReport(page)

    await page.getByRole('button', { name: /^Report on:/ }).click()

    const reportMenu = page.getByRole('dialog').filter({ hasText: 'Show controls that:' })
    await expect(reportMenu).toBeVisible({ timeout: 15_000 })

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

    await expect(page.getByText('Organization Controls', { exact: true })).toBeVisible({ timeout: 15_000 })
  })

  test('the report grid renders its column header strip', async ({ page }) => {
    test.slow()
    const refCode = uniqueRefCode()
    await createControl(ownerApi, refCode)

    await openReport(page)

    await expect(page.getByText('Ref Code', { exact: true }).first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText('Evidence', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Policies', { exact: true }).first()).toBeVisible()
  })

  test('the TabSwitcher flips between the report and the table view', async ({ page }) => {
    test.slow()
    await openReport(page)
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 30_000 })

    await page.locator('.lucide-table').first().click()
    await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toHaveCount(0)
  })
})

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
    await expect(page.getByText(/^Approved$/).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/^Archived$/).first()).toBeVisible()
  })

  test('the mapped-controls count renders alongside the section title', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${controlId}?tab=linked-controls`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Linked Controls' })).toHaveAttribute('aria-selected', 'true', { timeout: 45_000 })

    await expect(page.getByText(/^\(\d+ mapped\)$/).first()).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('controls — report program filter (ISS-2422)', () => {
  test('the Program filter appears once the org has a program, and persists a selection', async ({ page }) => {
    test.slow()
    const programName = `E2E RptProg ${RUN_ID} ${Date.now().toString(36)}`
    await createProgram(ownerApi, programName)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    const programFilter = page.getByRole('button', { name: /^Program:/ })
    await expect(programFilter).toBeVisible({ timeout: 30_000 })

    await programFilter.click()
    const programMenu = page.getByRole('dialog').filter({ hasText: programName })
    await expect(programMenu).toBeVisible({ timeout: 15_000 })
    await programMenu.getByText(programName, { exact: true }).first().click()

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

test.describe('controls — report empty states (ISS-2426)', () => {
  test('an org with controls never shows the create-first empty state', async ({ page }) => {
    test.slow()
    await createControl(ownerApi, uniqueRefCode())

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    await expect(page.getByText(/No controls found\./)).toHaveCount(0)

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

test.describe('controls — report bulk assign to program (ISS-2523)', () => {
  test('selection mode surfaces the bulk bar with the Assign to Program action', async ({ page }) => {
    test.slow()
    await createControl(ownerApi, uniqueRefCode())
    await createProgram(ownerApi, `E2E BulkProg ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    const selectToggle = page.getByRole('button', { name: /^Select$/ })
    await expect(selectToggle).toBeVisible({ timeout: 30_000 })
    await selectToggle.click()

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

    await expect(page.getByRole('combobox').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('controls — CSV dialogs lifted out of the menu (#2041)', () => {
  test('Upload Custom Controls opens a dialog that outlives the dropdown', async ({ page }) => {
    test.slow()
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    await page.getByRole('button', { name: 'Action' }).first().click()
    await page.getByText('Upload Custom Controls', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByText(/^Bulk Upload /)).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByText('CSV Format')).toBeVisible()

    await expect(page.getByText('Upload Custom Controls', { exact: true })).toHaveCount(0)
    await expect(dialog).toBeVisible()
  })
})

test.describe('controls — reviews tab (ISS-2551)', () => {
  test('the Reviews tab is hidden for a control with no reviews', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRefCode())

    await page.goto(`/controls/${controlId}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Linked Controls' })).toBeVisible({ timeout: 45_000 })

    await expect(page.getByRole('tab', { name: 'Reviews' })).toHaveCount(0)
  })
})

test.describe('controls — system standards excluded from import (ISS-2687)', () => {
  test('the Upload From Standard dialog does not offer the Openlane system standards', async ({ page }) => {
    test.slow()
    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^Report on:/ })).toBeVisible({ timeout: 45_000 })

    await page.getByRole('button', { name: 'Action' }).first().click()
    await page.getByText('Upload From Standard', { exact: true }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await expect(dialog.getByText('OL Baseline', { exact: true })).toHaveCount(0)
    await expect(dialog.getByText('OTS', { exact: true })).toHaveCount(0)
  })
})

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
        // non-JSON payloads are not the query under test
      }
    })

    await page.goto('/controls', { waitUntil: 'domcontentloaded' })
    await page.locator('.lucide-table').first().click()
    await expect(page.getByPlaceholder(/^Search$/)).toBeVisible({ timeout: 45_000 })

    await page.waitForTimeout(3_000)

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
