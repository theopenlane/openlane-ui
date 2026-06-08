import type { Page } from '@playwright/test'

import { test, expect, authFile, readManifest, type Role } from '../fixtures/auth'

/**
 * Permission-gating sweep across roles, using the storage-state users seeded in
 * global-setup (Owner / Admin / Member / ReadOnly=AUDITOR, all in one shared org).
 * global-setup runs automatically (reused across runs; E2E_RESEED=1 to force).
 *
 * Grounded in the actual org-role permission sets the backend returns:
 *   - can_create_internal_policy / control / procedure: owner ✓ admin ✓ member ✗ readonly ✗
 * The app gates create pages behind <ProtectedArea/> ("…right meow") when the
 * user lacks the create permission, and renders the create form when they have it.
 */

// ProtectedArea copy — see components/shared/protected-area/protected-area.tsx
const PROTECTED = /protected area/i

// Create routes whose permission (CanCreate{InternalPolicy,Control,Procedure})
// only Owner and Admin hold in this org.
const CONTENT_CREATE_PAGES = [
  { area: 'policy', url: '/policies/create' },
  { area: 'procedure', url: '/procedures/create' },
  { area: 'control', url: '/controls/create-control' },
]

const CAN_CREATE_CONTENT: Role[] = ['owner', 'admin']
const CANNOT_CREATE_CONTENT: Role[] = ['member', 'readonly']

for (const role of CANNOT_CREATE_CONTENT) {
  test.describe(`permissions — ${role} cannot create content`, () => {
    test.use({ storageState: authFile(role) })

    for (const { area, url } of CONTENT_CREATE_PAGES) {
      test(`${role} is blocked from the ${area} create page`, async ({ page }) => {
        // domcontentloaded (not the default 'load') — heavy create routes pull
        // large bundles the dev server compiles on first hit; we only need the
        // client render to start, then poll for the protected-area copy.
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        await expect(page.getByText(PROTECTED)).toBeVisible({ timeout: 20_000 })
      })
    }
  })
}

for (const role of CAN_CREATE_CONTENT) {
  test.describe(`permissions — ${role} can create content`, () => {
    test.use({ storageState: authFile(role) })

    for (const { area, url } of CONTENT_CREATE_PAGES) {
      test(`${role} sees the ${area} create form, not the protected page`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        // The create form renders a submit button; the protected page does not.
        await expect(page.locator('form button[type="submit"]').first()).toBeVisible({ timeout: 20_000 })
        await expect(page.getByText(PROTECTED)).toHaveCount(0)
      })
    }
  })
}

// Evidence create is gated by can_create_evidence, which Owner, Admin AND
// ReadOnly(AUDITOR) hold — but Member does not. This documents that AUDITOR is
// NOT blanket read-only; it can submit evidence.
const submitEvidence = (page: Page) => page.getByRole('button', { name: /^submit evidence$/i })
const evidenceHeading = (page: Page) => page.getByRole('heading', { name: /^Evidence Center$/ })

for (const role of ['owner', 'admin', 'readonly'] as Role[]) {
  test.describe(`permissions — ${role} can submit evidence`, () => {
    test.use({ storageState: authFile(role) })

    test(`${role} sees the Submit Evidence CTA on /evidence`, async ({ page }) => {
      await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
      // The CTA's own visibility is the signal — no separate shell gate.
      await expect(submitEvidence(page)).toBeVisible({ timeout: 30_000 })
    })
  })
}

test.describe('permissions — member cannot submit evidence', () => {
  test.use({ storageState: authFile('member') })

  test('member does not see the Submit Evidence CTA on /evidence', async ({ page }) => {
    await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
    // Gate the absence assertion on the page's own heading so it can't pass
    // against a blank/half-rendered page.
    await expect(evidenceHeading(page)).toBeVisible({ timeout: 30_000 })
    await expect(submitEvidence(page)).toHaveCount(0)
  })
})

