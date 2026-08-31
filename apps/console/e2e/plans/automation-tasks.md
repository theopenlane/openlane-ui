# Automation: Tasks Plan

Route: `(protected)/automation/tasks`.

Tier: **2** — daily-driver feature; drag-drop is a regression vector.

## List view

- [x] /automation/tasks renders the Tasks heading. _(tasks.spec.ts)_
- [ ] Columns: title, status, assignee, due date, priority.
- [x] Search by title (server-side) — typing one task's title removes the other from the table. _(tasks.spec.ts)_
- [ ] Filter: status, assignee, priority, due date, program, owner.
- [ ] Sort by each column.
- [ ] Inline edit assignee + status.
- [x] Empty state — fresh org renders the Tasks heading without any task rows. _(tasks.spec.ts)_

## Kanban view

- [ ] Columns by status (Backlog / Todo / In-Progress / Review / Done — verify exact set).
- [ ] Drag a card from one column to the next → status persists after refresh.
- [ ] Drag back → reverts.
- [ ] Drag to invalid drop target is no-op.
- [ ] Card count badges update.

## Create task

- [ ] Quick create (sidebar/+ button) → minimal form (title, assignee).
- [x] Toolbar "Create" button opens the create dialog; title-only submit closes the dialog. _(tasks.spec.ts — taskKindName defaults to "Uncategorized" so no Type interaction is needed for the smoke)_
- [ ] Full create (dialog/sheet): title, description, priority, assignee, due date, links (control / program / risk / evidence).
- [ ] Recurring/template option (verify exists).
- [x] Save → appears in default list view (table tab cell shows the new title). _(tasks.spec.ts)_

## Detail

- [x] Click a row → details sheet opens with the task title in the sheet header (URL gains `?id=`). _(tasks.spec.ts)_
- [ ] History/comments thread.
- [ ] @mention persists in the comment body (notification _delivery_ is out of scope — see [`00-priorities.md`](00-priorities.md)).
- [ ] Subtasks (if supported) — add, complete, delete.
- [ ] Linked-items tab shows the control/program/risk/evidence.

## Edit + reassign

- [ ] Edit any field → save persists.
- [ ] Reassign → assignee field updates on the task (notification delivery out of scope).

## Bulk actions

- [x] Multi-select via row checkboxes — selecting one row shows the `Bulk Edit (1)` trigger and opens the Bulk edit dialog. _(tasks.spec.ts)_
- [ ] Bulk reassign.
- [ ] Bulk status change.
- [x] Bulk delete with confirmation — single-row selection then Bulk Delete + confirm removes the row. _(tasks.spec.ts)_

## Permissions

- [ ] ReadOnly cannot create / edit / delete / drag.
- [ ] Member can edit their own task even if not the creator (verify product rule).
