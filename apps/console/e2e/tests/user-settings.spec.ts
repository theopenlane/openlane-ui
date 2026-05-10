import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

test.describe('user-settings — pages render', () => {
  test('/user-settings renders the User settings heading', async ({ page }) => {
    await seedLoggedInUser(page, 'us-root')

    await page.goto('/user-settings')

    await expect(page.getByRole('heading', { level: 2, name: /^User settings$/ })).toBeVisible()
  })

  test('/user-settings/profile renders the My profile heading', async ({ page }) => {
    await seedLoggedInUser(page, 'us-profile')

    await page.goto('/user-settings/profile')

    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible()
  })

  test('user menu shows the seeded user email', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'us-menu-email')

    // user-menu.tsx renders data.user.email under the displayName when
    // the trigger is clicked.
    await page.getByTestId('user-menu-trigger').click()
    await expect(page.getByText(email)).toBeVisible({ timeout: 10_000 })
  })
})
