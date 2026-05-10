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

  test('/dashboard renders the authenticated shell (user menu trigger)', async ({ page }) => {
    await seedLoggedInUser(page, 'dash-shell')

    await page.goto('/dashboard')

    // user-menu-trigger is the avatar/menu button rendered by the
    // authenticated app shell; if this isn't present we're not in
    // the protected layout at all.
    await expect(page.getByTestId('user-menu-trigger')).toBeVisible({ timeout: 15_000 })
  })
})
