# Mutation & Form Coverage Checklist

Goal: every live GraphQL mutation and every form is exercised end-to-end by a test that **submits and asserts an outcome**.

Audited 2026-08-27 by reading every spec body. Supersedes the flow-level `COVERAGE.md`.

## Where we stand

|                                                    | count                       |
| -------------------------------------------------- | --------------------------- |
| Mutation ops declared in `packages/codegen/query/` | 353                         |
| — dead (hook exists, no component calls it)        | 106                         |
| — **live**                                         | **247**                     |
| Live: covered (submits + asserts)                  | 130 (53%)                   |
| Live: partial (reaches UI, never submits)          | 36 (15%)                    |
| Live: not covered                                  | 81 (32%)                    |
| Forms (`useForm()` sites)                          | 94                          |
| — submit tested                                    | 56                          |
| — render-only / not covered                        | 38                          |
| — zod validation asserted                          | 31 (9 of them weak proxies) |

CI-enforced coverage is lower than the table: 31 tests skip on every CI run (see Phase 0).

`[–]` means skipped by decision, not pending — the reason is on the line below it.

Rules for ticking a box:

- **Submit, don't hover.** A test that asserts a button is enabled does not tick a box.
- **Assert the outcome**, not the click — a toast, a redirect, or a re-read. Prefer an `expect.poll` API read-back for anything the backend transforms.
- Never widen an assertion to `expect(a.or(emptyState))` to make it pass. Seed the data instead.

---

## Phase 0 — Unblock (no new tests)

Highest return in the whole list. None of this is test-writing.

- [x] **Point trust-center specs at the seeded org.** Trust centers are created by the backend seeder — `createTrustCenter` is not callable by an org owner (verified: `UNAUTHORIZED` for a fresh user, `NOT_FOUND` for a seeded one), and the console has no such mutation at all. `global-setup.ts` therefore logs in as `E2E_DEMO_EMAIL ?? peter.parker@theopenlane.io` and seeds only a subprocessor + standard into that org. **CI still skips these specs** until the workflow runs the harmonize seed.
- [ ] Delete the 106 dead mutation hooks in `lib/graphql-hooks/` (no component imports them). Mostly `CreateBulkCSV*`, `UpdateBulk*`, `Delete*` for check-result, directory-_, job-_, notification-*, sla-definition, vendor-scoring. Also `CreateSubscriber`, `DeleteFindingControl`, `DeleteReview` — only their bulk variants are wired.
- [ ] Delete `tasks/hooks/use-assignee-form-schema.ts` — no importer; `AssigneeCell` uses `use-editable-field-form-schema`.
- [ ] Delete the two vestigial `useForm()` stubs with no resolver and no `handleSubmit` consumer: `exposure/overview/configure-sla-sheet.tsx`, `policies/view-policy-sheet.tsx`.
- [ ] Replace the 7 `expect(a.or(emptyState))` assertions with seeded data: `new-routes.spec.ts:70`, `permissions.spec.ts:528/543/583`, `dashboard.spec.ts:64`, `control-implementations.spec.ts:14`, `automation-workflows.spec.ts:22`.
- [ ] Triage the 19 data-dependent `test.skip(condition)` guards — each silently passes on the deliberately-empty e2e org.
- [ ] Resolve the 3 `test.fixme`, especially `cross-cutting.spec.ts:284` (logout does not clear the session cookie).

## Phase 1 — Shared helpers (prerequisite for Phases 2–3)

Five helpers close roughly 60 of the 117 open mutations. Write these first.

- [x] `uploadCsvAndAssert(page, rows, expectedToast)` — attach, click Upload, assert toast + created row. Unlocks 24 mutations.
- [x] `bulkEditAndSave(page, field, value)` — select row, open Bulk Edit, pick field, Save, assert. Unlocks 17.
- [x] `postAndEditComment(page, text)` — post, assert in list, edit, assert. Unlocks 14.
- [x] `seedNonOwnerMember()` — a fixture that is not the org owner. Unblocks `LeaveOrganization`, role changes, 2FA, account delete.
- [x] `expectMutationOk(page, opName)` — wraps `waitForResponse` on the op name, as `policies-create-form.spec.ts:178` already does for `CreateExport`. Use for anything the backend rewrites.

