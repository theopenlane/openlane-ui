import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup).
test.describe('notifications — page render', () => {
  test('/notifications renders the "Notifications" heading for an onboarded user', async ({ page }) => {
    await page.goto('/notifications')

    // notifications-page.tsx:99 renders <h1>Notifications</h1>.
    await expect(page.getByRole('heading', { level: 1, name: /^Notifications$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('/notifications renders the All / Unread filter toggle', async ({ page }) => {
    await page.goto('/notifications')

    // Two unbadged segmented-control buttons in the header — "All" and
    // "Unread". A fresh org has no notifications, so the Unread button
    // shows no count badge.
    await expect(page.getByRole('button', { name: /^All$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Unread$/ })).toBeVisible()
  })
})
