import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createControl, type ApiSession } from '../utils/api'

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
})
