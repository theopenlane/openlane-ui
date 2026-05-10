import { expect, test } from '@playwright/test'

// Public questionnaire — no auth, no seedLoggedInUser.

test.describe('public — questionnaire', () => {
  test('/questionnaire without a token renders the unable-to-load fallback', async ({ page }) => {
    // No token + no session → useQuestionnaire is disabled and
    // questionnaireData is null, so the component renders the
    // fallback message in its final branch (questionnaire.tsx).
    // waitUntil:'domcontentloaded' avoids hanging on survey-react's
    // background subresources, which can keep "load" pending.
    await page.goto('/questionnaire', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/unable to load questionnaire/i)).toBeVisible({ timeout: 15_000 })
  })

  test('/questionnaire with a malformed token renders the same fallback', async ({ page }) => {
    // A garbage token triggers useQuestionnaire's fetch but returns
    // no data; the component falls through to the same "unable to
    // load" branch as the no-token case.
    await page.goto('/questionnaire?token=not-a-real-jwt', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/unable to load questionnaire/i)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('public — waitlist', () => {
  test('/waitlist renders the marketing copy + subscribe form', async ({ page }) => {
    await page.goto('/waitlist')

    await expect(page.getByRole('heading', { level: 1, name: /Compliance should be/i })).toBeVisible()
    // Subscribe form has a submit button and an email input — at
    // minimum the email field should be present.
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible()
  })
})

test.describe('public — signup', () => {
  test('/signup renders without auth and shows core copy', async ({ page }) => {
    await page.goto('/signup')

    // Signup is in (auth) but not behind middleware-required login.
    // It must render an email/password sign-up form.
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByPlaceholder(/email/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/signup → "Login" link navigates to /login', async ({ page }) => {
    await page.goto('/signup')

    // signup.tsx renders <Link href="/login">Login</Link> beneath the
    // "Already have an account?" line (only when isPasswordActive=false).
    await page.getByRole('link', { name: /^login$/i }).click()
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 10_000 })
  })
})
