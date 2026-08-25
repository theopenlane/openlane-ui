# User Management Plan

Routes: `(protected)/user-management/{members,groups}`.

Tier: **1** — permission model touches everything; regressions silently grant or revoke access.

## Members

- [x] /user-management/members renders the Members heading and Invite member CTA. _(user-management.spec.ts)_
- [x] Freshly-onboarded owner is listed as a member of their own org. _(user-management.spec.ts — verifies the table renders and the seeded user's email appears)_
- [ ] List columns: name, email, role, status, joined date.
- [ ] Search by name/email (server-side).
- [ ] Filter by role / status.
- [ ] Sort.

## Invite member

- [x] Open invite sheet via "Invite member" button. _(user-management.spec.ts — sheet visibility only)_
- [x] Enter single email + default Member role → click Invite → sheet closes on success. _(user-management.spec.ts)_
- [x] Pending row appears with "Invitation Sent" status. _(user-management.spec.ts — Awaiting Response tab, recipient cell + status cell)_
- [x] Multi-email invite — two committed chips create two pending rows. _(user-management.spec.ts)_
- [ ] Bulk CSV invite preview.
- [x] Resend invite on a pending row — success toast `Invite resent successfully` appears. _(user-management.spec.ts)_
- [x] Cancel invite — row disappears after Delete Invite. _(user-management.spec.ts)_

## Member detail

- [ ] Profile, role, permissions, linked groups.
- [ ] Activity log entries (read-only).

## Role + permission edits

- [x] Choose Admin in the invite sheet → pending row's Role cell shows `Admin`. _(user-management.spec.ts)_
- [ ] Change role in dropdown → save → permission badges update.
- [ ] Permission change reflected immediately for that user (smoke; optional second-session re-login check).
- [ ] Cannot demote the only org owner — UI blocks or backend rejects with friendly error.

## Remove member

- [ ] Confirmation → member removed from list.
- [ ] Cannot remove yourself if you're the last owner.
- [ ] Member's tasks/policies/owned items remain accessible (smoke check on a sample).

## Groups

- [x] /user-management/groups renders the Groups heading and Create button. _(user-management.spec.ts)_
- [ ] List columns: name, member count, permissions.
- [ ] Search / filter.

## Create / edit group

- [ ] Form: name, description, members, permissions (CanApprovePolicy, CanReviewEvidence, etc.).
- [ ] Multi-select members.
- [x] Save → group appears in the table. _(user-management.spec.ts — name-only happy path; covers groupName Zod min(1) and the defaults for admins/visibility)_
- [ ] Edit: add / remove members; toggle permissions.

## Delete group

- [ ] Confirmation → group removed.
- [ ] Group used as approver elsewhere — verify product behavior (block? warn? cascade unlink?).

## Permissions

- [ ] Member without `CanManageTeam` cannot see invite/remove/role-change controls.
- [ ] ReadOnly sees the lists but no actions.
