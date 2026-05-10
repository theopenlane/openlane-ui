# Auth Plan

Routes: `(auth)/login`, `(auth)/signup`, `(auth)/forgot-password`, `(auth)/password-reset`, `(auth)/verify`, `(auth)/resend-verify`, `(auth)/subscriber-verify`, `(auth)/tfa`, `(auth)/invite`, `(auth)/unsubscribe`, `(auth)/waitlist`.

Tier: **0** (gate to everything).

> **Out of scope** — see [`00-priorities.md`](00-priorities.md): TFA login,
> SSO with real IdP, real Google/GitHub OAuth, full forgot-password /
> resend-verify / subscriber-verify (token only in email), email content.
> reCAPTCHA must be disabled in test env, not tested.

## Login

- [ ] Email webfinger redirects SSO-only orgs to `/login/sso/enforce`.
- [x] Email webfinger keeps non-SSO users on the password screen. _(auth.spec.ts)_
- [x] Valid email + password → dashboard _(or onboarding for fresh users; auth.spec.ts)_.
- [x] Invalid password → inline error, no navigation. _(auth.spec.ts)_
- [x] Unknown email → generic "credentials" error (must not enumerate users). _(auth.spec.ts)_
- [ ] Locked / disabled account → blocked message.
- [ ] "Remember me" persists session through browser restart (storage state assertion).
- [x] Redirect-after-login: arriving with `?redirect=/policies` lands on `/policies`, not `/dashboard`. _(auth.spec.ts — uses an onboarded user since fresh users get force-redirected to /onboarding regardless of ?redirect)_
- [x] Logged-in user visiting `/login` is bounced to `/dashboard`. _(cross-cutting.spec.ts)_
- [x] Logged-out user visiting any `(protected)` route is bounced to `/login` with a `redirect` query param. _(auth.spec.ts)_

## SSO redirect surface

- [ ] User in an SSO-enforced org is bounced to `/login/sso/enforce` even if they type a password.
- [ ] Org owner of an SSO-enforced org can still log in with password (bypass).
- [ ] Google / GitHub buttons initiate a redirect to the provider (assert the navigation begins; don't follow).

## Sign up + email verification (the one email flow we _can_ test)

The backend's `/v1/register` returns the verify token in its response when
`server.dev: true`, so this whole flow is exercisable end-to-end.

- [x] Email + matching passwords on `/signup` → registration submits, redirects to `/verify` and shows the post-signup message. _(auth.spec.ts — UI form-only; the verify token round-trip is exercised programmatically by registerAndVerify util)_
- [ ] Verify token round-trip (`GET /v1/verify?token=...`) → success screen → "continue" → onboarding.
- [x] Duplicate email → inline error appears, stays on `/signup`. _(auth.spec.ts)_
- [x] Mismatched confirm-password → inline `Passwords do not match` error, stays on `/signup`. _(auth.spec.ts)_
- [ ] Weak password → inline validation before submit.
- [ ] Domain field optional (submitting blank is fine).

## Forgot / reset password (form-only — token path is out of scope)

- [x] `/forgot-password` no-enumeration: unknown email gets the same generic confirmation toast and the body never reveals user existence. _(auth.spec.ts)_
- [x] `/forgot-password` form submits successfully and shows the confirmation toast + cooldown. _(auth.spec.ts)_
- [x] `/forgot-password` renders the reset form (heading + email input + submit). _(auth.spec.ts — render smoke; submission unverified)_
- [ ] `/password-reset` with a manually-supplied valid token (seeded via DB or backend helper) accepts a new password → login. _(Skip until we have a way to obtain the token; optional.)_
- [x] `/password-reset` with mismatched confirm-password → inline `Passwords do not match.` error (purely client-side, fake token used). _(auth.spec.ts)_

## Resend verify

- [x] `/resend-verify` form submission redirects to `/verify`. _(auth.spec.ts — fire-and-forget; cannot follow the email link.)_
- [x] `/resend-verify` renders the resend form (email input + submit). _(auth.spec.ts — render smoke; submission unverified)_

## Invite

- [ ] Invite link with valid token → if user exists → accept → switch to org.
- [ ] Invite link with valid token → if user doesn't exist → create account → onboarding.
- [ ] Expired invite token → re-request flow.
- [ ] Already-accepted invite → "already a member" message.
- [ ] Invite for an SSO-enforced org routes to SSO.

> Invite tokens are issued via the regular org-invite mutation (not email-only),
> so the token can be obtained from the GraphQL response in test setup.

## Misc

- [ ] `/unsubscribe?token=...` → confirmation screen (token can be issued via backend in test setup).
- [x] `/unsubscribe` renders the email input + Unsubscribe button. _(auth.spec.ts — form-only; full token round-trip is out of scope)_
- [ ] `/waitlist` form submits and shows confirmation.
- [x] `/waitlist` renders the marketing copy + subscribe form. _(public.spec.ts — render smoke only; submission is unverified)_
- [x] `/signup` renders without auth and shows the email field. _(public.spec.ts — render smoke; full register flow is unverified)_
