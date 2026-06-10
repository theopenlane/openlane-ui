import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Pure render checks.
test.describe('dashboard — render', () => {
  test('/dashboard renders the "Welcome, ..." headline for an onboarded user', async ({ page }) => {
    await page.goto('/dashboard')

    // dashboard-page.tsx renders <p>Welcome, {displayName}!</p>. Match the prefix.
    await expect(page.getByText(/^Welcome,/)).toBeVisible({ timeout: 15_000 })
  })

  test('/dashboard renders the authenticated shell (user menu trigger)', async ({ page }) => {
    await page.goto('/dashboard')

    // user-menu-trigger is the avatar/menu button in the authenticated shell.
    // Assert attached (not visible) — it's a zero-size div until hydration.
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 15_000 })
  })
})
