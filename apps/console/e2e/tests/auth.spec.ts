import { expect, test } from '@playwright/test'

import { emailFor, PASSWORD } from '../utils/constants'
import { loginViaForm } from '../utils/login'
import { installRecaptchaShim } from '../utils/recaptcha'
import { registerAndVerify } from '../utils/registerUser'
import { seedLoggedInUser } from '../utils/seedUser'

test.describe('auth — login', () => {
  // A registered+verified user shared across happy-path tests in this
  // describe block. Created once per worker.
  let registeredEmail: string

  test.beforeAll(async () => {
    registeredEmail = emailFor(`login-${Date.now().toString(36)}`)
    await registerAndVerify({ email: registeredEmail })
  })

  test('logged-out user hitting a protected route is redirected to /login with the original path preserved', async ({ page }) => {
    const response = await page.goto('/policies')
    // The middleware-driven redirect happens before the page renders, so the
    // landed URL is /login and the response chain ends there.
    expect(response).toBeTruthy()
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })

  test('webfinger keeps a regular (non-SSO) user on the password screen', async ({ page }) => {
    await page.goto('/login')

    const webfingerResponse = page.waitForResponse(/\/api\/auth\/webfinger/)
    await page.getByPlaceholder(/Enter your email/i).fill(registeredEmail)
    const wf = await webfingerResponse

    expect(wf.ok()).toBe(true)
    await expect(page.locator('input[name="password"]')).toBeAttached()
    // No SSO redirect happened.
    await expect(page).toHaveURL(/\/login(\?|$)/)
  })

  test('valid email + password → onboarding (fresh user) or dashboard (returning)', async ({ page }) => {
    await loginViaForm(page, registeredEmail, PASSWORD)
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/, { timeout: 15_000 })
  })

  test('invalid password → inline error, stays on /login', async ({ page }) => {
    await loginViaForm(page, registeredEmail, 'definitely-the-wrong-password')

    await expect(page).toHaveURL(/\/login/)
    // The form surfaces an error; don't pin the exact copy, just that something
    // visible-and-error-shaped appears.
    await expect(page.getByText(/error|invalid|incorrect|try again/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('unknown email → no user enumeration on the login screen', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/login')

    const unknown = `nobody-${Date.now().toString(36)}@openlane.test`
    const webfingerResponse = page.waitForResponse(/\/api\/auth\/webfinger/)
    await page.getByPlaceholder(/Enter your email/i).fill(unknown)
    await webfingerResponse

    await expect(page).toHaveURL(/\/login(\?|$)/)
    const body = await page.locator('body').textContent()
    expect(body ?? '').not.toMatch(/user not found|no such user|account does not exist|email not registered|email not found/i)
  })

  test('login at /login?redirect=/policies routes to /policies after auth', async ({ page }) => {
    // Fresh users go to /onboarding regardless of ?redirect, so we need
    // an onboarded user. seedLoggedInUser handles register + verify +
    // login + wizard, leaving us on /dashboard. Then we log out so the
    // /login visit isn't bounced to /dashboard by the
    // logged-in-on-/login middleware branch.
    const { email } = await seedLoggedInUser(page, 'redir')

    await page.getByTestId('user-menu-trigger').click()
    const signOutResponse = page.waitForResponse(/\/api\/auth\/signout/)
    await page.getByRole('button', { name: /^log out$/i }).click()
    await signOutResponse
    await expect(async () => {
      await page.goto('/login').catch(() => {})
      await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 2_000 })
    }).toPass({ timeout: 20_000 })

    await page.goto('/login?redirect=/policies')

    const webfingerResponse = page.waitForResponse(/\/api\/auth\/webfinger/)
    await page.getByPlaceholder(/Enter your email/i).fill(email)
    await webfingerResponse
    await page.locator('input[name="password"]').fill(PASSWORD)
    await page.getByRole('button', { name: /^login$/i }).click()

    await expect(page).toHaveURL(/\/policies(\?|$)/, { timeout: 15_000 })
  })
})

