import type { Page } from '@playwright/test'

import { test, expect, readManifest, type Role } from '../fixtures/auth'
import { loginViaApi, createInternalPolicy, createProcedure, createRisk, createEvidence, createControl, createProgram } from '../utils/api'

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
    test.use({ authProfile: role })

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
    test.use({ authProfile: role })

    for (const { area, url } of CONTENT_CREATE_PAGES) {
      test(`${role} sees the ${area} create form, not the protected page`, async ({ page }) => {
        await page.goto(url, { waitUntil: 'domcontentloaded' })
        // The create form renders a submit button; the protected page does not.
        await expect(page.locator('form button[type="submit"]').first()).toBeVisible({ timeout: 60_000 })
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
    test.use({ authProfile: role })

    test(`${role} sees the Submit Evidence CTA on /evidence`, async ({ page }) => {
      await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
      // The CTA's own visibility is the signal — no separate shell gate.
      await expect(submitEvidence(page)).toBeVisible({ timeout: 30_000 })
    })
  })
}

test.describe('permissions — member cannot submit evidence', () => {
  test.use({ authProfile: 'member' })

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
  test.use({ authProfile: 'owner' })

  test('owner sees member row actions on /user-management/members', async ({ page }) => {
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await expect(membersHeading(page)).toBeVisible({ timeout: 60_000 })
    await expect(memberActions(page).first()).toBeVisible({ timeout: 20_000 })
  })
})