---

## Phase 2 — Finish the PARTIAL tests (36 mutations)

These tests already boot the browser, log in, seed fixtures, navigate and fill the form — then assert a button is enabled and exit. They pay full runtime for near-zero value. One more click each.

### 2A · CSV bulk import — submit, don't stop at "Upload enabled"

- [x] `CreateBulkCSVControl` — `controls-bulk-upload.spec.ts`
- [x] `CloneBulkCSVControl` — Upload From Standard dialog
- [x] `CreateBulkCSVMappedControl` — Upload Control Mappings dialog
- [x] `CreateBulkCSVEvidence` — `bulk-import-and-pagination.spec.ts`
- [x] `CreateBulkCSVInternalPolicy` — `policies-create-form.spec.ts:185`
- [x] `CreateBulkCSVProcedure` — `procedures-table.spec.ts:50`
- [x] `CreateBulkCSVEntity` — `registry-tables.spec.ts`
- [x] `CreateUploadInternalPolicy` — Import Existing Policy(s) dialog
- [x] `CreateUploadProcedure` — Import Existing Procedure(s) dialog

### 2B · Bulk edit — pick a field and save

Only scans ever saves one today (`exposure-entities-crud.spec.ts:196`).

- [x] `UpdateBulkControl` — controls bulk bar
- [x] `UpdateBulkEvidence` — `evidence-crud.spec.ts:260`
- [x] `UpdateBulkInternalPolicy` — `policies-crud.spec.ts:71`
- [x] `UpdateBulkProcedure` — `procedures-crud.spec.ts:152`
- [x] `UpdateBulkTask` — `tasks.spec.ts:160`
- [x] `UpdateBulkRisk` — `exposure-crud.spec.ts:532`
- [x] `UpdateBulkEntity` — `registry-tables.spec.ts:105`
- [x] `UpdateBulkSystemDetail` — `registry-crud.spec.ts:816`

### 2C · Bulk delete — confirm the dialog

- [x] `DeleteBulkControl` — `controls-crud.spec.ts` asserts the button only
- [x] `DeleteBulkInternalPolicy` — `policies-crud.spec.ts:71` asserts the button only

### 2D · Trust-center (all gated on Phase 0's seed)

- [x] `CreateBulkTrustCenterCompliance` — toggle a framework switch, then Publish
- [x] `DeleteBulkTrustCenterCompliance` — untoggle, then Publish
- [x] `CreateSubprocessor` — the sheet is filled and validated but never successfully submitted
- [ ] `CreateTrustCenterSubprocessor` — Add to Trust Center: pick one and submit  
      &nbsp;&nbsp;**UNFINISHED:** the picker's Command list never yielded an `option` for a freshly seeded subprocessor within the timeout.
- [x] `UpdateTrustCenterSetting` — branding Save/Publish, subscriber-notification switch

### 2E · Remaining partials

- [x] `CreateReview` — Create Review sheet opens in two specs, never submits
- [x] `CreateEmailTemplate` — editor reached, Save Draft asserted disabled
- [ ] `CreateTemplate` — template editor reached, never saved  
      &nbsp;&nbsp;**UNFINISHED:** `Save Survey` stays disabled until the SurveyJS creator has content, and the editor has no plain name input — driving it needs SurveyJS-level interaction.
- [ ] `UpdateTemplate` — editor opened with a seeded template, never edited+saved  
      &nbsp;&nbsp;**UNFINISHED:** same SurveyJS creator problem.
- [ ] `DeleteAssessment` — row menu opened, Delete never clicked  
      &nbsp;&nbsp;**UNFINISHED:** same row-action menu problem.
