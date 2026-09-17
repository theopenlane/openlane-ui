import { test, expect, readManifest } from '../fixtures/auth'

const requireDemoOrg = () => test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')

test.describe('trust-center — unconfigured org sees the deferred error fallback', () => {
  test('/trust-center/overview shows the "unexpected issue" error page', async ({ page }) => {
    await page.goto('/trust-center/overview')

    await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('trust-center — gating is route-wide across settings sub-routes', () => {
  for (const route of ['/trust-center/documents', '/trust-center/subprocessors', '/trust-center/branding']) {
    test(`${route} renders the unconfigured-org error fallback (not raw settings)`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /Back to Dashboard/i })).toBeVisible()
    })
  }
})

test.describe('trust-center — content routes are gated (no in-app TrustCenter creation)', () => {
  for (const route of ['/trust-center/customer-logos', '/trust-center/updates']) {
    test(`${route} renders the unconfigured-org error fallback`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /Back to Dashboard/i })).toBeVisible()
    })
  }

  test('the error fallback "Back to Dashboard" CTA navigates to /dashboard', async ({ page }) => {
    await page.goto('/trust-center/customer-logos', { waitUntil: 'domcontentloaded' })

    await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /Back to Dashboard/i }).click()
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 })
  })
})

test.describe('trust-center — subprocessor change notifications (#1948)', () => {
  test.use({ authProfile: 'demo' })

  test('the subprocessors page offers the subscriber-notification switch', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/subprocessors', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByText('Email subscribers when subprocessors change', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('switch').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('trust-center — recommended controls tab (ISS-1917)', () => {
  test.use({ authProfile: 'demo' })

  test('the controls page offers all four filter tabs with counts', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('tab', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 90_000 })
    for (const label of [/^Added \(\d+\)$/, /^Not Added \(\d+\)$/, /^Recommended \(\d+\)$/]) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible({ timeout: 30_000 })
    }
  })

  test('selecting Recommended activates that filter', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const recommended = page.getByRole('tab', { name: /^Recommended \(\d+\)$/ })
    await expect(recommended).toBeVisible({ timeout: 90_000 })
    await recommended.click()

    await expect(recommended).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^All \(\d+\)$/ })).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('trust-center — NDA requests table (#2058)', () => {
  test.use({ authProfile: 'demo' })

  test('the NDA requests table exposes its column menu', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/NDAs', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 30_000 })
  })
})
