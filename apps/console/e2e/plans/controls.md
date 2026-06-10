# Controls Plan

Routes: `(protected)/controls`, `controls/create-control`, `controls/create-subcontrol`, `controls/[id]/*`, `controls/[id]/[subcontrolId]/*`.

Tier: **1**.

## List view

- [ ] Tabs "Report" / "Request" each load distinct data.
- [ ] Columns: name, status, program, framework, owner, test date.
- [x] Search by ref code (server-side) — typing one ref removes the other control's row from the table view. _(controls.spec.ts)_
- [ ] Filter by program / framework / status / linked policies / linked procedures.
- [ ] Sort by each column.
- [x] Empty state. _(controls.spec.ts — fresh org renders the "Create controls" region with the Create Custom Controls card)_

## Create control

- [x] Manual form: ref-code → save → redirected to detail. _(controls.spec.ts — happy path)_
- [ ] Manual form with title + description + owner + framework mappings (full payload).
- [x] Required-field validation: submit without a Ref Code → inline `Ref Code is required` error and stays on /controls/create-control. _(controls.spec.ts)_
- [ ] Member without `CanCreateControl` cannot see the create button.

## Bulk create — CSV

- [ ] Upload valid CSV → preview rows → confirm → controls appear in list.
- [ ] Upload malformed CSV → row-level errors surfaced, valid rows still importable (verify behaviour).
- [ ] Cancel mid-upload doesn't half-commit.

## Control detail

- [ ] Overview tab: metadata, status, owner, test date.
- [x] Inline refCode rename: double-click h1 → edit → Enter → reload → persists. _(controls.spec.ts — exercises the per-field updateControl mutation via handleGroupBlur)_
- [x] Inline status change in the Properties card persists after refresh. _(controls.spec.ts — double-clicks the status field, selects `Preparing`, and exercises the per-field `updateControl` mutation.)_
- [ ] Implementation tab: edit implementation notes → save persists.
- [ ] Objectives tab: linked evidence shown.
- [ ] Map control: pick standards → save → mappings shown.
- [ ] Edit map control: remove a mapping → save persists.
- [ ] Clone control dialog: new name → submit → redirected to clone with subcontrols copied.
- [ ] Delete / archive: confirmation → control disappears from default list.

## Subcontrols

- [x] Create-subcontrol form requires Parent Control selection — `Parent Control is required` surfaces when missing. _(controls.spec.ts)_
- [ ] Create subcontrol from parent → saved → appears under parent.
- [ ] Subcontrol detail mirrors parent (overview / implementation / objectives / map).
- [ ] Mapping standards on subcontrol independent of parent.
- [ ] Deleting a subcontrol does not delete the parent.

## Linking

- [ ] Link policy to control → policy appears in detail and vice versa.
- [ ] Link procedure to control.
- [ ] Link evidence to a control objective.
- [ ] Unlink any of the above.

## Permissions

- [ ] ReadOnly user can view detail but cannot edit any tab.
- [ ] Inline status edit hidden for ReadOnly.

## Edge cases

- [ ] Control with no framework mapping displays an empty mapping section without errors.
- [ ] Control with 50+ mappings still renders (smoke for performance).
