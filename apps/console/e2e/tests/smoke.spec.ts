import { expect, test } from '@playwright/test'

// Sanity check that the harness is wired up correctly.
// Run: `bun run e2e -- --grep smoke` (requires the dev server to be running).
test('smoke — login page renders', async ({ page }) => {
  await page.goto('/login')
  await expect(page).toHaveURL(/\/login/)
})
