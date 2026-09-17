import { test, expect } from '../fixtures/auth'

test.describe('global search — navigating from the command palette', () => {
  test('picking a result takes you to that section', async ({ page }) => {
    test.slow()
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 60_000 })

    await page.keyboard.press('ControlOrMeta+k')
    const input = page.getByPlaceholder(/type a command or search/i)
    await expect(input).toBeVisible({ timeout: 15_000 })

    await input.fill('Controls')
    const hit = page.getByRole('option', { name: /controls/i }).first()
    await expect(hit).toBeVisible({ timeout: 15_000 })
    await hit.click()

    await expect(page).toHaveURL(/\/controls/, { timeout: 30_000 })
    await expect(input).toBeHidden({ timeout: 15_000 })
  })
})
