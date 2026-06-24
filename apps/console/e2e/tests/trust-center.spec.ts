import { test, expect } from '../fixtures/auth'

// Trust-center routes are wrapped by a layout component that calls
// useGetTrustCenter() and renders an ErrorPage when no TrustCenter
// row exists for the org. The shared Owner org has no trust center
// configured (nothing sets one up), so per the plan (trust-center.md
// note), full coverage is deferred.
//
// We still smoke-test that the layout renders the documented error
// fallback for unconfigured orgs — that catches breakage in the gating
// logic (a regression that silently rendered the children for
// unconfigured orgs would slip without this).
test.describe('trust-center — unconfigured org sees the deferred error fallback', () => {
  test('/trust-center/overview shows the "unexpected issue" error page', async ({ page }) => {
    await page.goto('/trust-center/overview')

    // ErrorPage renders the configured `title` prop in its body — match
    // the unique opening phrase to stay robust against punctuation.
    await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
  })
})

// The TrustCenter layout component gates *every* trust-center child route on
// the org having a configured TrustCenter row — not just /overview. The shared
// Owner org has none, so each documented settings sub-route (documents,
// subprocessors, branding) must render the SAME error fallback. This locks in
// the gating as route-wide: a regression that leaked children for one specific
// tab (e.g. only overview gated, settings tabs rendered raw) would slip past a
// single-route smoke test.
test.describe('trust-center — gating is route-wide across settings sub-routes', () => {
  for (const route of ['/trust-center/documents', '/trust-center/subprocessors', '/trust-center/branding']) {
    test(`${route} renders the unconfigured-org error fallback (not raw settings)`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' })

      // Same ErrorPage title prop the TrustCenter component renders when
      // `trustCenters.edges[0]` is absent. Plus its "Back to Dashboard" CTA.
      await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /Back to Dashboard/i })).toBeVisible()
    })
  }
})

// The customer-logos and updates feature surfaces (per the plan's content
// CRUD items) live under the SAME gated TrustCenter wrapper. For the shared
// Owner org (no TrustCenter row, no in-app way to create one) these routes are
// fully BLOCKED — the only assertable behaviour is the gating fallback, which
// we lock in here so the documented routes are explicitly covered rather than
// silently skipped. The CRUD items themselves (create/edit/delete logo, create/
// edit/delete update post) remain blocked pending a backend TrustCenter seeder.
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