- [x] `SendCampaignTestEmail` — menu item asserted visible, dialog never opened
- [x] `UpdateEntityWithFiles` — vendor Upload Documents dialog opened, no file attached
- [x] `UpdateUserRoleInOrg` — Change Base Role dialog opens, role never picked _(needs `seedNonOwnerMember`)_
- [x] `CreateTFASetting` _(needs fresh-user fixture)_
- [–] `UpdateTFASetting` _(needs fresh-user fixture)_  
  &nbsp;&nbsp;**BLOCKED:** the Remove/Enable buttons only render once 2FA is verified, which requires a real TOTP code from an authenticator. `CreateTFASetting` (Configure) is covered.
- [x] `DeleteUser` _(needs fresh-user fixture — owner is blocked by design)_
- [x] `UpdateUserSetting` _(needs fresh-user fixture)_

---

## Phase 3 — Not covered at all (81 mutations)

### 3A · Comments — the whole subsystem is untested (14)

One `postAndEditComment` helper across six entities.

- [x] `InsertInternalPolicyComment` · [x] `UpdatePolicyComment`
- [x] `InsertProcedureComment` · [x] `UpdateProcedureComment`
- [x] `UpdateEvidenceComment`
- [x] `UpdateTaskComment` — task Conversation panel
- [x] `UpdateControlComment` · [x] `UpdateSubcontrolComment` — control Activity tab
- [–] `InsertControlPlateComment` · [–] `InsertSubcontrolPlateComment` · [–] `InsertRiskComment` · [–] `UpdateRiskComment` — Plate editor comments (`packages/ui/.../comment.tsx`)  
  &nbsp;&nbsp;**BLOCKED:** Plate inline comments require a text selection in a rich-text editor.
- [–] `UpdateDiscussion`  
  &nbsp;&nbsp;**BLOCKED:** Plate inline comments require a text selection in a rich-text editor.
- [x] `DeleteNote`

### 3B · Workflow inbox — zero interaction coverage (4)

`automation-other.spec.ts` only asserts the inbox heading renders.

- [–] `ApproveWorkflowAssignment` · [–] `RejectWorkflowAssignment`  
  &nbsp;&nbsp;**BLOCKED:** no createWorkflowAssignment mutation exists — assignments are produced by the workflow engine.
- [–] `RequestChangesWorkflowAssignment` · [–] `ReassignWorkflowAssignment`

### 3C · Campaign recipients (3)

Create/launch/delete are covered; recipient management is not.

- [x] `CreateBulkCampaignTarget` — Add recipients dialog
- [x] `DeleteCampaignTarget` — `Remove <email>` row button
- [–] `ResendCampaignIncompleteTargets` — Send reminder on an ACTIVE campaign  
  &nbsp;&nbsp;**BLOCKED:** needs a launched campaign with incomplete targets, which requires real recipient delivery.

### 3D · Trust-center (18) — all gated on Phase 0's seed

- [x] `CreateTrustCenterNDA` · [x] `UpdateTrustCenterNDA`
- [–] `UpdateTrustCenterNDARequest` (approve / approve-all) · [–] `DeleteBulkTrustCenterNDARequest`  
  &nbsp;&nbsp;**BLOCKED:** NDA requests originate from public trust-center visitors.
- [x] `CreateCustomDomain` · [ ] `ValidateCustomDomain` · [x] `DeleteCustomDomain`  
      &nbsp;&nbsp;**UNFINISHED (Validate only):** the Verify button only renders while the DNS verification is `PENDING`; a freshly created domain never reaches that state in the e2e environment.
- [ ] `CreateStandard` · [ ] `UpdateStandard` · [ ] `DeleteStandard` — custom frameworks  
      &nbsp;&nbsp;**BLOCKED BY AN APP BUG:** `frameworks-page.tsx` filters with `frameworkNEQ`, and SQL `!=` drops NULL rows — so a custom framework (which the Add dialog creates without a `framework`) never appears in the list. Verified against the demo org: 40 standards unfiltered, 13 with the filter. The fix is the idiom already used in `constants/standards.ts`: `or: [{ frameworkIsNil: true }, { frameworkNEQ: ... }]`.
- [ ] `UpdateSubprocessor` · [x] `UpdateTrustCenterSubprocessor` · [x] `DeleteTrustCenterSubprocessor` · [ ] `DeleteBulkTrustCenterSubprocessors`  
      &nbsp;&nbsp;**UNFINISHED:** an API-seeded trust-center subprocessor never appeared in the table search.
