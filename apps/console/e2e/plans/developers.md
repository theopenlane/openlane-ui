# Developers Plan

Routes: `(protected)/developers/{api-tokens,personal-access-tokens}`.

Tier: **4** — better tested via API integration tests than UI.

> **Coverage so far** _(developers.spec.ts)_: smoke render of both sub-routes (`/developers/api-tokens`, `/developers/personal-access-tokens`) — confirms each route loads with its `<h2>` heading. CRUD flows below remain unverified.

## API tokens (org-scoped)

- [x] Create token: name + Never expires → "Token created" dialog appears with the readonly token. _(developers.spec.ts — happy path; scopes interaction not yet asserted)_
- [ ] List tokens: name, created, last used, scopes, expiration.
- [ ] Search / filter by scope / status.
- [ ] Edit token (name, expiration, scopes — verify which fields are mutable).
- [ ] Rotate token: generates new, marks old deprecated.
- [ ] Revoke token: confirmation → token disappears.
- [ ] Token-shown-once dialog cannot be re-opened (security smoke).

## Personal access tokens (user-scoped)

- Mirror of API tokens but per-user.
- [ ] Token visible only to the user who created it.

## Permissions

- [ ] Only users with developer access can reach these pages (verify exact role).
