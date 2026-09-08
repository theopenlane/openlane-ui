import { expect, test } from '@playwright/test'

test('smoke — login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
})