for (const role of ['member', 'readonly'] as Role[]) {
  test.describe(`permissions — ${role} cannot manage members`, () => {
    test.use({ authProfile: role })

    test(`${role} sees no member row actions on /user-management/members`, async ({ page }) => {
      await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
      await expect(membersHeading(page)).toBeVisible({ timeout: 60_000 })
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
    test.use({ authProfile: role })

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
  test.use({ authProfile: 'owner' })

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
  test.use({ authProfile: 'owner' })

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
    test.use({ authProfile: role })

    test(`${role} sees no control actions menu`, async ({ page }) => {
      const { sharedControlId } = readManifest()
      await page.goto(`/controls/${sharedControlId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
      await expect(controlActionsMenu(page)).toHaveCount(0)
    })
  })
}

// ── Policy / procedure detail edit+delete gating (mirrors the control gating
// above). The "…" actions menu (Edit / Delete / Manage Permissions) is gated by
// can_edit / can_delete: Owner reaches it on an owner-created entity; member +
// readonly get no actions menu (per-object FGA + lacking the rights).
// Scoped in its own describe so the seeding beforeAll runs only for these tests
// (not before the pre-existing create/member/control gating above).
test.describe('permissions — detail edit/delete gating', () => {
  let sharedPolicyId: string
  let sharedProcedureId: string
  let sharedRiskId: string

  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    const api = await loginViaApi(ownerEmail, password)
    sharedPolicyId = await createInternalPolicy(api, `E2E PermPol ${Date.now().toString(36)}`)
    sharedProcedureId = await createProcedure(api, `E2E PermProc ${Date.now().toString(36)}`)
    sharedRiskId = await createRisk(api, `E2E PermRisk ${Date.now().toString(36)}`)
  })

  // view() defers reading the id until test time (set in beforeAll).
  const DETAIL_GATES = [
    { entity: 'policy', menu: 'policy-actions-menu', view: () => `/policies/${sharedPolicyId}/view` },
    { entity: 'procedure', menu: 'procedure-actions-menu', view: () => `/procedures/${sharedProcedureId}/view` },
    { entity: 'risk', menu: 'risk-actions-menu', view: () => `/exposure/risks/${sharedRiskId}` },
  ]

  for (const { entity, menu, view } of DETAIL_GATES) {
    test.describe(`owner can edit/delete a ${entity}`, () => {
      test.use({ authProfile: 'owner' })

      test(`owner sees the ${entity} actions menu`, async ({ page }) => {
        await page.goto(view(), { waitUntil: 'domcontentloaded' })
        await expect(page.getByTestId(menu)).toBeVisible({ timeout: 30_000 })
      })
    })

    for (const role of ['member', 'readonly'] as Role[]) {
      test.describe(`${role} has no edit/delete affordance on a ${entity}`, () => {
        test.use({ authProfile: role })

        test(`${role} sees no ${entity} actions menu`, async ({ page }) => {
          await page.goto(view(), { waitUntil: 'domcontentloaded' })
          await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 20_000 })
          await expect(page.getByTestId(menu)).toHaveCount(0)
        })
      })
    }
  }
})

/**
 * ISS-2413 — the standards detail "Add Controls" affordance (and the accordion's
 * row-select checkboxes) moved from a generic `canEdit(roles)` gate to
 * `hasPermission(roles, CanCreateControl)`. Importing controls into the org is a
 * create, not an edit, so edit-only roles must no longer see it.
 *
 * In this org CanCreateControl is held by owner + admin only, matching the
 * /controls/create-control gate above.
 */
test.describe('permissions — standards control import (ISS-2413)', () => {
  // The catalog is backend-seeded and standards.spec.ts asserts against it, so a
  // missing card is a failure, not a reason to skip. This used to call
  // `isVisible()` — which does NOT auto-wait — on a page that had only just
  // reached domcontentloaded, so it reported "no standards" on every cold load
  // and silently skipped all four gating tests.
  const gotoFirstStandard = async (page: Page): Promise<void> => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const first = page.locator('a[href^="standards/"]').first()
    await expect(first).toBeVisible({ timeout: 30_000 })
    const href = await first.getAttribute('href')
    expect(href).toBeTruthy()
    await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  }

  for (const role of ['owner', 'admin'] as Role[]) {
    test.describe(`${role} can import controls from a standard`, () => {
      test.use({ authProfile: role })

      test(`${role} sees the Add Controls button`, async ({ page }) => {
        test.slow()
        await gotoFirstStandard(page)

        await expect(page.getByRole('button', { name: /^Add Controls/ })).toBeVisible({ timeout: 30_000 })
      })
    })
  }

  for (const role of ['member', 'readonly'] as Role[]) {
    test.describe(`${role} cannot import controls from a standard`, () => {
      test.use({ authProfile: role })

      test(`${role} sees no Add Controls button`, async ({ page }) => {
        test.slow()
        await gotoFirstStandard(page)

        // Wait for the authenticated shell so the absence is a real assertion
        // rather than a race against hydration.
        await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })
        await expect(page.getByRole('button', { name: /^Add Controls/ })).toHaveCount(0)
      })
    })
  }
})

/**
 * #1941 — auditors get a reduced sidebar. routes/dashboard.tsx hides whole
 * sections behind `isAuditor` (Trust Center, Automation, Organization Settings,
 * User Management, Developers) and reveals the Auditor Dashboard entry, which is
 * hidden for everyone else (`hidden: !isAuditor`).
 *
 * sidebar-nav.tsx filters hidden items out of the DOM entirely, so asserting on
 * link hrefs works whether the rail is collapsed or expanded.
 *
 * The e2e "readonly" fixture is seeded with the backend AUDITOR role
 * (global-setup ROLE_MAP), so it is the auditor under test.
 */
const AUDITOR_HIDDEN_NAV = [
  { section: 'Trust Center', href: '/trust-center/overview' },
  { section: 'Automation', href: '/automation/tasks' },
  { section: 'Organization Settings', href: '/organization-settings/general-settings' },
  { section: 'User Management', href: '/user-management/members' },
  { section: 'Developers', href: '/developers/api-tokens' },
]

test.describe('permissions — auditor sidebar (#1941)', () => {
  test.describe('auditor', () => {
    test.use({ authProfile: 'readonly' })

    test('auditor sees the Auditor Dashboard nav entry', async ({ page }) => {
      test.slow()
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

      await expect(page.locator('a[href="/auditor-dashboard"]').first()).toBeAttached({ timeout: 20_000 })
    })

    for (const { section, href } of AUDITOR_HIDDEN_NAV) {
      test(`auditor sees no ${section} nav entry`, async ({ page }) => {
        test.slow()
        await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
        await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

        await expect(page.locator(`a[href="${href}"]`)).toHaveCount(0)
      })
    }
  })

  test.describe('owner', () => {
    test.use({ authProfile: 'owner' })

    test('owner does NOT see the Auditor Dashboard nav entry', async ({ page }) => {
      test.slow()
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

      // hidden: !isAuditor — the entry is auditor-only.
      await expect(page.locator('a[href="/auditor-dashboard"]')).toHaveCount(0)
    })

    test('owner keeps the sections the auditor loses', async ({ page }) => {
      test.slow()
      // The sidebar is accordion-style — only the active section's children are
      // in the DOM — so reach each section by visiting one of its pages. An
      // owner lands on the page itself; the auditor assertions above prove the
      // nav entries are gone for them.
      await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 30_000 })

      await page.goto('/automation/tasks', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: /^Tasks$/ })).toBeVisible({ timeout: 30_000 })
    })
  })
})

/**
 * #1941 also introduced CanCreateReview and a `createPermission` override on the
 * shared crud-base toolbar: the Create button is normally gated on canEdit, but
 * a page can name a specific create permission instead. Reviews use it so an
 * auditor — who cannot edit most things — can still raise a review.
 */
test.describe('permissions — auditor can create reviews (#1941)', () => {
  test.describe('auditor', () => {
    test.use({ authProfile: 'readonly' })

    test('auditor sees the Create button on /exposure/reviews', async ({ page }) => {
      test.slow()
      await page.goto('/exposure/reviews', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: /^Reviews$/ })).toBeVisible({ timeout: 30_000 })

      await expect(
        page
          .getByRole('main')
          .getByRole('button', { name: /^create$/i })
          .first(),
      ).toBeVisible({ timeout: 20_000 })
    })
  })
})

/**
 * ISS-2452 — auditors need to edit evidence detail even though they hold no
 * general edit permission: evidence-details-sheet.tsx computes
 * `editAllowed = canEdit(roles, session) || isAuditor`. The affordance is the
 * "Edit evidence" pencil in evidence-detail-header.tsx, rendered only when
 * editAllowed.
 *
 * The sheet opens from ?id=<evidenceId> (sheet-navigation-provider), so it can
 * be reached directly without clicking a row.
 */
test.describe('permissions — auditor can edit evidence (ISS-2452)', () => {
  let evidenceId: string

  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    const owner = await loginViaApi(ownerEmail, password)
    evidenceId = await createEvidence(owner, `E2E AuditEv ${Date.now().toString(36)}`)
  })

  test.describe('auditor', () => {
    test.use({ authProfile: 'readonly' })

    test('auditor sees the Edit evidence action in the detail sheet', async ({ page }) => {
      test.slow()
      await page.goto(`/evidence?id=${evidenceId}`, { waitUntil: 'domcontentloaded' })

      const sheet = page.getByRole('dialog')
      await expect(sheet).toBeVisible({ timeout: 30_000 })
      await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toBeVisible({ timeout: 20_000 })
    })
  })

  test.describe('member', () => {
    test.use({ authProfile: 'member' })

    test('member sees no Edit evidence action', async ({ page }) => {
      test.slow()
      await page.goto(`/evidence?id=${evidenceId}`, { waitUntil: 'domcontentloaded' })

      // Members hold neither edit permission nor the auditor exemption, so the
      // pencil must stay hidden — this is what keeps the `|| isAuditor` from
      // being a blanket bypass.
      const sheet = page.getByRole('dialog')
      await expect(sheet).toBeVisible({ timeout: 30_000 })
      await expect(sheet.getByRole('button', { name: 'Edit evidence' })).toHaveCount(0)
    })
  })
})

/**
 * ISS-2430 / ISS-2431 — auditor-specific evidence and review UI:
 *
 *  - evidence table columns.tsx appends an auditor-only "Actions" column with
 *    Approve / Request changes buttons per row
 *  - evidence-table-toolbar.tsx adds auditor-only bulk Approve / Request changes
 *    once rows are selected
 *  - controls quick-actions.tsx adds a "Review" entry that opens the new
 *    CreateControlReviewSheet ("Create Review")
 *
 * All three are gated on useIsAuditor, so each is asserted present for the
 * auditor and absent for the owner. Nothing is approved or submitted — opening
 * the sheet is as far as these go.
 */
test.describe('permissions — auditor evidence + review UI (ISS-2430/2431)', () => {
  let auditControlId: string

  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    const owner = await loginViaApi(ownerEmail, password)
    await createEvidence(owner, `E2E AuditCols ${Date.now().toString(36)}`)
    auditControlId = await createControl(owner, `E2E-AUDITREV-${Date.now().toString(36)}`)
  })

  test.describe('auditor', () => {
    test.use({ authProfile: 'readonly' })

    test('auditor sees the per-row Approve action on the evidence table', async ({ page }) => {
      test.slow()
      await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 1, name: /^Evidence Center$/ })).toBeVisible({ timeout: 30_000 })

      // columns.tsx pushes an auditor-only "Actions" column holding Approve.
      await expect(page.getByRole('button', { name: /^Approve$/ }).first()).toBeVisible({ timeout: 30_000 })
    })

    test('auditor sees the Review quick action on a control, opening the Create Review sheet', async ({ page }) => {
      test.slow()
      await page.goto(`/controls/${auditControlId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

      const review = page.getByRole('button', { name: 'Review' })
      await expect(review).toBeVisible({ timeout: 30_000 })
      await review.click()

      // create-control-review-sheet.tsx SheetHeader. Opened only — never saved.
      await expect(page.getByText('Create Review', { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    })
  })

  test.describe('owner', () => {
    test.use({ authProfile: 'owner' })

    test('owner sees no per-row Approve action on the evidence table', async ({ page }) => {
      test.slow()
      await page.goto('/evidence', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 1, name: /^Evidence Center$/ })).toBeVisible({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /^Columns$/ })).toBeVisible({ timeout: 30_000 })

      await expect(page.getByRole('button', { name: /^Approve$/ })).toHaveCount(0)
    })

    test('owner sees no Create Review quick action on a control', async ({ page }) => {
      test.slow()
      await page.goto(`/controls/${auditControlId}`, { waitUntil: 'domcontentloaded' })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })
      await expect(page.getByRole('button', { name: /^Edit$/ }).first()).toBeVisible({ timeout: 45_000 })

      await expect(page.getByText('Create Review', { exact: true })).toHaveCount(0)
    })
  })
})

/**
 * ISS-2433 — the Auditor Dashboard. new-routes.spec.ts covers that the route
 * renders at all; this asserts its actual content, which only an auditor sees
 * (the nav entry is `hidden: !isAuditor`).
 *
 * auditor-stat-cards.tsx renders seven labelled cards and
 * auditor-dashboard/table/columns.tsx renders the per-control roll-up columns
 * whose priority logic is unit-tested in utils/control-status.test.ts.
 */
test.describe('permissions — auditor dashboard content (ISS-2433)', () => {
  test.describe('auditor', () => {
    test.use({ authProfile: 'readonly' })

    test('the dashboard renders its audit stat cards', async ({ page }) => {
      test.slow()
      await page.goto('/auditor-dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

      // With no program selectable the page short-circuits to an empty state, so
      // accept either branch and only assert the cards when they are rendered.
      const emptyState = page.getByText('No programs available yet.', { exact: true })
      const auditPeriod = page.getByText('Audit Period', { exact: true })
      await expect(emptyState.or(auditPeriod).first()).toBeVisible({ timeout: 30_000 })
      test.skip(await emptyState.isVisible().catch(() => false), 'org has no programs — auditor dashboard shows its empty state')

      for (const label of ['Audit Period', 'Audit Firm', 'Lead Auditor', 'Controls in Scope', 'Evidence Ready', 'Reviews Completed', 'In Progress']) {
        await expect(page.getByText(label, { exact: true })).toBeVisible({ timeout: 15_000 })
      }
    })

    test('the controls table exposes the per-control roll-up columns', async ({ page }) => {
      test.slow()
      await page.goto('/auditor-dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

      const emptyState = page.getByText('No programs available yet.', { exact: true })
      const evidenceStatus = page.getByText('Evidence Status', { exact: true })
      await expect(emptyState.or(evidenceStatus).first()).toBeVisible({ timeout: 30_000 })
      test.skip(await emptyState.isVisible().catch(() => false), 'org has no programs — auditor dashboard shows its empty state')

      await expect(evidenceStatus).toBeVisible({ timeout: 20_000 })
      await expect(page.getByText('Review Status', { exact: true })).toBeVisible()
      await expect(page.getByText('Last Reviewed', { exact: true })).toBeVisible()
    })
  })
})

/**
 * ISS-2637 — the auditor dashboard controls table gained an "Export Controls"
 * button that exports the currently-filtered set as CSV using a fixed field list
 * (AUDITOR_CONTROL_EXPORT_FIELDS). It is disabled while an export is in flight
 * or when the table is empty.
 *
 * Asserted but never clicked: an export queues a real job on the org.
 */
test.describe('permissions — auditor dashboard export (ISS-2637)', () => {
  // The auditor dashboard renders its empty state until the org has a program,
  // and the export button only exists in the populated branch. Seeding one here
  // keeps the test from depending on programs.spec.ts having run first — a
  // cross-spec dependency that made it SKIP (not fail) whenever this file was
  // run on its own.
  test.beforeAll(async () => {
    const { ownerEmail, password } = readManifest()
    const owner = await loginViaApi(ownerEmail, password)
    await createProgram(owner, `E2E AuditorExport ${Date.now().toString(36)}`)
  })

  test.describe('auditor', () => {
    test.use({ authProfile: 'readonly' })

    test('the controls table offers Export Controls alongside the evidence actions', async ({ page }) => {
      test.slow()
      await page.goto('/auditor-dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

      const emptyState = page.getByText('No programs available yet.', { exact: true })
      const exportControls = page.getByRole('button', { name: /^Export Controls$/ })
      await expect(emptyState.or(exportControls).first()).toBeVisible({ timeout: 30_000 })
      test.skip(await emptyState.isVisible().catch(() => false), 'org has no programs — auditor dashboard shows its empty state')

      await expect(exportControls).toBeVisible({ timeout: 20_000 })
      await expect(page.getByRole('button', { name: /^Bulk Evidence Request$/ }).first()).toBeVisible()
    })
  })
})

/**
 * ISS-2713 — support (impersonation) sessions must not act on org membership:
 * useOrgMemberPermissions short-circuits to all-false for an impersonation
 * session, hiding invite and member-management affordances regardless of the
 * roles the impersonated org would otherwise grant.
 *
 * A real support session is out of reach here, so this pins the other side —
 * an ordinary owner DOES see those affordances — which is what keeps the
 * short-circuit from being applied to everyone.
 */
test.describe('permissions — member management affordances (ISS-2713)', () => {
  test.describe('owner', () => {
    test.use({ authProfile: 'owner' })

    test('owner sees the invite affordance on the members page', async ({ page }) => {
      test.slow()
      await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 30_000 })

      await expect(page.getByRole('button', { name: /^invite member$/i })).toBeVisible({ timeout: 20_000 })
    })
  })

  for (const role of ['member', 'readonly'] as Role[]) {
    test.describe(`${role}`, () => {
      test.use({ authProfile: role })

      test(`${role} sees no invite affordance`, async ({ page }) => {
        test.slow()
        await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
        await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

        await expect(page.getByRole('button', { name: /^invite member$/i })).toHaveCount(0)
      })
    })
  }
})
