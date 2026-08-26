import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'

const openAuthentication = async (page: Page) => {
  await page.goto('/organization-settings/authentication', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByText('Allowed domains', { exact: true })).toBeVisible({ timeout: 60_000 })
}

const domainField = (page: Page) => page.getByLabel('Allowed domain', { exact: true })

test.describe('organization settings — allowed domains', () => {
  test.describe.configure({ mode: 'serial' })

  test('an added domain renders as a chip and can be removed again', async ({ page }) => {
    test.slow()
    const domain = `e2e-allowed-${RUN_ID}.invalid`

    await openAuthentication(page)
    await domainField(page).fill(domain)
    await page.getByRole('button', { name: /^Add Domain$/ }).click()

    await expect(page.getByText(domain, { exact: true })).toBeVisible({ timeout: 30_000 })

    const remove = page.getByRole('button', { name: `Remove ${domain}` })
    await expect(remove).toBeVisible({ timeout: 15_000 })
    await remove.click()

    await expect(page.getByText('Domain removed successfully.').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(domain, { exact: true })).toHaveCount(0, { timeout: 30_000 })
  })

  test('an added domain survives a reload before being removed', async ({ page }) => {
    test.slow()
    const domain = `e2e-persist-${RUN_ID}.invalid`

    await openAuthentication(page)
    await domainField(page).fill(domain)
    await page.getByRole('button', { name: /^Add Domain$/ }).click()
    await expect(page.getByText(domain, { exact: true })).toBeVisible({ timeout: 30_000 })

    await openAuthentication(page)
    await expect(page.getByText(domain, { exact: true })).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: `Remove ${domain}` }).click()
    await expect(page.getByText(domain, { exact: true })).toHaveCount(0, { timeout: 30_000 })
  })

  test('a malformed domain is rejected client-side and adds no chip', async ({ page }) => {
    test.slow()
    await openAuthentication(page)

    await domainField(page).fill('not a domain')
    await page.getByRole('button', { name: /^Add Domain$/ }).click()

    await expect(page.getByText('"not a domain" is not a valid domain.')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: 'Remove not a domain' })).toHaveCount(0)
  })
})