// Member-management row actions (change role / remove). The dropdown returns
// null unless the viewer can edit that member — see member-actions.tsx. This is
// a per-target right, not the viewer's global can_edit: only the Owner reliably
// holds it for the other seeded members (Admin does NOT in this org's role
// config), so the meaningful gate is Owner (can) vs Member/ReadOnly (cannot).
const membersHeading = (page: Page) => page.getByRole('heading', { name: /^Members$/ })
const memberActions = (page: Page) => page.getByTestId('member-actions-trigger')

test.describe('permissions — owner can manage members', () => {
  test.use({ storageState: authFile('owner') })

  test('owner sees member row actions on /user-management/members', async ({ page }) => {
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await expect(membersHeading(page)).toBeVisible({ timeout: 30_000 })
    await expect(memberActions(page).first()).toBeVisible({ timeout: 20_000 })
  })
})

for (const role of ['member', 'readonly'] as Role[]) {
  test.describe(`permissions — ${role} cannot manage members`, () => {
    test.use({ storageState: authFile(role) })

    test(`${role} sees no member row actions on /user-management/members`, async ({ page }) => {
      await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
      await expect(membersHeading(page)).toBeVisible({ timeout: 30_000 })
      await expect(memberActions(page)).toHaveCount(0)
    })
  })
}

// Edit gating on a detail page. The header Edit button (aria-label="Edit
// control") is gated by can_edit — Owner holds it, the others don't. Tested as a
// contrast on the SAME seeded control (global-setup's manifest.sharedControlId).
// Note: org-level can_view_control is NOT enough to load an owner-created
// control — per-object FGA restricts it — so non-owners get no Edit affordance
// because they can't operate on the control at all. The absence check is gated
// on the app shell so it can't pass against a blank page.
const editControlButton = (page: Page) => page.getByRole('button', { name: 'Edit control' })

for (const role of ['member', 'readonly'] as Role[]) {
  test.describe(`permissions — ${role} has no Edit affordance on a control`, () => {
    test.use({ storageState: authFile(role) })

    test(`${role} sees no Edit button on the control detail`, async ({ page }) => {
      const { sharedControlId } = readManifest()
      await page.goto(`/controls/${sharedControlId}`, { waitUntil: 'domcontentloaded' })
      await expect(page).toHaveURL(new RegExp(sharedControlId))
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
      await expect(editControlButton(page)).toHaveCount(0)
    })
  })
}

test.describe('permissions — owner can edit a control', () => {
  test.use({ storageState: authFile('owner') })

  test('owner sees the Edit button on the control detail', async ({ page }) => {
    const { sharedControlId } = readManifest()
    await page.goto(`/controls/${sharedControlId}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 30_000 })
  })
})

// Delete gating: the "Delete" item lives behind the control's "…" actions menu,
// gated by can_delete (control-header-actions.tsx). Owner can reach it; member +
// readonly get no actions menu at all (they can't operate on the control).
const controlActionsMenu = (page: Page) => page.getByTestId('control-actions-menu')

test.describe('permissions — owner can delete a control', () => {
  test.use({ storageState: authFile('owner') })

  test('owner can reach the Delete action via the control actions menu', async ({ page }) => {
    const { sharedControlId } = readManifest()
    await page.goto(`/controls/${sharedControlId}`, { waitUntil: 'domcontentloaded' })
    await expect(editControlButton(page)).toBeVisible({ timeout: 30_000 })
    await controlActionsMenu(page).click()
    await expect(page.getByTestId('control-delete-button')).toBeVisible({ timeout: 10_000 })
  })
})

for (const role of ['member', 'readonly'] as Role[]) {
  test.describe(`permissions — ${role} has no Delete affordance on a control`, () => {
    test.use({ storageState: authFile(role) })

    test(`${role} sees no control actions menu`, async ({ page }) => {
      const { sharedControlId } = readManifest()
      await page.goto(`/controls/${sharedControlId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
      await expect(controlActionsMenu(page)).toHaveCount(0)
    })
  })
}
