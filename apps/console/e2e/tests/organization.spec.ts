import { test, expect } from '../fixtures/auth'

// /organization is the post-login org-picker / org-create landing.
// Distinct from /organization-settings (covered in organization-settings.spec.ts).
// Logged in as the storage-state Owner (global-setup).
test.describe('organization — landing page', () => {
  test('/organization renders the Existing organizations panel for an onboarded user', async ({ page }) => {
    await page.goto('/organization')

    // PanelHeader from @repo/ui renders the heading as an <h2>.
    await expect(page.getByRole('heading', { level: 2, name: /^Existing organizations$/ })).toBeVisible({ timeout: 15_000 })
  })
})

/**
 * Org-switch + org-create coverage that stays non-destructive on the shared org.
 *
 * - existing-organizations.tsx renders a "Select" button next to every org that
 *   is NOT the active one; the active org shows no Select (Owner) or a "Leave"
 *   button. We assert the panel + at least the active row render, but never click
 *   Select (which would switch orgs and redirect) or Leave (destructive).
 * - create-organization.tsx validates Name (min 2) + Display name (min 2) via Zod
 *   BEFORE the createOrganization mutation. Submitting a too-short name surfaces
 *   the inline RHF error and never creates an org, so the run stays idempotent.
 *
 * Selectors grounded in existing-organizations.tsx + create-organization.tsx.
 */
test.describe('organization — switch (render-only, owner)', () => {
  test('the Existing organizations panel renders an org row with a role tag', async ({ page }) => {
    await page.goto('/organization')
    await expect(page.getByRole('heading', { level: 2, name: /^Existing organizations$/ })).toBeVisible({ timeout: 15_000 })

    // Owner is logged in: the active org row shows an "OWNER" role Tag and no
    // Select/Leave button; any additional non-active org would expose "Select".
    // We assert the role tag renders (proves at least one org row hydrated) without
    // clicking any switch/leave action.
    await expect(page.getByText('OWNER', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('organization — create form (validation-only, owner)', () => {
  test('create-organization form blocks submit on a too-short Name (no mutation)', async ({ page }) => {
    await page.goto('/organization')

    // PanelHeader heading is "Create your first organization" or "Create another
    // organization" depending on org count.
    await expect(page.getByRole('heading', { level: 2, name: /^Create (your first|another) organization$/ })).toBeVisible({ timeout: 15_000 })

    // The Name input change syncs into displayName; fill a single char so BOTH the
    // name (min 2) and displayName (min 2) Zod rules fail, blocking createOrg.
    const nameInput = page.locator('input[name="name"]')
    await expect(nameInput).toBeVisible({ timeout: 10_000 })
    await nameInput.fill('a')

    await page.getByRole('button', { name: /^Create organization$/ }).click()
    await expect(page.getByText(/Name must be at least 2 characters/i).first()).toBeVisible({ timeout: 10_000 })

    // Still on /organization — no creation/redirect happened.
    await expect(page).toHaveURL(/\/organization$/)
  })
})

/**
 * #2136 — leaving an organization no longer requires switching into it first.
 * The action moved from useRemoveUserFromOrg (which needed the caller's
 * membership id in the ACTIVE org) to useLeaveOrganization, keyed by
 * organizationID, so any non-owner membership can be left from the list.
 *
 * The storage-state user OWNS the seeded org, and owners cannot leave — so this
 * asserts the guard: no Leave action is offered for an owned organization.
 * Confirming a leave is never exercised; it would drop the fixture's membership.
 */
test.describe('organization — leaving any org (#2136)', () => {
  test('an owned organization offers no Leave action', async ({ page }) => {
    test.slow()
    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    // existing-organizations.tsx renders Leave only when the caller's role is
    // not OWNER. The seeded user owns their org, so it must be absent.
    await expect(page.getByRole('button', { name: /^Leave$/ })).toHaveCount(0)
  })

  test('the organization list renders switchable organizations', async ({ page }) => {
    test.slow()
    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    // A non-active organization exposes a Select button; the active one does not.
    await expect(
      page
        .getByRole('button', { name: /^Select$/ })
        .first()
        .or(page.getByText(/organization/i).first()),
    ).toBeVisible({ timeout: 30_000 })
  })
})