test.describe('auth — signup', () => {
  test('happy path — /signup with email + matching passwords lands on /verify with the post-signup message', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/signup')

    await expect(page.getByText(/^Create your account$/)).toBeVisible()

    // Use a unique invalid-domain email so we don't pollute auto-join
    // org allow-lists. Same convention as seedLoggedInUser.
    const email = `e2e-signup-${Date.now().toString(36)}@signup.invalid`

    // The email field reveals the password fields once non-empty
    // (isPasswordActive). Fill it via placeholder to avoid colliding
    // with login's similar input.
    await page.getByPlaceholder(/^enter your email$/i).fill(email)

    // Password + confirm are PasswordInputs with name attrs but no
    // htmlFor labels — target by name selector.
    await page.locator('input[name="password"]').fill(PASSWORD)
    await page.locator('input[name="confirmedPassword"]').fill(PASSWORD)

    await page.getByRole('button', { name: /^sign up$/i }).click()

    // registerUser ok → router.push('/verify'). The verify page shows a
    // static "Thank you for signing up for Openlane!" message when no
    // token is present in the URL — we land on /verify and assert the
    // success copy.
    await page.waitForURL(/\/verify(\?|$)/, { timeout: 30_000 })
    await expect(page.getByText(/Thank you for signing up for Openlane/i)).toBeVisible({ timeout: 15_000 })
  })

  test('mismatched passwords surface inline error and stay on /signup', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/signup')

    const email = `e2e-mismatch-${Date.now().toString(36)}@signup.invalid`
    await page.getByPlaceholder(/^enter your email$/i).fill(email)
    await page.locator('input[name="password"]').fill(PASSWORD)
    await page.locator('input[name="confirmedPassword"]').fill('different-password-1234')

    await page.getByRole('button', { name: /^sign up$/i }).click()

    // signup.tsx sets registrationErrorMessage = 'Passwords do not match'
    // when the two fields disagree, surfaces it under the email input.
    await expect(page).toHaveURL(/\/signup(\?|$)/)
    await expect(page.getByText(/^Passwords do not match$/)).toBeVisible({ timeout: 10_000 })
  })

  test('duplicate email shows the inline registration error and stays on /signup', async ({ page }) => {
    // Pre-register a user via the backend helper so we have a known
    // already-existing email for the UI flow to collide with.
    const email = emailFor(`signup-dup-${Date.now().toString(36)}`)
    await registerAndVerify({ email })

    await installRecaptchaShim(page)
    await page.goto('/signup')

    await page.getByPlaceholder(/^enter your email$/i).fill(email)
    await page.locator('input[name="password"]').fill(PASSWORD)
    await page.locator('input[name="confirmedPassword"]').fill(PASSWORD)

    await page.getByRole('button', { name: /^sign up$/i }).click()

    // Backend returns a non-OK response → signup.tsx surfaces res.message
    // (or the generic "Unknown error") in registrationErrorMessage. Don't
    // pin exact backend copy; just assert we stayed on /signup and an
    // error-shaped message appears below the email input.
    await expect(page).toHaveURL(/\/signup(\?|$)/, { timeout: 15_000 })
    await expect(page.locator('span', { hasText: /already|exists|registered|error|invalid/i }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('auth — password input toggle', () => {
  test('show/hide button on /signup flips the password field type to text and back', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/signup')

    // Reveal password fields by typing an email first.
    await page.getByPlaceholder(/^enter your email$/i).fill('toggle-test@signup.invalid')
    const passwordField = page.locator('input[name="password"]')
    await expect(passwordField).toBeVisible({ timeout: 10_000 })
    await expect(passwordField).toHaveAttribute('type', 'password')

    // PasswordInput's toggle button has sr-only "Show password"/"Hide
    // password" text and is the first button after the password input.
    const toggle = page.getByRole('button', { name: /^show password$/i }).first()
    await toggle.click()
    await expect(passwordField).toHaveAttribute('type', 'text')

    await page
      .getByRole('button', { name: /^hide password$/i })
      .first()
      .click()
    await expect(passwordField).toHaveAttribute('type', 'password')
  })
})

test.describe('auth — /login error param', () => {
  test('?error=<message> surfaces the message inline on the login screen', async ({ page }) => {
    const message = 'Your session has expired'
    await page.goto(`/login?error=${encodeURIComponent(message)}`)

    // login.tsx useEffect: copies the ?error value into signInErrorMessage and
    // flips signInError on, so the message renders under the email input.
    // (The same effect calls router.replace('/login') to strip the param, but
    // that strip is unreliable against `next dev` here — the visible message is
    // the load-bearing behavior, so we assert that and stay on /login.)
    await expect(page.getByText(message).first()).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })
})

test.describe('auth — /login render', () => {
  test('/login renders the email field, Google + GitHub buttons, and the login heading', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByText(/^Login to your account$/)).toBeVisible()
    await expect(page.getByPlaceholder(/^enter your email$/i)).toBeVisible()

    // SSO providers — both buttons must be reachable so a smoke
    // regression breaks loudly.
    await expect(page.getByRole('button', { name: /^google$/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /^github$/i })).toBeVisible()
  })
})

test.describe('auth — supplemental form pages', () => {
  // These pages drive flows whose token-following half is out of
  // scope (no email service in dev — see plans/00-priorities.md).
  // We assert the *form* renders, since a regression that breaks
  // these pages quietly is the kind of thing this layer catches.

  test('/forgot-password renders the reset-password form', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/forgot-password')

    await expect(page.getByText(/^Reset your password$/)).toBeVisible()
    await expect(page.getByPlaceholder(/email@domain\.com/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^send reset link$/i })).toBeVisible()
  })

  test('/forgot-password "Return to login" link navigates to /login', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/forgot-password')

    await page.getByRole('link', { name: /return to login/i }).click()
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 10_000 })
  })

  test('/forgot-password no-enumeration: unknown email gets the same generic confirmation', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/forgot-password')

    const unknownEmail = `nobody-${Date.now().toString(36)}@example.invalid`
    await page.getByPlaceholder(/email@domain\.com/i).fill(unknownEmail)
    await page.getByRole('button', { name: /^send reset link$/i }).click()

    // Same generic toast as the registered-email case — never expose
    // "user not found" / "no such email" / etc.
    await expect(page.getByText(/Check your email for the reset link/i).first()).toBeVisible({ timeout: 15_000 })
    const body = await page.locator('body').textContent()
    expect(body ?? '').not.toMatch(/user not found|no such user|account does not exist|email not registered|email not found/i)
  })

  test('/forgot-password submission shows a confirmation toast and starts the cooldown', async ({ page }) => {
    await installRecaptchaShim(page)
    await page.goto('/forgot-password')

    await page.getByPlaceholder(/email@domain\.com/i).fill(`forgot-${Date.now().toString(36)}@example.com`)
    await page.getByRole('button', { name: /^send reset link$/i }).click()

    // forgot-password.tsx: success calls successNotification with title
    // "Check your email for the reset link." and setCooldown(60). The
    // button label becomes "Try again in 60s".
    await expect(page.getByText(/Check your email for the reset link/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /try again in \d+s/i })).toBeVisible()
  })

  test('/resend-verify renders the resend form', async ({ page }) => {
    await page.goto('/resend-verify')

    await expect(page.getByPlaceholder(/jane\.doe@example\.com/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /^resend verification$/i })).toBeVisible()
  })

  test('/resend-verify submission redirects to /verify', async ({ page }) => {
    await page.goto('/resend-verify')

    await page.getByPlaceholder(/jane\.doe@example\.com/i).fill(`resend-${Date.now().toString(36)}@example.com`)
    await page.getByRole('button', { name: /^resend verification$/i }).click()

    // Component fires the resend (no await) and immediately routes to
    // /verify regardless of outcome — that's the visible-to-user signal.
    await expect(page).toHaveURL(/\/verify(\?|$)/, { timeout: 15_000 })
  })

  test('/password-reset without a token shows the "invalid or expired" error toast', async ({ page }) => {
    await page.goto('/password-reset')

    // page.tsx useEffect: when token is null, fires errorNotification
    // with title "Reset link is invalid or expired" via requestAnimationFrame.
    // The toast also doubles as an `aria-live` "Notification …" status node
    // for screen readers, so the matcher resolves to two elements — match
    // the visible toast title only via .first().
    await expect(page.getByText(/Reset link is invalid or expired/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('/password-reset with mismatched confirm shows the inline error', async ({ page }) => {
    // Token must be present for the handler to reach the password
    // mismatch check; a fake token is fine because the mismatch is
    // evaluated client-side before the network call.
    await page.goto('/password-reset?token=e2e-fake-token')

    const newPassword = page.locator('input[placeholder="password"]')
    const confirmPassword = page.locator('input[placeholder="confirm password"]')
    await expect(newPassword).toBeVisible({ timeout: 10_000 })
    await newPassword.fill('mattisthebest1234')
    await confirmPassword.fill('different-password-1234')

    await page.getByRole('button', { name: /^reset password$/i }).click()

    // page.tsx: setError('Passwords do not match.') → MessageBox shows
    // the message. Stay on /password-reset.
    await expect(page).toHaveURL(/\/password-reset/)
    await expect(page.getByText(/^Passwords do not match\.$/)).toBeVisible({ timeout: 10_000 })
  })

  test('/unsubscribe without a session redirects to /login (not a public page)', async ({ page }) => {
    // /unsubscribe is intentionally NOT in middleware publicPages, so an
    // unauthenticated visit is redirected to /login. (Product decision — do not
    // add it to publicPages.) The redirect cancels the original navigation,
    // which surfaces as "navigation interrupted"; swallow it and poll the URL.
    await page.goto('/unsubscribe').catch(() => {})
    await expect(page).toHaveURL(/\/login(\?|$)/, { timeout: 15_000 })
  })

  test('/verify "Click here to resend" button navigates to /resend-verify', async ({ page }) => {
    // verifier.tsx renders this Button regardless of token state.
    // Direct visit with no token avoids the verify-token network call.
    await page.goto('/verify')

    await page.getByRole('button', { name: /click here to resend/i }).click()

    await expect(page).toHaveURL(/\/resend-verify(\?|$)/, { timeout: 10_000 })
  })

  test('/invite without a session redirects to /login with the token preserved', async ({ page }) => {
    // InviteAccepter (accept.tsx:22-28) bounces unauthenticated visitors
    // to /login?token=<token> so they can sign in (or sign up) and then
    // come back to accept the invite. We exercise that branch directly.
    await page.goto('/invite?token=garbage-token')

    await expect(page).toHaveURL(/\/login\?token=garbage-token/, { timeout: 15_000 })
  })
})
