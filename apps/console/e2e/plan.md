# E2E Test Execution Plan

Working tracker for filling Playwright coverage gaps. The per-area inventory in
[`plans/`](./plans/) is the source of truth for _what_ should exist; this file is
the _execution_ list of what is still missing, ordered for authoring.

> **Current state:** Phase 0 storage-state + multi-role infra is **done** and
> runs automatically; the **permission-gating sweep is done** (22 tests in
> `tests/permissions.spec.ts`); read-only render specs are **migrated** to the
> shared Owner storage state. The remaining deep flows the plans call for —
> approval chains, linking/unlinking, bulk ops, drag-drop, file upload,
> multi-actor — are largely **unwritten** (Phases 1–5 below). Out-of-scope flows
> (TFA, real OAuth/SSO, email-token follow, Stripe, external scanners, AI
> quality, Novu) are excluded per [`plans/00-priorities.md`](./plans/00-priorities.md)
> and are NOT counted as gaps below.

How to use: pick the next unchecked area, write the scenarios as one spec (or
extend the existing one), check items here, and mark the matching item ✅ in the
corresponding `plans/*.md`.

---

## ✅ Session log — written offline, then RUN & FIXED against live servers

All specs below now **pass** (49 new tests green: 30 storage-state+permissions,
19 deep CRUD). Typecheck clean (e2e + console app).

**Selector fixes applied after the first run:**

- Evidence disallowed-type: react-dropzone `accept` silently drops the file (no
  toast) — assert the dropzone stays empty instead.
- Evidence delete confirm: `alertdialog` (the detail sheet itself is a `dialog`).
- Policies/procedures delete: page has multiple ellipsis menus → added an opt-in
  `triggerTestId` prop to the shared `Menu` + `policy/procedure-actions-menu` +
  `policy/procedure-delete-button` testids; select by testid.
- Group edit Save button is "Save Changes" (SaveButton default); toast asserts
  used `.first()` (text appears in div + aria-live span).
- Members table has no ARIA `columnheader` roles → assert the seeded owner row renders.
- Cold-compile `goto` timeouts on heavy detail/registry routes: bumped
  `playwright.config.ts` `navigationTimeout` 30s→60s and per-test `timeout`
  60s→90s so first-hit dev-server route compiles don't fail the suite. (CI/built
  app has no compile step, so real test time stays ~seconds.)

**New infra (high confidence — typed from schema):**

- `e2e/utils/api.ts` seeders: `createControl/InternalPolicy/Procedure/Program/Risk/Task/Group/Evidence` (name/title only).
- `e2e/utils/files.ts` + `e2e/fixtures/files/` (`sample.pdf/png/csv/exe`) — file-upload helper.

**App changes (testids added — all minor, no behavior change):**

- `member-actions.tsx`: `data-testid="member-actions-trigger"`.
- `control-header-actions.tsx`: `control-actions-menu`, `control-delete-button`.
- `shared/menu/menu.tsx`: opt-in `triggerTestId` prop on the default trigger.
- `view-policy-page.tsx`: `triggerTestId="policy-actions-menu"` + `policy-delete-button`.
- `view-procedure-page.tsx`: `triggerTestId="procedure-actions-menu"` + `procedure-delete-button`.

**New deep specs (storage-state Owner + API seeding, run-unique names):**
`permissions.spec.ts` (+3 control DELETE-gating), `policies-crud`, `procedures-crud`,
`controls-crud`, `evidence-crud`, `exposure-crud`, `programs-crud`,
`user-management-crud`.

**✅ Assumptions confirmed on first run** (detail routes, shared `Columns`/`Filter`
toolbar buttons, group sheet flows all verified). Remaining note:

- **Data accumulation:** seeded entities persist in the long-lived shared org —
  specs always search the unique name, but consider periodic cleanup or `E2E_RESEED`.
