# Evidence Plan

Route: `(protected)/evidence`.

Tier: **1** — file upload paths have edge cases worth covering.

## List

- [ ] Table: document name, upload date, status, linked controls, expiration.
- [x] Search by name (server-side) — typing one name removes the other evidence row from the list. _(evidence.spec.ts)_
- [ ] Filter by control, status, expiration window.
- [ ] Sort by upload date and expiration.
- [x] Empty state — fresh org renders Evidence Center heading with no evidence cells. _(evidence.spec.ts)_
- [x] /evidence renders the "Evidence Center" heading and "Submit Evidence" CTA for an owner. _(evidence.spec.ts)_

## Upload

- [x] Open create sheet via "Submit Evidence" button. _(evidence.spec.ts — sheet visibility only)_
- [x] Submit-for-review with the name field only succeeds and redirects to `/evidence?id=<id>`. _(evidence.spec.ts — covers the no-file path; demonstrates that file is not actually required despite copy)_
- [x] Newly created evidence appears in the list on `/evidence`. _(evidence.spec.ts — re-navigates to drop the ?id query and asserts the row's Name cell)_
- [ ] Open upload dialog → pick file (PDF) → enter metadata (control link, effective date, expiration) → save → row appears.
- [ ] Upload image (PNG, JPG) succeeds.
- [ ] Upload disallowed type (e.g. `.exe`) → blocked with clear error.
- [ ] Upload oversize file → blocked (verify limit in product).
- [ ] Upload without selecting a control → succeeds (control link is optional? verify).
- [ ] Upload without a file selected → submit blocked. _(currently NOT blocked — see evidence.spec.ts happy path; flag for product review)_
- [ ] Cancel mid-upload aborts cleanly.

## Renew

- [ ] Open renew dialog on an expired evidence row → upload replacement file → expiration extended.
- [ ] Old version still accessible via history (if supported — verify).

## Link to control

- [ ] From the evidence row, link to a control objective via dialog.
- [ ] From a control's objectives tab, link existing evidence.
- [ ] Unlink works from either side.

## View / download

- [ ] Click row → preview opens (PDF inline, image inline).
- [ ] Download button delivers the original file (assert response status; don't read file bytes).

## Delete

- [ ] Confirm dialog → evidence removed.
- [ ] Cannot delete if linked to a published control (verify rule — may be a soft delete).

## Permissions

- [ ] ReadOnly cannot upload / renew / delete.
