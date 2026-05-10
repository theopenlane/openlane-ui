import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

test.describe('dashboard — render', () => {
  test('/dashboard renders the "Welcome, ..." headline for an onboarded user', async ({ page }) => {
    await seedLoggedInUser(page, 'dash-welcome')

    await page.goto('/dashboard')

    // dashboard-page.tsx renders <p>Welcome, {displayName}!</p>. The
    // displayName comes from the seeded user; just match the prefix.
    await expect(page.getByText(/^Welcome,/)).toBeVisible({ timeout: 15_000 })
  })
})
