import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'

const openFirstDefinition = async (page: Page) => {
  await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 30_000 })

  const viewButton = page.getByRole('button', { name: /^(View|Manage)$/ }).first()
  await expect(viewButton).toBeVisible({ timeout: 20_000 })
  await viewButton.click()
  await expect(page).toHaveURL(/\/automation\/integrations\/[^/]+$/, { timeout: 20_000 })
}

test.describe('automation — integration configuration form', () => {
  test('the definition page renders the credential fields declared by the integration schema', async ({ page }) => {
    test.slow()
    await openFirstDefinition(page)

    await expect(page.getByRole('heading', { level: 3, name: /^Connect$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 4, name: /^CREDENTIALS$/ })).toBeVisible({ timeout: 20_000 })

    const requiredCredential = page.getByRole('textbox', { name: /\*/ }).first()
    await expect(requiredCredential).toBeVisible({ timeout: 20_000 })
    await expect(requiredCredential).toBeEditable()

    await expect(page.getByRole('button', { name: /^Save & Connect$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('submitting the connect form with empty credentials does not leave the definition page', async ({ page }) => {
    test.slow()
    await openFirstDefinition(page)
    const definitionUrl = page.url()

    const connect = page.getByRole('button', { name: /^Save & Connect$/ })
    await expect(connect).toBeVisible({ timeout: 30_000 })
    await connect.click()

    await expect(page).toHaveURL(definitionUrl, { timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Save & Connect$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('a credential value typed into the connect form is retained in the field', async ({ page }) => {
    test.slow()
    await openFirstDefinition(page)

    const requiredCredential = page.getByRole('textbox', { name: /\*/ }).first()
    await expect(requiredCredential).toBeEditable({ timeout: 30_000 })
    await requiredCredential.fill('https://e2e.invalid')

    await expect(requiredCredential).toHaveValue('https://e2e.invalid', { timeout: 15_000 })
  })
})