- [x] `BulkDeleteTrustCenterDoc` · [x] `BulkUpdateTrustCenterDoc`
- [x] `UpdateTrustCenterWatermarkConfig` — apply-watermark sheet
- [x] `UpdateSubscriber` — unsubscribe row action

### 3E · CSV bulk import, no test at all (15)

- [x] `CreateBulkCSVGroup` · [x] `CreateBulkCSVScan` · [x] `CreateBulkCSVTemplate` · [x] `CreateBulkCSVTask` · [x] `CreateBulkCsvReview`
- [x] `CreateBulkCSVActionPlan` · [x] `CreateBulkCSVFinding` · [x] `CreateBulkCSVRemediation` · [x] `CreateBulkCSVRisk` · [x] `CreateBulkCSVVulnerability`
- [x] `CreateBulkCSVAsset` · [x] `CreateBulkCSVContact` · [x] `CreateBulkCSVIdentityHolder` · [x] `CreateBulkCSVSystemDetail`
- [x] `UpdateBulkCSVControl` — the `Update Existing Controls` menu item appears in no spec

### 3F · Bulk edit, no test at all (9)

For findings/remediations/vulnerabilities the `exposure-entities-crud.spec.ts` harness routes them through `mutateVia:'sheet'`, so the bulk lane never runs. Adding a bulk lane closes three at once.

- [x] `UpdateBulkFinding` · [x] `UpdateBulkRemediation` · [x] `UpdateBulkVulnerability`
- [x] `UpdateBulkActionPlan` · [x] `UpdateBulkReview` · [–] `UpdateBulkSubcontrol`  
      &nbsp;&nbsp;**BLOCKED:** only reachable by selecting a subcontrol row in the control report, which lists controls in its own report scope; an API-seeded control does not appear there.
- [x] `UpdateBulkAsset` · [x] `UpdateBulkContact` · [x] `UpdateBulkIdentityHolder`

### 3G · Findings ↔ controls linking (3)