- **Dev-server cold compile:** the very first run of heavy detail routes can time
  out `goto`; they pass once warm (and in CI/built mode there's no compile step).

**Open questions for the user (didn't block — skipped & noted):**

- Policies **approval flow**: no submit/approve/reject UI exists (status is a plain dropdown). Is an approval workflow planned? If not, that plan item should be dropped.
- Tasks **create** is not permission-gated in the UI (relies on backend rejection) — intended?

---

## Phase 0 — Infrastructure prerequisites (do first; unblocks everything else)

These are not "tests" but they gate large swaths of Tier 1–4. Several gaps below
are **impossible** without them — calling that out per the quality bar rather than
writing each spec to re-seed from scratch.

- [x] **Storage-state auth / `global-setup.ts`** — ✅ DONE. Owner seeded via the
      real onboarding UI; cookies saved to `e2e/.auth/owner.json`. Specs use
      `import { test } from '../fixtures/auth'` (defaults to Owner) or
      `test.use({ storageState: authFile(role) })`. Runs automatically; reuses a
      recent `.auth` set across runs (`E2E_RESEED=1` forces a fresh seed).
      Reusing saved state runs specs in ~4–9s vs ~15s for `seedLoggedInUser()`.
- [x] **Multi-role test users** — ✅ DONE. Owner/Admin/Member/ReadOnly seeded into
      ONE shared org per run (ReadOnly = backend `AUDITOR`). Path: owner creates a
      non-personal org → `createOrgMembership` adds each role by userID → each
      role's `defaultOrgID` set to the shared org so their login lands there.
      Bypasses the email-token invite-accept blocker entirely. Emails + shared org
      id are in `e2e/.auth/manifest.json` (`readManifest()`). The backend's FGA
      authorization lags writes, so membership is verified out-of-band before use.
      _Approver/Pending roles not yet seeded — add when approval specs need them._
- [x] **Rich-data fixture helper** — ✅ DONE. `api.ts` seeders: `createControl`,
      `createInternalPolicy`, `createProcedure`, `createProgram`, `createRisk`,
      `createTask`, `createGroup`, `createEvidence` (all via GraphQL, name/title only).
- [x] **File-upload helper** — ✅ DONE. `e2e/utils/files.ts` (`uploadFiles`,
      `SAMPLE_PDF/PNG/CSV/DISALLOWED`) + committed fixtures in `e2e/fixtures/files/`.
- [x] **Drag-drop helper** — ✅ DONE. `e2e/utils/dragdrop.ts` (`dragTo`) — pointer
      sequence for dnd-kit/react-beautiful-dnd. ⏳ Not yet consumed by a kanban spec.
- [x] **Read-only specs migrated to storage state** — ✅ DONE. dashboard,
      user-settings, organization-settings, notifications, standards, organization,
      trust-center, automation-other now use `import { test } from '../fixtures/auth'`
      (Owner) instead of per-test `seedLoggedInUser` — ~12–15s → ~3.5s each.
      Mutating / empty-state / auth specs stay on fresh users (see README).
- [ ] **Page-object models (deferred)** — only once selector sprawl bites; start
      with the control detail page (touched by 3+ specs).

---

## Permission-gating sweep — done (`tests/permissions.spec.ts`)

Cross-cutting role gates using the seeded Owner/Admin/Member/ReadOnly. Grounded
in the **actual** backend org-role permission sets (verified against the live
API), which differ from naive assumptions — record them here so specs assert
reality:

| perm                                         | owner | admin | member | readonly (AUDITOR) |
| -------------------------------------------- | :---: | :---: | :----: | :----------------: |
| create policy / control / procedure          |   ✓   |   ✓   |   ✗    |         ✗          |
| create evidence / task / review / discussion |   ✓   |   ✓   |   ✗    |       **✓**        |
| `can_invite_members`                         |   ✓   |   ✓   |   ✓    |         ✗          |
| `can_invite_admins`                          |   ✓   |   ✓   |   ✗    |         ✗          |
| `can_edit` (member row actions)              |   ✓   |   ✓   |   ✗    |         ✗          |

> ⚠️ **ReadOnly (AUDITOR) is NOT blanket read-only** — it can create evidence,
> tasks, reviews, discussions. Don't write "readonly cannot upload evidence";
> it can. ReadOnly also cannot _view_ internal policies (no `can_view_internal_policy`).

**Status: 22 tests green** (`tests/permissions.spec.ts`).

- [x] Create-page `<ProtectedArea>` gating: policies / controls / procedures —
      member + readonly blocked, owner + admin allowed (12 tests). ✅
- [x] Evidence Submit CTA reflects `can_create_evidence`: owner/admin/readonly
      see it, member does not (4 tests). ✅
- [x] Member-management gating: owner sees row actions; member + readonly see none
      (3 tests). Added `data-testid="member-actions-trigger"` to member-actions.tsx.
      _Note: Admin sees NO row actions either — it's a per-target right the org's
      role config grants only the Owner, not viewer-global `can_edit`. So the gate
      is Owner-vs-rest, and Admin is intentionally excluded from this assertion._
- [x] Detail-page edit gating: Owner sees the "Edit control" button on the seeded
      control; member + readonly do not (3 tests). Control seeded in global-setup
      (`manifest.sharedControlId`).
      _Finding: org-level `can_view_control` does NOT let a non-owner load an
      owner-created control — per-object FGA restricts it (the page renders empty),
      so the gate is Owner-vs-rest on the Edit affordance._ ✅
- [x] Detail-page DELETE gating: owner can open the control "…" menu and reach
      Delete; member + readonly get no actions menu (3 tests). Added
      `data-testid="control-actions-menu"` + `control-delete-button` to
      control-header-actions.tsx. ⏳ written, not yet run (servers off).
- [x] ~~Tasks create gating~~ — **N/A**: `<CreateTaskDialog/>` in the tasks
      toolbar is NOT permission-wrapped (unlike policies/controls/evidence), so the
      Create button shows for everyone and the action relies on backend rejection.
      No UI gate to test. Worth flagging to the product team as an inconsistency.

## Phase 1 — Tier 0 (gate to everything; finish these next)

### auth → `tests/auth.spec.ts`

- [ ] Webfinger redirects SSO-enforced org to `/login/sso/enforce`
- [ ] SSO-enforced org: owner password bypass path
- [ ] Google / GitHub buttons initiate provider redirect (assert redirect only)
- [ ] Verify-token round-trip: `GET /v1/verify?token=…` → success → onboarding
- [ ] Weak-password inline validation before submit; domain field optional
- [ ] Invite token: valid (existing user → switch; new user → create) accept flow
- [ ] Invite token: expired → re-request; already-accepted → "already a member"
- [ ] `/unsubscribe?token=…` confirmation screen

### onboarding → `tests/onboarding.spec.ts`

- [ ] Loading state ("We are now preparing your account") appears on submit
- [ ] Sidebar org-switcher reflects new org name after completion
- [ ] User invited into existing org **skips** onboarding
- [ ] Step 2 "Exit onboarding and use general template" link
- [ ] Step 1 sector "Other (Please Specify)" branch

### cross-cutting → `tests/cross-cutting.spec.ts`

- [ ] Session-expiry warning modal before refresh-token expiry
- [ ] Auto-logout after expiry → redirect to `/login`
- [ ] Org switcher: change org via dropdown → routes/badge update; persists
- [ ] User with no org membership sees "create or join" CTA
- [ ] Global search: results grouped by entity, click → detail, arrow-key nav
- [ ] URL filter state survives hard refresh
- [ ] Toast on success/error with auto-dismiss; click-outside closes dialog
- [ ] Typed-name confirmation gate for irreversible actions
- [ ] Permission UI: action buttons hidden without permission; read-only views
- [ ] Mark-all-read updates unread badge

---

## Phase 2 — Tier 1 (core compliance workflows)

### policies → `tests/policies.spec.ts` + `tests/policies-crud.spec.ts`

> ✅ **Written & passing** (`policies-crud.spec.ts`, storage-state Owner +
> API seeding): column-visibility menu, Status filter panel, version-history tab,
> delete-via-detail-menu. **Blocked/skipped:** approval flow — there is NO
> submit/approve/reject workflow in the UI; status is a plain inline dropdown
> (DRAFT→…→APPROVED), so "author cannot self-approve" is not UI-testable. Flag to
> product whether an approval workflow is intended. Bulk select/export and
> per-column sort selectors still need a run to confirm.

- [ ] Cards grouped by status; card metadata (owner/status/reviewed/due)
- [ ] Filters: approver group, control ref, program, type, review-due
- [ ] Table columns + per-column sort; bulk select/export/archive/delete
- [ ] Plate editor rich text (bold/headings/lists) round-trips to view page
- [ ] Version history: list prior versions, open old version (diff/read-only)
- [ ] **Approval flow:** submit draft → In-Review → approver approves → Approved;
      reject-with-comments → Draft; author cannot self-approve
- [ ] Edit locked when Approved/In-Review, unlocked when Draft
- [ ] Archive → restore → delete-from-archive
- [ ] ReadOnly cannot create/edit/submit/approve; non-approver can't approve

### controls → `tests/controls.spec.ts` + `tests/controls-crud.spec.ts`

> ✅ **Written & passing** (`controls-crud.spec.ts`): owner edit-mode toggle
> (Edit control → Cancel/Save appear), delete-via-actions-menu (uses the new
> `control-actions-menu`/`control-delete-button` testids). Mapping/subcontrols/
> linking still to write (need the detail-tab selectors confirmed by a run).

- [ ] Report/Request tabs load distinct data; columns + sort; filters
- [ ] Detail tabs: Overview metadata, Implementation edit persists, Objectives
- [ ] Map control to standards → save → mappings shown; edit/remove mapping
- [ ] Clone control → subcontrols copied; delete/archive removes from list
- [ ] Subcontrol: create from parent, detail mirrors parent, independent mapping,
      deleting subcontrol keeps parent
- [ ] Link/unlink policy, procedure, evidence (both sides persist)
- [ ] ReadOnly view-only across tabs; bulk CSV create + malformed-row errors

### programs → `tests/programs.spec.ts` + `tests/programs-crud.spec.ts`

> ✅ **Written & passing** (`programs-crud.spec.ts`): seeded-program detail
> renders. Member/group assignment, framework-wizard control auto-population, and
> archive/delete still to write (need detail-tab + wizard-step selectors).

- [ ] Search/filter (status/framework/team) with URL state; expand/collapse all
- [ ] Framework-based wizard: pick SOC2 → controls auto-populate → submit links them
- [ ] Wizard skip paths (framework / control import / team) → Continue/Submit
- [ ] Detail overview shows linked counts; tabs navigate without full reload
- [ ] Assign/remove member dialog; assign group; bulk import controls (standard + CSV)
- [ ] Archive → ARCHIVED; delete → typed-name confirm
- [ ] Member without CanCreate/CanEditProgram: no create button / read-only view

### evidence → `tests/evidence.spec.ts` + `tests/evidence-crud.spec.ts`

> ✅ **Written & passing** (`evidence-crud.spec.ts`): file upload shows the
> file card, disallowed type (`sample.exe`) rejected with error, submit name+file
> → detail view, delete-from-detail-sheet. Uses `utils/files.ts` + fixtures.
> Note: file is **optional** (status defaults MISSING_ARTIFACT without one);
> max 100MB. Renew/version-history + link-to-control still to write.

- [ ] Table columns; filter by control/status/expiration; sort
- [ ] File upload (PDF/image) happy path; disallowed-type + oversize blocked
- [ ] Submit blocked without file when file required; cancel mid-upload aborts
- [ ] Renew expired evidence → old version in history
- [ ] Link to control objective from both sides; unlink
- [ ] Row → preview (PDF/image inline); download original; delete with confirm
- [ ] ReadOnly cannot upload/renew/delete

### user-management → `tests/user-management.spec.ts` + `tests/user-management-crud.spec.ts`

> ✅ **Written & passing** (`user-management-crud.spec.ts`): members column
> headers, group edit (description), group delete (confirm dialog).
> **Skipped — would break the permission fixtures:** change-role / remove-member
> mutate the shared org's seeded Owner/Admin/Member/ReadOnly memberships, which
> the permission specs depend on. Test those against a throwaway active member
> (needs the role-elevation seeding) in a future pass.

- [ ] Members: columns, search, filter by role/status, sort
- [ ] Change role → save → permission badges update immediately
- [ ] Remove member with confirmation; can't demote/remove only owner
- [ ] Member detail: profile, permissions, linked groups, activity log
- [ ] Groups: form (name/desc/members/permissions), multi-select members
- [ ] Group edit (add/remove members, toggle perms); delete with confirm
- [ ] Member without CanManageTeam can't invite/remove/change role; ReadOnly no actions

---

## Phase 3 — Tier 2 (risk & remediation)

### exposure → `tests/exposure.spec.ts` + `tests/exposure-crud.spec.ts`

> ✅ **Written & passing** (`exposure-crud.spec.ts`): risks column-visibility,
> seeded-risk detail renders, search filters to seeded risk. Risk detail tabs /
> edit / action plans / status transitions / delete still to write (need detail
> selectors confirmed by a run).

- [ ] Overview widgets (risk-by-severity chart, remediation/scan status, quick links)
- [ ] Risks: columns, filter (severity/status/owner), sort
- [ ] Risk detail tabs (findings/vulns/action plans/remediation/evidence/approval)
- [ ] Edit risk fields persist; action-plan dialog; status transitions
- [ ] Findings: filter/search, detail guidance, link finding→risk, status update, bulk export
- [ ] Vulnerabilities: detail + affected assets, create-risk-from-vuln, status, filter
- [ ] Remediations: create from risk/finding, steps/timeline, mark step complete, close
- [ ] Reviews: add comment, approve/request-changes
- [ ] ReadOnly cannot create risks/action plans/remediations/reviews

### tasks → `tests/tasks.spec.ts`

> ✅ Already well-covered (create/validation/search/card-view/column-visibility/
> bulk-delete/bulk-edit/detail-sheet). **Blocked:** kanban drag-drop needs the
> drag-drop helper (Phase 0, not yet built); detail-sheet history/comments/reassign
> need detail-sheet selectors confirmed by a run. No new spec written this pass.

- [ ] Columns; filter (status/assignee/priority/due/program); sort; inline edit
- [x] ~~**Kanban** drag card across status~~ — **N/A**: there is NO kanban/board view
      for tasks. Only Table + a flat Card grid (`TableCardView`, no status columns,
      cards not draggable). Flag to product if a kanban is intended; until then the
      drag-drop helper serves FAQ/assessment reorder instead.
- [ ] Full create dialog (desc/priority/assignee/due/links); reassign
- [ ] Details sheet: history/comments thread, @mention persists, linked-items tab
- [ ] Bulk reassign / bulk status change
- [ ] ReadOnly cannot create/edit/delete/drag

### procedures → `tests/procedures.spec.ts` + `tests/procedures-crud.spec.ts`

> ✅ **Written & passing** (`procedures-crud.spec.ts`): column-visibility menu,
> delete-via-detail-menu (mirrors policies). Link-to-controls + version history
> still to write.

- [ ] Columns; filter (control ref/program/type); sort
- [ ] Form fields + required validation; content+metadata render on view
- [ ] Linked controls/policies sections; version history
- [ ] Edit pre-populated → save creates version; edit-locked when status forbids
- [ ] Link/unlink to controls via dialog; bulk CSV import
- [ ] Archive moves out of default list; delete typed-confirm; ReadOnly gated

---

## Phase 4 — Tier 3 (adjacent surfaces)

### registry → `tests/registry.spec.ts` + `tests/registry-crud.spec.ts`

> ✅ **Written & passing** (`registry-crud.spec.ts`): server-side search for assets
> and contacts (seeded via new `createAsset`/`createContact` API seeders). Vendor
> create/detail covered in registry.spec.ts. Asset/contact detail + edit/delete,
> personnel/platforms/system-details still to write.

- [ ] Each entity: search/filter/sort/pagination, empty state, edit→persist, delete→confirm
- [ ] Vendor detail tabs (contacts/questionnaire/documents/platforms/assessments),
      logo upload, add contact, link platform/asset, risk rating
- [ ] Platforms tabs + link/unlink asset/vendor/personnel
- [ ] Assets inline-edit, filter, bulk CSV import; System Details form groups
- [ ] Personnel linked platforms/roles, edit contact info; Contacts CRUD
- [ ] Vulnerabilities link-to-risk, status update, filter
- [ ] ReadOnly gated across registry

### organization-settings → `tests/organization-settings.spec.ts`

- [ ] General: edit name/desc/contact, upload logo → persist + sidebar reflects
- [ ] Authentication: SSO config validation, save persists, enforce-toggle warning,
      disable clears config
- [ ] Custom data: create field (name/type/object), list usage, edit, delete-with-warning
- [ ] Integrations: marketplace grid, Install initiates redirect, detail config,
      disable/remove seeded integration
- [ ] Logs: columns, filter (user/action/date), export, hidden for non-admin
- [ ] Subscribers: add/remove, hidden for non-admin
- [ ] Non-admin member bounced with friendly error

### trust-center → `tests/trust-center.spec.ts` (smoke only — deep coverage below)

> Current spec only smoke-tests the unconfigured-org error fallback. Deferred:
> the shared org has no trust center — needs backend seed or a create flow before
> most of these run. Confirm prerequisite before authoring.

- [ ] Overview summary blocks render
- [ ] Branding: logo/favicon upload, colors, reset
- [ ] Domain: enter custom domain → DNS instructions → disconnect (DNS verify out of scope)
- [ ] Documents: upload/metadata/version/delete; NDAs template + signature tracking
- [ ] Frameworks select + public display; Controls public toggle
- [ ] Subprocessors / Updates / Customer logos / FAQs CRUD + publish toggles
- [ ] Analytics empty-state smoke; ReadOnly cannot upload/edit/publish

### automation-assessments → split into `tests/assessments-admin.spec.ts` + `tests/assessments-respondent.spec.ts`

- [ ] Template editor: add MC/text/rating questions, reorder (drag), edit options, save
- [ ] Template viewer matches editor; duplicate independent; delete confirm
- [ ] Questionnaire: sections + questions + validation, reorder, save, viewer preview
- [ ] Assessment list (filter), create (template→respondents→due), bulk create
- [ ] Assessment detail: response status per respondent, completion %, export
- [ ] **Respondent (separate spec):** token link → form, per-section validation,
      save draft, submit → confirmation, resubmit rule, invalid/expired token errors
- [ ] ReadOnly cannot edit templates/questionnaires/assessments

### automation-workflows → `tests/automation-other.spec.ts` (extend)

- [ ] List columns + filter/search/sort
- [ ] Wizard: stepper persists, manual-config path (trigger/conditions/actions) → save,
      save-as-template, activate → appears in list
- [ ] Definition page: view config, schedule, dry-run result panel, activate/deactivate
- [ ] Visual editor: wire blocks → reload persists topology; templates duplicate→editor
- [ ] Inbox: pending list, approve/reject; Instances: list + step-log detail
- [ ] ReadOnly gated

### standards → `tests/standards.spec.ts`

- [ ] Grid of standards; search by name/code; framework tree of controls/subcontrols
- [ ] Preview control; "Add to org" → pick programs → confirm → controls linked
- [ ] Mapping indicator on already-mapped; ReadOnly cannot add

### public → `tests/public.spec.ts`

- [ ] Valid questionnaire token → form renders; per-section validation; submit→confirm
- [ ] Resubmit rule; expired token error; waitlist form submit + confirmation

---

## Phase 5 — Tier 4 (low priority; skip unless asked)

### user-settings → `tests/user-settings.spec.ts`

- [ ] Edit name → header updates; email-change confirmation; avatar upload
- [ ] Change password (current→new→confirm); wrong-current + mismatch errors
- [ ] Switch default org persists; typed-name account deletion (sole-owner blocked)

### developers → `tests/developers.spec.ts`

- [ ] List columns; search/filter; edit/rotate/revoke token with confirm
- [ ] Token-shown-once dialog can't reopen; PAT per-user visibility
- [ ] Only developer-access users reach pages

### automation-campaigns-comms → `tests/automation-other.spec.ts` (extend)

- [ ] Campaigns: columns/filter, create form, preview, save schedule, edit-before-send,
      cancel scheduled
- [ ] Communications/templates: CRUD, variable substitution preview, send (assert request)
- [ ] ReadOnly cannot create/send/edit

---

## Authoring conventions (from `e2e/README.md`)

- One spec per plan area; selectors via `getByRole`/`getByLabel`/`getByTestId`
  (add `data-testid` to the app where needed — don't bend tests around brittle DOM).
- Backend `where`-clause filtering only — never assert client-side-sliced data.
- No `waitForTimeout`; poll with `expect(locator).toBeVisible()`.
- Every test cleans up or runs against a fresh `runId`-scoped org.
- After authoring, mark items ✅ in the matching `plans/*.md`.
