import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

test.describe('standards — list', () => {
  test('/standards renders the Standards Catalog heading for an owner', async ({ page }) => {
    await seedLoggedInUser(page, 'std-list')

    await page.goto('/standards')

    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible()
  })
})
