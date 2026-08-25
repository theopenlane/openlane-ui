# Programs Plan

Routes: `(protected)/programs`, `programs/create/*`, `programs/[id]`, `programs/[id]/settings`.

Tier: **1**.

## List view

- [x] Renders programs grouped by framework — generic programs surface the `Other` framework group on /programs. _(programs.spec.ts — accordion-collapsed; ProgramCard contents inside the group are not asserted because Radix's controlled-mode accordion races against the programs query in this layout)_
- [ ] Search input filters by program name (server-side).
- [ ] Filter by status (ACTIVE / ARCHIVED) hits backend `where` clause.
- [ ] Filter by framework, team — round-trip through URL state if applicable.
- [ ] "Expand all" / "Collapse all" toggles framework groups.
- [ ] Pagination — moving to page 2 fetches new data, doesn't slice client-side.
- [x] Empty state when no programs exist. _(programs.spec.ts — fresh org renders the template picker with the "No programs found" banner)_
- [ ] Member without `CanCreateProgram` permission does not see the "Create" button.

## Create wizard — entry point

- [x] `/programs/create` shows 5 template cards: SOC2, Risk Assessment, Framework-Based, Generic, Advanced Setup. _(programs.spec.ts — asserts each card's link href)_
- [x] Clicking a card routes to `/programs/create/<template>`. _(programs.spec.ts — covered by the href assertion above)_
- [x] Back button → ConfirmationDialog → Exit returns to `/programs/create` template picker. _(programs.spec.ts — does not currently assert that prior form state is preserved beyond the URL)_

## Create — Generic program (smoke)

- [x] Pick a (creatable) program type, enter name → Submit → lands on `/programs/[id]` with the program name visible. _(programs.spec.ts — happy path)_
- [ ] Skip framework selection → Continue. _(generic-program template doesn't have framework/control/team steps — those belong to the framework-based template)_
- [ ] Skip control import → Continue.
- [ ] Skip team assignment → Submit → lands on `/programs/[id]`.

## Create — Framework-based (smoke)

- [x] `/programs/create/framework-based` renders the wizard (Back + Continue buttons). _(programs.spec.ts)_
- [ ] Pick a framework (e.g. SOC2) → controls auto-populate in next step.
- [ ] Submit → program created with controls linked.

## Create — SOC2 (smoke)

- [x] `/programs/create/soc2` renders the wizard. _(programs.spec.ts)_
- [ ] Walk through SOC2-specific questions → submit.

## Create — Risk Assessment (smoke)

- [x] `/programs/create/risk-assessment` renders the wizard. _(programs.spec.ts)_
- [ ] Walk through risk-assessment-specific questions → submit.

## Create — Advanced Setup (smoke)

- [x] `/programs/create/advanced-setup` renders the wizard. _(programs.spec.ts)_
- [ ] Manually pick scope and add controls → submit.

## Program detail

- [ ] Overview shows linked controls count, evidence count, procedures, policies, tasks.
- [ ] Tabs/sections navigate without full-page reload.
- [ ] Member without `CanEditProgram` sees read-only view (no edit buttons).

## Program settings

- [ ] Assign member dialog: search → select user → confirm → member appears in list.
- [ ] Remove member confirmation; user disappears.
- [ ] Assign group dialog mirrors member dialog.
- [ ] Bulk import controls from a standard via dialog.
- [ ] Bulk import controls from CSV: upload → preview → confirm.
- [ ] Danger zone: archive → confirmation → list shows program as ARCHIVED.
- [ ] Danger zone: delete → typed-name confirmation → program removed → redirect to list.
- [ ] Member without manage permissions cannot see the danger zone.

## Edge cases

- [ ] Two programs with the same name in different frameworks render correctly.
- [ ] Very long program name doesn't break layout (smoke only).
