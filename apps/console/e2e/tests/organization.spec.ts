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
