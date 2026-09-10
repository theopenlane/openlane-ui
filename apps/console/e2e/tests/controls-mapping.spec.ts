import type { Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { uniqueRef } from '../utils/unique'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const openControlSubroute = async (page: Page, subroute: string) => {
  const { sharedControlId } = readManifest()
  await page.goto(`/controls/${sharedControlId}/${subroute}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 60_000 })
}

test.describe('controls — map control', () => {
  test('the relation type selector offers every mapping type', async ({ page }) => {
    test.slow()
    await openControlSubroute(page, 'map-control')

    await expect(page.getByText('Relation type', { exact: true })).toBeVisible({ timeout: 60_000 })
    await page
      .getByRole('combobox')
      .filter({ hasText: /^(Equal|Subset|Intersection|Partial|Superset)$/ })
      .first()
      .click()

    for (const option of ['Equal', 'Subset', 'Intersection', 'Partial', 'Superset']) {
      await expect(page.getByRole('option', { name: option, exact: true })).toBeVisible({ timeout: 15_000 })
    }
  })

  test('saving a mapping with no target control is rejected', async ({ page }) => {
    test.slow()
    await openControlSubroute(page, 'map-control')

    await expect(page.getByRole('button', { name: 'Save Changes' })).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(toast(page, 'From control is required').or(toast(page, 'To control is required'))).toBeVisible({ timeout: 30_000 })
    await expect(toast(page, 'Map Control created!')).toBeHidden()
  })

  test('the From and To cards both render on the mapping page', async ({ page }) => {
    test.slow()
    await openControlSubroute(page, 'map-control')

    await expect(page.getByText('From', { exact: true })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText('To', { exact: true })).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('controls — clone control', () => {
  test('cloning prefills the source ref code with a CC- prefix', async ({ page }) => {
    test.slow()
    const { sharedControlRefCode } = readManifest()
    await openControlSubroute(page, 'clone-control')

    const refCode = page.getByRole('textbox').first()
    await expect(refCode).toHaveValue(`CC-${sharedControlRefCode}`, { timeout: 60_000 })
  })

  test('clearing the ref code blocks the clone with a required-field error', async ({ page }) => {
    test.slow()
    await openControlSubroute(page, 'clone-control')

    const refCode = page.getByRole('textbox').first()
    await expect(refCode).not.toHaveValue('', { timeout: 60_000 })
    await refCode.fill('')
    await page.getByRole('button', { name: /^Create$/ }).click()

    await expect(page.getByText('Ref Code is required')).toBeVisible({ timeout: 30_000 })
    await expect(page).toHaveURL(/clone-control/)
  })

  test('submitting a clone creates the control and redirects to it', async ({ page }) => {
    test.slow()
    await openControlSubroute(page, 'clone-control')

    const refCode = page.getByRole('textbox').first()
    await expect(refCode).not.toHaveValue('', { timeout: 60_000 })

    const cloned = uniqueRef('CC-E2E')
    await refCode.fill(cloned)
    await page.getByRole('button', { name: /^Create$/ }).click()

    await expect(toast(page, 'Control created successfully, redirecting...')).toBeVisible({ timeout: 60_000 })
    await expect(page).toHaveURL(/\/controls\/[^/]+$/, { timeout: 60_000 })
    await expect(page.getByText(cloned, { exact: true }).first()).toBeVisible({ timeout: 60_000 })
  })
})
