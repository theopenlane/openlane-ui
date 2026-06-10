import { test, expect } from '../fixtures/auth'

// /organization is the post-login org-picker / org-create landing.
// Distinct from /organization-settings (covered in organization-settings.spec.ts).
// Logged in as the storage-state Owner (global-setup).
test.describe('organization — landing page', () => {
  test('/organization renders the Existing organizations panel for an onboarded user', async ({ page }) => {
    await page.goto('/organization')

    // PanelHeader from @repo/ui renders the heading as an <h2>.
    await expect(page.getByRole('heading', { level: 2, name: /^Existing organizations$/ })).toBeVisible({ timeout: 15_000 })
  })
})
