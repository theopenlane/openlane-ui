# Onboarding Plan

Route: `(protected)/onboarding`.

Tier: **0**.

A 3-step wizard new users hit on first sign-in. Steps + button labels confirmed by reading `src/components/pages/protected/onboarding/`:

- **Step 1 — Company Info:** `companyName` (≥3 chars, required), `domains` (≥1, required — user's email domain is auto-added), `companyDetails.size` (optional select), `companyDetails.sector` (optional select; "Other" reveals an extra text input).
- **Step 2 — User Info:** `userDetails.role` (text input — has `required` attr but the Zod schema treats it as optional), `userDetails.department` (optional select).
- **Step 3 — Compliance Info:** four yes/no switches (`existing_policies_procedures`, `completed_risk_assessment`, `completed_gap_analysis`, `existing_controls`) + `demo_requested` switch. Defaults: all off.

Advance button shows the _next_ step's label ("User Info", "Compliance Info", "Submit"). Back button shows the _previous_ step's label.

## Happy path

- [x] Step 1: type a company name (≥3 chars). User's email domain is pre-populated as a chip. Click "User Info". _(onboarding.spec.ts — happy path + auto-domain)_
- [x] Step 2: leave role/department blank. Click "Compliance Info". _(onboarding.spec.ts — happy path)_
- [x] Step 3: leave switches off. Click "Submit". _(onboarding.spec.ts — happy path)_
- [ ] Loading state appears ("We are now preparing your account"). _(transient; covered implicitly by waiting for /dashboard)_
- [x] Lands on `/dashboard`. _(onboarding.spec.ts — happy path)_
- [ ] Sidebar org-switcher reflects the new org name. _(deferred — sidebar collapsed by default renders org as image-only button; cover in cross-cutting org-switcher spec)_

## Validation

- [x] Step 1 "User Info" button does not advance when `companyName` is empty. _(onboarding.spec.ts)_
- [x] Step 1 "User Info" button does not advance when `companyName` is shorter than 3 characters. _(onboarding.spec.ts)_
- [x] Step 1 manual domain entry: type a valid domain → click "Add Domain" → chip appears. _(onboarding.spec.ts)_
- [x] Step 1 manual domain entry: type an invalid domain → click "Add Domain" → `alert()` fires (currently a native browser alert; assert via dialog handler). _(onboarding.spec.ts)_
- [x] Step 1 with all auto-added domains removed → "User Info" does not advance (zod requires ≥1). _(onboarding.spec.ts)_

## Navigation

- [x] Forward then back: Step 1 → Step 2 → click "Company Info" → company name still populated. _(onboarding.spec.ts — back button preserves entered data)_
- [x] Forward, back, forward again: Step 2 form values preserved. _(onboarding.spec.ts — Step 2 values persist when navigating forward then back from Step 3)_
- [x] Refresh mid-wizard wipes the in-memory `useRef`/`useForm` state — assertion: form is empty after reload (in-product behavior; document, don't fight it). _(onboarding.spec.ts)_

## Re-entry

- [x] User who completed onboarding cannot reach `/onboarding` again (verify product redirect behavior; likely `/dashboard`). _(onboarding.spec.ts — documents current behavior: re-entry IS allowed, no redirect; flip when product adds a guard)_
- [ ] User invited into an existing org skips onboarding entirely. _(Deferred — needs invite-acceptance flow.)_

## Out of scope

- Step 2's "Exit the onboarding process and use general template" link — this is a secondary submit path; cover later.
- Step 1 sector "Other (Please Specify)" branch — niche.
- Animations / completion confetti.
