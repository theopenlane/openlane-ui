import { test, expect, authFile, readManifest } from '../fixtures/auth'

/**
 * The org global-setup creates is deliberately empty, so its trust-center
 * routes are unprovisioned. These specs therefore run against the demo org
 * seeded by harmonize, which has a real trust center with data.
 *
 * They skip cleanly in environments without that seed.
 */
const requireDemoOrg = () => test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')

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

/**
 * #1948 — trust center subscribers. The /trust-center/subscribers page itself is
 * covered in new-routes.spec.ts; this pins the other half of the commit, the
 * subprocessors page's opt-in switch for notifying subscribers when
 * subprocessors change (notifySubscribersOnSubprocessorChange).
 *
 * Read-only: the switch is asserted but never toggled — flipping it would change
 * a real notification setting on the shared org.
 */
test.describe('trust-center — subprocessor change notifications (#1948)', () => {
  test.use({ storageState: authFile('demo') })

  test('the subprocessors page offers the subscriber-notification switch', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/subprocessors', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByText('Email subscribers when subprocessors change', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('switch').first()).toBeVisible({ timeout: 15_000 })
  })
})

/**
 * ISS-1917 — the trust center controls page gained a "Recommended" filter tab.
 * The recommendation used to come from a separate useGetMappedControls query
 * (OTS framework → approved target); it is now derived inline from each
 * control's own relatedControls, so the tab count comes from the already-loaded
 * list rather than a second round-trip.
 *
 * Read-only: tabs are switched but no control is added or published.
 */
test.describe('trust-center — recommended controls tab (ISS-1917)', () => {
  test.use({ storageState: authFile('demo') })

  test('the controls page offers all four filter tabs with counts', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    for (const label of [/^All \(\d+\)$/, /^Added \(\d+\)$/, /^Not Added \(\d+\)$/, /^Recommended \(\d+\)$/]) {
      await expect(page.getByRole('tab', { name: label })).toBeVisible({ timeout: 30_000 })
    }
  })

  test('selecting Recommended activates that filter', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const recommended = page.getByRole('tab', { name: /^Recommended \(\d+\)$/ })
    await expect(recommended).toBeVisible({ timeout: 30_000 })
    await recommended.click()

    await expect(recommended).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^All \(\d+\)$/ })).toHaveAttribute('aria-selected', 'false')
  })
})

/**
 * #2058 — the NDA requests table gained an "Approved By" column (rendered
 * through AuthorDisplay, so it resolves users / tokens / the support and
 * integration identities), shown alongside the approved/signed date columns.
 */
test.describe('trust-center — NDA requests table (#2058)', () => {
  test.use({ storageState: authFile('demo') })

  test('the NDA requests table exposes its column menu', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await page.goto('/trust-center/NDAs', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 30_000 })
  })
})
