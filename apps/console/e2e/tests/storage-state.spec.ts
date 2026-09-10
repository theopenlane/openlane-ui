import { test, expect, type Role } from '../fixtures/auth'

test.describe('storage state — owner', () => {
  test('reaches /dashboard without logging in', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
  })

  test('is in a real org — onboarding guard does not bounce protected routes', async ({ page }) => {
    await page.goto('/policies')

    await expect(page).toHaveURL(/\/policies/)
    await expect(page).not.toHaveURL(/\/onboarding/)
  })
})

for (const role of ['admin', 'member', 'readonly'] as Role[]) {
  test.describe(`storage state — ${role}`, () => {
    test.use({ authProfile: role })

    test('reaches /dashboard in the shared org without logging in', async ({ page }) => {
      await page.goto('/dashboard')

      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page).not.toHaveURL(/\/onboarding/)
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
    })
  })
}
