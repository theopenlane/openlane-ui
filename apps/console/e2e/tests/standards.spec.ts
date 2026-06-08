import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup).
test.describe('standards — list', () => {
  test('/standards renders the Standards Catalog heading for an owner', async ({ page }) => {
    await page.goto('/standards')

    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible()
  })

  test('/standards renders the search input', async ({ page }) => {
    await page.goto('/standards')

    await expect(page.getByPlaceholder(/^Search standards\.\.\.$/)).toBeVisible({ timeout: 15_000 })
  })
})
