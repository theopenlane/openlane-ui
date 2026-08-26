import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { uniqueName, uniqueRef } from '../utils/unique'
import { createControl, getOwnerApi, type ApiSession } from '../utils/api'
import { openSubmitEvidenceSheet, saveEvidenceAsDraft } from '../utils/evidence'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

/**
 * EVIDENCE_CREATE_MODE.requireLinkedControls gates "Submit for review" on at
 * least one linked control, while "Save as draft" deliberately bypasses it.
 * Both halves of that rule are asserted here — a regression in either direction
 * is silent otherwise.
 */
test.describe('journey — evidence submission gate', () => {
  test('submitting for review without a linked control is refused with guidance', async ({ page }) => {
    test.slow()
    await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const dialog = await openSubmitEvidenceSheet(page)
    await dialog.getByPlaceholder('Enter a descriptive name for this evidence').fill(uniqueName('E2E Evidence Gate'))
    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    await expect(page.getByText('Link at least one control before submitting for review.')).toBeVisible({ timeout: 30_000 })
    await expect(dialog).toBeVisible()
  })

  test('saving as a draft bypasses the gate and creates the record', async ({ page }) => {
    test.slow()
    await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const name = uniqueName('E2E Evidence Draft')
    const dialog = await openSubmitEvidenceSheet(page)
    await dialog.getByPlaceholder('Enter a descriptive name for this evidence').fill(name)
    await saveEvidenceAsDraft(page, dialog)

    await page.goto('/evidence', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page
      .getByPlaceholder(/search/i)
      .first()
      .fill(name)
    await expect(page.getByRole('row', { name: new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })).toBeVisible({ timeout: 30_000 })
  })
})

/**
 * A control is only useful once it carries an objective and an implementation.
 * Each page is covered on its own elsewhere; this walks the three of them in
 * sequence against one freshly seeded control, which is what a user actually
 * does and what per-page specs cannot catch.
 */
test.describe('journey — a new control gains an objective and an implementation', () => {
  test.describe.configure({ mode: 'serial' })

  let controlId: string
  let refCode: string

  test.beforeAll(async () => {
    refCode = uniqueRef('E2E-JRN')
    controlId = await createControl(ownerApi, refCode)
  })

  test('the seeded control opens on its detail page', async ({ page }) => {
    test.slow()
    await page.goto(`/controls/${controlId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(refCode, { exact: true }).first()).toBeVisible({ timeout: 60_000 })
  })

  test('an objective added to it is listed on the objectives page', async ({ page }) => {
    test.slow()
    await page.goto(`/controls/${controlId}/control-objectives`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create$/ }).first()).toBeVisible({ timeout: 60_000 })

    await page
      .getByRole('button', { name: /^Create$/ })
      .first()
      .click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
    await sheet.getByRole('textbox').first().fill(uniqueName('E2E Journey Objective'))
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(toast(page, 'Control Objective created')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'Objective actions' })).toHaveCount(1, { timeout: 30_000 })
  })

  test('an implementation added to it is listed on the implementation page', async ({ page }) => {
    test.slow()
    await page.goto(`/controls/${controlId}/control-implementation`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const emptyState = page.getByText('Create a new one')
    const toolbar = page.getByRole('button', { name: /^Create$/ }).first()
    await emptyState.or(toolbar).first().click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(toast(page, 'Control Implementation created')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: 'Implementation actions' })).toHaveCount(1, { timeout: 30_000 })
  })
})
