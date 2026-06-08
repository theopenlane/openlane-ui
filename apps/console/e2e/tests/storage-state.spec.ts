import { test, expect, authFile, type Role } from '../fixtures/auth'

/**
 * Verifies the storage-state auth layer from global-setup. If this fails, every
 * storage-state-based spec is invalid — run it first.
 *
 * global-setup runs automatically and writes e2e/.auth/*.json + manifest.json
 * (reused across runs; E2E_RESEED=1 forces a fresh seed).
 */
test.describe('storage state — owner', () => {
  test('reaches /dashboard without logging in', async ({ page }) => {
    await page.goto('/dashboard')

    // No redirect to /login — the saved cookies authenticate us. The protected
    // shell renders the user menu; assert it's attached (toBeVisible races with
    // hydration under parallel load — the div exists but reports zero-size).
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
  })

  test('is in a real org — onboarding guard does not bounce protected routes', async ({ page }) => {
    // The middleware redirects users with only one org to /onboarding. Reaching
    // a protected route and staying there proves the owner is in the shared,
    // onboarded org (personal + onboarded = 2 orgs).
    await page.goto('/policies')

    await expect(page).toHaveURL(/\/policies/)
    await expect(page).not.toHaveURL(/\/onboarding/)
  })
})

// Each role user was added to the shared org and has it as their default org,
// so they authenticate straight into it. This verifies the multi-role seeding;
// role-specific permission behaviour is asserted in the feature specs.
for (const role of ['admin', 'member', 'readonly'] as Role[]) {
  test.describe(`storage state — ${role}`, () => {
    test.use({ storageState: authFile(role) })

    test('reaches /dashboard in the shared org without logging in', async ({ page }) => {
      await page.goto('/dashboard')

      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page).not.toHaveURL(/\/onboarding/)
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
    })
  })
}
