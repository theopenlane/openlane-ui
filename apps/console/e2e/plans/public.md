# Public Plan

Routes: `(public)/questionnaire`.

Tier: **3** — tokenized, no auth.

## Questionnaire

- [ ] Open `/questionnaire?token=<valid>` → form renders.
- [ ] Multi-section form: required fields validate per section.
- [ ] Save progress / draft (verify product support).
- [ ] Submit → confirmation page.
- [ ] Resubmit on the same token: blocked or allowed? (verify).
- [x] Invalid token → "unable to load questionnaire" fallback. _(public.spec.ts — malformed-token case; expired-token would need a real expired token to assert separately)_
- [ ] Expired token → error screen.
- [x] No `?token` param → "unable to load questionnaire" fallback. _(public.spec.ts)_

## Out of scope

- Visual layout snapshots.
- Token generation (covered by backend tests).
