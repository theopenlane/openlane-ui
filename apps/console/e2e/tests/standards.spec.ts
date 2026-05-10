import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

test.describe('standards — list', () => {
  test('/standards renders the Standards Catalog heading for an owner', async ({ page }) => {
    await seedLoggedInUser(page, 'std-list')

    await page.goto('/standards')

    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible()
  })

  test('/standards renders the search input', async ({ page }) => {
    await seedLoggedInUser(page, 'std-search')

    await page.goto('/standards')

    await expect(page.getByPlaceholder(/^Search standards\.\.\.$/)).toBeVisible({ timeout: 15_000 })
  })
})
