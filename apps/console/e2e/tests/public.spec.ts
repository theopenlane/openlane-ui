import { expect, test } from '@playwright/test'

test.describe('public — questionnaire', () => {
  test('/questionnaire without a token renders the unable-to-load fallback', async ({ page }) => {
    // No token + no session → useQuestionnaire is disabled and questionnaireData is null
    test.slow()
    await page.goto('/questionnaire', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByText(/unable to load questionnaire/i)).toBeVisible({ timeout: 15_000 })
  })

  test('/questionnaire with a malformed token renders the same fallback', async ({ page }) => {
    await page.goto('/questionnaire?token=not-a-real-jwt', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/unable to load questionnaire/i)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('public — waitlist', () => {
  test('/waitlist without a session redirects to /login (not a public page)', async ({ page }) => {
    await page.goto('/waitlist').catch(() => {})
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 15_000 })
  })
})

test.describe('public — signup', () => {
  test('/signup renders without auth and shows core copy', async ({ page }) => {
    await page.goto('/signup')

    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/signup → "Login" link navigates to /login', async ({ page }) => {
    await page.goto('/signup')

    await page.getByRole('link', { name: /^login$/i }).click()
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 10_000 })
  })
})
