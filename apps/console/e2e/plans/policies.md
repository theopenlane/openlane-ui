# Policies Plan

Routes: `(protected)/policies`, `policies/create`, `policies/[id]/view`.

Tier: **1** — most-touched workflow per product team; approval flow has historical bugs.

## List — dashboard view

- [ ] Cards grouped by status (Draft / In-Review / Approved / Archived).
- [ ] Each card shows title, owner, status, last reviewed, due date.
- [x] Search input filters by title (server-side) — typing one title removes the other policy's row from the table view. _(policies.spec.ts)_
- [ ] Filter by approver group, control ref, program, type, review-due, linked controls.
- [x] Switch to table view via the TabSwitcher Table icon — created policy renders in a cell on the table tab. _(policies.spec.ts)_
- [x] Empty state for orgs with no policies. _(policies.spec.ts — fresh org shows the "Create policies" empty-state region)_
- [x] Newly-created policy appears in Recent Activity. _(policies.spec.ts)_

## List — table view

- [ ] Columns: title, owner, status, type, last reviewed, due date.
- [ ] Sortable by each column.
- [ ] Bulk select header checkbox toggles all rows.
- [ ] Bulk export → CSV download.
- [ ] Bulk archive → confirm → rows disappear from default filter.
- [ ] Bulk delete → confirm.

## Create policy

- [ ] Form: title, description, type, content (Plate.js editor), approver group, effective date.
- [x] Required validation blocks save when the title is blank. _(policies.spec.ts — submit on `/policies/create` without filling Title and assert the inline `Name is required` error.)_
- [x] Save → redirected to view page. _(policies.spec.ts — happy path)_
- [ ] Plate editor accepts rich text (bold, headings, lists) — assert at least one formatting round-trip survives save.

## View policy

- [x] Renders the policy title as an h1. _(policies.spec.ts — happy path lands on /policies/{id}/view and asserts the h1)_
- [ ] Renders full content.
- [ ] Version history sidebar/tab lists prior versions with timestamps and authors.
- [ ] Click an old version → diff or read-only view of that version (verify which).
- [ ] Linked controls + procedures shown.
- [x] A linked procedure appears in the Procedures tab after association. _(procedures.spec.ts — links the procedure from the procedure detail page, then opens the policy's Procedures tab and asserts the linked procedure renders.)_
- [ ] Approval status badge accurate.

## Edit policy

- [ ] Edit unlocked when status = Draft.
- [x] Inline title rename via the per-field title affordance persists across reload. _(policies.spec.ts — uses the title field's own Edit control, then exercises the per-field `updateInternalPolicy` mutation instead of the bulk Edit-button save.)_
- [x] Inline status change via the Properties card persists across reload. _(policies.spec.ts — double-clicks the status field, selects `Pending`, and exercises the per-field `updateInternalPolicy` mutation.)_
- [ ] Edit locked / read-only when status = Approved / In-Review (verify exact rules).
- [ ] Save change creates a new version entry.

## Approval flow

- [ ] Author submits draft for approval → status flips to In-Review.
- [ ] Approver sees policy in their queue. _(Email/notification delivery is out of scope — see [`00-priorities.md`](00-priorities.md).)_
- [ ] Approver approves → status flips to Approved → policy "published".
- [ ] Approver rejects with comments → status flips back to Draft → comments visible to author.
- [ ] Author cannot self-approve (verify in product — likely a backend rule, but UI should hide the button).

## Archival

- [ ] Archive published policy → moves to Archived group, no longer in active filters.
- [ ] Restore from archive (if supported).
- [ ] Delete from archive — irreversible confirmation.

## AI suggested actions

> **Out of scope:** AI suggestion content / quality. See
> [`00-priorities.md`](00-priorities.md).

- [ ] `PolicySuggestedActions` surface renders without errors when AI is disabled (no `GOOGLE_GENERATIVE_AI_API_KEY`).
- [ ] Smoke render only.

## History tab

- [ ] Uses the `/history/query` endpoint via `useHistoryGraphQLClient` — verify by network filter.
- [ ] Recent policy version dedup (commit `17570611`) — assert duplicate snapshots from a single update collapse to one timeline entry.

## Permissions

- [ ] ReadOnly user can view but cannot create / edit / submit / approve.
- [ ] Member outside the approver group cannot click "Approve".
