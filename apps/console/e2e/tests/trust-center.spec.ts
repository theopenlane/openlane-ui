import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

// Trust-center routes are wrapped by a layout component that calls
// useGetTrustCenter() and renders an ErrorPage when no TrustCenter
// row exists for the org. Fresh seedLoggedInUser orgs have no trust
// center configured, so per the plan (trust-center.md note), full
// coverage is deferred.
//
// We still smoke-test that the layout renders the documented error
// fallback for fresh orgs — that catches breakage in the gating logic
// (a regression that silently rendered the children for unconfigured
// orgs would slip without this).
test.describe('trust-center — fresh org sees the deferred error fallback', () => {
  test('/trust-center/overview shows the "unexpected issue" error page', async ({ page }) => {
    await seedLoggedInUser(page, 'tc-overview-deferred')

    await page.goto('/trust-center/overview')

    // ErrorPage renders the configured `title` prop in its body — match
    // the unique opening phrase to stay robust against punctuation.
    await expect(page.getByText(/We ran into an unexpected issue/i)).toBeVisible({ timeout: 15_000 })
  })
})
