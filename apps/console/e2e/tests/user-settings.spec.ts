import { test, expect, readManifest } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Pure render checks.
test.describe('user-settings — pages render', () => {
  test('/user-settings renders the User settings heading', async ({ page }) => {
    await page.goto('/user-settings', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 2, name: /^User settings$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('/user-settings/profile renders the My profile heading', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('user menu shows the logged-in user email', async ({ page }) => {
    const { ownerEmail } = readManifest()
    await page.goto('/dashboard')

    // user-menu.tsx renders data.user.email under the displayName when the
    // trigger is clicked.
    await page.getByTestId('user-menu-trigger').click()
    await expect(page.getByText(ownerEmail)).toBeVisible({ timeout: 10_000 })
  })
})
