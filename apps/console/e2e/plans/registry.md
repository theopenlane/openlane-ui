# Registry Plan

Routes: `(protected)/registry/{platforms,assets,system-details,vendors,personnel,contacts,vulnerabilities}`.

Tier: **3** — CRUD-heavy; smoke per entity.

## Common pattern (apply to each entity below unless noted)

- [x] List page renders with the entity heading. _(registry.spec.ts — smoke for vendors, assets, personnel, contacts, system-details, platforms; registry/vulnerabilities redirects to /exposure/vulnerabilities)_
- [ ] List view: search, filter, sort, pagination, empty state.
- [x] Create dialog/form: required field validation, submit, list updates. _(registry.spec.ts — covers vendor step-wizard happy path + Step 1 required validation; pattern transfers to other registry entities once their step configs are confirmed)_
- [ ] Detail page: metadata correct, linked entities visible.
- [ ] Edit: change a field, save, value persists after refresh.
- [ ] Delete: confirmation, item disappears.
- [ ] ReadOnly user cannot create / edit / delete.

## Platforms (`registry/platforms`)

- [ ] Detail tabs: Overview, Assets, Vendors, Personnel, Vulnerabilities, Risk mappings.
- [ ] Link/unlink an asset, vendor, personnel via dialog.
- [ ] Vulnerabilities tab shows scanner findings (smoke; data may be empty).

## Assets (`registry/assets`)

- [ ] Inline-edit table cells (verify which columns).
- [ ] Filter by platform, type, status, vendor.
- [ ] Bulk CSV import — preview → confirm.

## System Details (`registry/system-details`)

- [ ] Single page form (no list / no IDs).
- [ ] Edit each field group (architecture, data flow, classification, scope).
- [ ] Save persists across refresh.

## Vendors (`registry/vendors`)

- [ ] Detail tabs: Overview, Contacts, Questionnaire responses, Documents, Platforms/Assets, Historical assessments.
- [ ] Upload vendor logo via dialog → image displays on detail.
- [ ] Add a contact → contact appears in tab.
- [ ] Link a platform/asset → appears in tab.
- [ ] Risk rating field updates on edit.

## Personnel (`registry/personnel`)

- [ ] Detail shows linked platforms + roles.
- [ ] Edit contact info (email, phone) → persists.

## Contacts (`registry/contacts`)

- [ ] Plain CRUD — name, organization, email, phone, category.
- [ ] No detail page (verify; might be inline-edit-only).

## Vulnerabilities (`registry/vulnerabilities`)

- [ ] Mostly read; user actions are limited to:
  - [ ] Link vulnerability to a risk.
  - [ ] Update status (resolved / mitigated / accepted).
- [ ] Filter by severity, status, affected system.
