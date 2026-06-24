# Procedures Plan

Routes: `(protected)/procedures`, `procedures/create`, `procedures/[id]/view`, `procedures/[id]/edit`.

Tier: **2** — mirrors policies; piggyback on policies test patterns.

## List

- [ ] Table columns: name, owner, status, type, last reviewed, due date.
- [x] Search by name (server-side) — typing one name removes the other procedure's row. _(procedures.spec.ts)_
- [ ] Filter by control ref, program, type.
- [ ] Sort by each column.
- [x] Empty state — fresh org renders heading without procedure rows. _(procedures.spec.ts)_
- [x] /procedures renders the Procedures heading. _(procedures.spec.ts)_

## Create

- [ ] Form: title, description, type, content, owner, effective date, frequency.
- [x] Save → redirected to view. _(procedures.spec.ts — happy path)_
- [ ] Required-field validation.

## View

- [ ] Renders content + metadata.
- [ ] Linked controls + policies tabs/sections.
- [ ] Attachments list (if any).
- [ ] Version history.

## Edit

- [ ] Edit form pre-populated with current values.
- [x] Inline title rename via double-click h1 → input → Enter persists across reload. _(procedures.spec.ts — exercises the per-field updateProcedure mutation; mirrors the policies inline-edit test)_
- [x] Inline status change via the Properties card persists across reload. _(procedures.spec.ts — clicks the status field, selects `Pending`, and exercises the per-field `updateProcedure` mutation.)_
- [ ] Save updates content + creates a new version entry.
- [ ] Edit locked when status forbids it (verify).

## Linking

- [ ] Link procedure to controls via dialog.
- [x] Link procedure to policies via dialog. _(procedures.spec.ts — links an existing policy from the procedure detail page, then reopens both association dialogs to verify the persisted selection.)_
- [ ] Unlink works.

## Bulk import (CSV)

- [ ] Upload CSV → preview → confirm.
- [ ] Malformed CSV surfaces row errors.

## Delete / archive

- [ ] Archive moves out of default list.
- [ ] Delete is irreversible — typed confirmation.

## Permissions

- [ ] ReadOnly cannot create, edit, delete, link.
