# User Settings Plan

Route: `(protected)/user-settings/profile`.

Tier: **4** — minor UI, low blast radius.

> **Coverage so far** _(user-settings.spec.ts)_: smoke render of `/user-settings` (root → "User settings" heading) and `/user-settings/profile` ("My profile" heading). Profile/password/default-org flows below remain unverified.

## Profile

- [ ] Edit full name → save → header avatar / name updates immediately.
- [ ] Edit email (verify whether confirmation flow is required).
- [ ] Upload avatar.
- [ ] View account info (creation date, last login).

## Password

- [ ] Change password: current → new → confirm → save → next login uses new password.
- [ ] Wrong current password → inline error.
- [ ] Mismatch new/confirm → inline error.

## Default organization

- [ ] Switch default org via dropdown → save → next login lands on that org.

> **Out of scope:** TFA management (TOTP, backup codes), passkey management
> (hardware-dependent). See [`00-priorities.md`](00-priorities.md).

## Account deletion

- [ ] Type-name confirmation → delete → redirect to login → can't re-login.
- [ ] If user is sole owner of org → blocked or cascading flow (verify product).

## Permissions

- All actions are self-service; no role gating beyond "is logged in".
