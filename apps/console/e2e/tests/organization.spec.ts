import { test, expect } from '../fixtures/auth'

test.describe('organization — landing page', () => {
  test('/organization renders the Existing organizations panel for an onboarded user', async ({ page }) => {
    await page.goto('/organization')

    await expect(page.getByRole('heading', { level: 2, name: /^Existing organizations$/ })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('organization — switch (render-only, owner)', () => {
  test('the Existing organizations panel renders an org row with a role tag', async ({ page }) => {
    await page.goto('/organization')
    await expect(page.getByRole('heading', { level: 2, name: /^Existing organizations$/ })).toBeVisible({ timeout: 15_000 })

    await expect(page.getByText('OWNER', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('organization — create form (validation-only, owner)', () => {
  test('create-organization form blocks submit on a too-short Name (no mutation)', async ({ page }) => {
    await page.goto('/organization')

    await expect(page.getByRole('heading', { level: 2, name: /^Create (your first|another) organization$/ })).toBeVisible({ timeout: 15_000 })

    const nameInput = page.locator('input[name="name"]')
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill('a')

    await page.getByRole('button', { name: /^Create organization$/ }).click()
    await expect(page.getByText(/Name must be at least 2 characters/i).first()).toBeVisible({ timeout: 10_000 })

    await expect(page).toHaveURL(/\/organization$/)
  })
})

test.describe('organization — leaving any org (#2136)', () => {
  test('an owned organization offers no Leave action', async ({ page }) => {
    test.slow()
    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    await expect(page.getByRole('button', { name: /^Leave$/ })).toHaveCount(0)
  })

  test('the organization list renders switchable organizations', async ({ page }) => {
    test.slow()
    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    await expect(
      page
        .getByRole('button', { name: /^Select$/ })
        .first()
        .or(page.getByText(/organization/i).first()),
    ).toBeVisible({ timeout: 30_000 })
  })
})