Untested in both directions. `CreateFindingControl` only fires from the auditor review sheet, deliberately excluded today (#35) — decide whether to lift that.

- [–] `CreateFindingControl` · [–] `CreateBulkFindingControl` · [–] `DeleteBulkFindingControl`  
  &nbsp;&nbsp;**BLOCKED:** only reachable from the auditor review sheet, deliberately excluded (#35).

### 3H · Merge records — feature has zero coverage (2)

- [–] `DeleteAsset` — asset merge deletes the secondary record  
  &nbsp;&nbsp;**BLOCKED:** merge-records-sheet.tsx is imported by nothing — the feature is unreachable UI.
- [–] `DeleteContact` — contact merge  
  &nbsp;&nbsp;**BLOCKED:** merge-records-sheet.tsx is imported by nothing — the feature is unreachable UI.

### 3I · Org, users, groups (5)

- [x] `LeaveOrganization` _(needs `seedNonOwnerMember`)_ — today's test asserts the button is absent
- [x] `DeleteGroupMembership` — row Trash button has no accessible name; **add an `aria-label` first**
- [x] `UpdateGroupMembership` — per-row Role select in the group sheet
- [–] `DeleteIntegration` — installed-integration-card Disconnect  
  &nbsp;&nbsp;**BLOCKED:** no createIntegration mutation — integrations only exist after an OAuth connect.
- [–] `DeletePasskey` — passkeys-section row remove  
  &nbsp;&nbsp;**BLOCKED:** WebAuthn enrollment cannot be driven from Playwright.

### 3J · Questionnaires (2)

- [ ] `CreateAssessmentTemplate` — Create Template from Assessment  
      &nbsp;&nbsp;**UNFINISHED:** the row action menu never opened for the seeded questionnaire.
- [x] `DeleteAssessmentResponse` — Delivery tab row delete

### 3K · Subcontrols (2)

- [x] `updateSubcontrol` — covered by the subcontrol detail form in `controls-crud.spec.ts` (there is no inline status editor on that page; the value renders as plain text)
- [x] `DeleteSubcontrol` — mirror `DeleteControl`, which is covered by a near-identical test

### 3L · Files & misc (4)

- [x] `UpdateIdentityHolderWithFiles` — personnel Documents tab
- [–] `UpdateScan` — scan detail sheet Edit → Save  
  &nbsp;&nbsp;**BLOCKED:** the scan detail sheet exposes no Edit affordance (verified against a seeded scan); scans are edited through bulk edit, which is covered.
- [–] `ImportDomainScanReview` — domain-scan Import  
  &nbsp;&nbsp;**BLOCKED:** needs discovery results from an executed domain scan, which the API cannot seed.
- [–] `MarkNotificationsAsRead` — Mark all as read / row click / bell popover  
  &nbsp;&nbsp;**BLOCKED:** the button only renders when unread notifications exist, and notifications are produced by backend events that cannot be seeded.

---

## Phase 4 — Forms (38 open of 94)

Every form below is either opened-but-never-submitted or untouched. Most map to a mutation above; tick both.

### 4A · Bulk-edit dialogs (6)

- [x] `controls/bulk-edit/bulk-edit-controls.tsx` — **no test at all**, unlike its siblings
- [x] `evidence/bulk-edit/bulk-edit-evidence.tsx`
- [x] `policies/bulk-edit/bulk-edit-policies.tsx`
- [x] `procedures/bulk-edit/bulk-edit-procedures.tsx`
- [x] `risks/bulk-edit/bulk-edit-risks.tsx`
- [x] `tasks/bulk-edit/bulk-edit-tasks.tsx`

The two bespoke ones (risks, tasks) carry their own `collectAssociationInput` / clear-value logic that no test executes.

### 4B · Vendor detail dialogs — 5 forms, zero coverage

Largest untouched cluster; each is a small dialog with a required field and a mutation.

- [x] `vendors/detail/tabs/overview/add-domain-dialog.tsx`
- [x] `vendors/detail/tabs/overview/add-asset-dialog.tsx`
- [x] `vendors/detail/tabs/overview/link-system-dialog.tsx`
- [x] `vendors/detail/tabs/documents/mark-as-evidence-dialog.tsx`
- [x] `vendors/detail/tabs/risk-review/vendor-review/use-vendor-review-form-schema.ts`
- [x] `vendors/detail/tabs/contacts/use-contact-form-schema.ts` — Add Contact title asserted, nothing filled

### 4C · Trust-center write paths that never write (6)

- [x] `trust-center/branding/brand-schema.ts` — whole branding save, logo/favicon upload, `securityContact` email rule
- [x] `trust-center/subprocessors/sheet/create-subprocessor-sheet.tsx` — validated but never successfully created
- [x] `trust-center/subprocessors/sheet/edit-trust-center-subprocessor-sheet.tsx`
- [x] `trust-center/subprocessors/table/add-existing-dialog.tsx`
- [x] `trust-center/reports-and-certifications/table/bulk-edit-trust-center-dialog.tsx`
- [x] `trust-center/frameworks/create-framework-dialog.tsx` (`StandardDialog`)

### 4D · Mark-as-evidence / document dialogs (3)

- [x] `personnel/detail/tabs/documents/mark-as-evidence-dialog.tsx`
- [x] `platforms/detail/mark-as-diagram-evidence-dialog.tsx`
- [–] `policies/view/fields/use-replace-document-form-schema.ts` — Replace document, `File`-instance validator  
  &nbsp;&nbsp;**BLOCKED:** the Replace document button only renders for a policy backed by an externally-managed Word file; an API-seeded policy has none.

### 4E · Org settings & profile (5)

`sso.tsx` is 921 lines with four required fields and three tests, all annotated "no mutation".

- [ ] `organization-settings/authentication/sso.tsx`  
      &nbsp;&nbsp;**UNFINISHED:** the identity-provider selector never renders in the e2e org, so the required-field messages cannot be reached.
- [x] `organization-settings/general-settings/organization-name-form.tsx` _(shared org — needs a fresh-org fixture)_
- [x] `profile/user-settings/profile-name-form.tsx` _(needs fresh-user fixture)_
- [x] `profile/user-settings/default-org-form.tsx` _(needs fresh-user fixture)_
- [x] `user-management/members/actions/member-actions.tsx` — Change Role _(needs `seedNonOwnerMember`)_

### 4F · Programs & controls (5)

- [ ] `programs/create/from-existing/from-existing-wizard.tsx` — the only program wizard with no create path tested; 5-step clone + `useFromExistingPrefill` are pure regression surface
- [ ] `programs/[id]/basic-info.tsx` — Edit reveals Save/Cancel, neither exercised  
      &nbsp;&nbsp;**UNFINISHED:** clicking Edit did not surface an editable textbox.
- [–] `programs/[id]/program-auditor.tsx` — the card's own edit form (the covered test goes through `set-auditor-dialog`)  
  &nbsp;&nbsp;**BLOCKED:** the card's edit form only renders when an auditor is already assigned; set-auditor-dialog is the covered path.
- [–] `controls/control-review/use-control-review-form-schema.ts` — opened by a permissions test that says "never saved"  
  &nbsp;&nbsp;**BLOCKED:** auditor review submission is excluded by design (#35).
- [x] `controls/[id]/[subcontrolId]/page.tsx` — subcontrol detail form never submitted

### 4G · Questionnaires & integrations (3)

- [x] `questionnaire/dialog/create-assessment-template-dialog.tsx`
- [x] `questionnaire/templates.tsx` — Create Questionnaire From Template (only the menuitem is asserted visible)
- [–] `integrations/schema-form.tsx` — dynamic connect form; no successful connect is ever asserted  
  &nbsp;&nbsp;**BLOCKED:** a successful connect requires a real OAuth handshake with the provider.

### 4H · Slideouts (1)

- [x] `procedures/view-procedure-sheet.tsx` — no spec opens it, while its policy twin is opened. Closable by adding a row click at `controls-crud.spec.ts:130`.

### Form accounting

56 submit-tested + 35 listed above + 3 deleted in Phase 0 (`use-assignee-form-schema`, `configure-sla-sheet`, `view-policy-sheet`) = 94. Complete.

---

## Phase 5 — Validation assertions (63 forms)

Zod rules are validated only by whichever e2e test happens to submit that form. **No unit test in the repo imports `zod` or calls `.safeParse()`**, and 1 of 30 `use-*-form-schema.ts` files has a test (which tests a date helper, not the schema).

- [–] Upgrade the 9 weak validation assertions to assert the rendered `FormMessage` text, not a proxy:  
  &nbsp;&nbsp;**BLOCKED:** verified by running them — the assets / contacts / personnel / system-details create sheets never render the zod message on submit, which is why the original tests asserted focus. Reverted. Making these assertable needs a `FormMessage` in those forms first.
  - `toBeFocused()` on the first textbox — assets, contacts, personnel, system-details
  - "sheet stayed open + record absent" — scans, vulnerabilities
  - disabled-button / component-level message — members-invite
  - wizard gate rather than inline message — platforms, map-control
- [ ] Assert at least one inline zod error per form for the 63 forms that have none.
- [x] Cover the cross-field rules that no test reaches: `revision` semver regex (duplicated in `policies/view` and `procedures/view`), evidence `renewalDate` "must be in the future", timeline "End date must be after start date", token expiry `refine`.

## Phase 6 — Unit tests, on input builders only

Not on zod schemas — e2e covers those as a side effect, and they are the failure mode that fires least.

The valuable precedent already exists: `object-association.test.ts` (59 cases on `getAssociationInput` / `buildMutationKey`), `target-entry.test.ts`, `task-where.test.ts`, `get-include-vars.test.ts`.

- [x] Extract the form-values → GraphQL-input mapping out of submit handlers into pure functions, then unit test them. This is a refactor first, tests second — the mapping is currently inline in components and untestable.
- [x] Prioritise entities where the backend rewrites what you send: evidence status, campaign recurrence, risk score, anything with enum or date coercion.
