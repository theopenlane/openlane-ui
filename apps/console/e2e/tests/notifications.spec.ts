import { test, expect } from '../fixtures/auth'

test.describe('notifications — page render', () => {
  test('/notifications renders the "Notifications" heading for an onboarded user', async ({ page }) => {
    await page.goto('/notifications')

    await expect(page.getByRole('heading', { level: 1, name: /^Notifications$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('/notifications renders the All / Unread filter toggle', async ({ page }) => {
    await page.goto('/notifications')

    await expect(page.getByRole('button', { name: /^All$/ }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Unread/ })).toBeVisible()
  })

  test('/notifications renders the Filters panel with topic options', async ({ page }) => {
    await page.goto('/notifications')

    await expect(page.getByText('Filters', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Mention$/ })).toBeVisible()
  })
})
