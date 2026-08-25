# Trust Center Plan

Routes (`(protected)/trust-center/*`): overview, branding, domain, documents, NDAs, frameworks, controls, subprocessors, updates, customer-logos, FAQs, analytics.

Tier: **3** — customer-facing surface; mostly file/setting CRUD.

> **E2E status:** **deferred**. The trust-center root component (`trust-center.tsx`) calls `useGetTrustCenter()` and renders an "unexpected issue" error page when no trust center exists for the org. Fresh seedLoggedInUser orgs have no trust center configured, so every sub-route hits that error before its own component runs. Coverage requires either: (a) a backend seed step that creates a `TrustCenter` row for the test org, or (b) a UI flow to create one (verify whether one exists). Until that's wired, trust-center has no Playwright coverage.

## Overview

- [ ] Landing page renders summary blocks (smoke).

## Branding

- [ ] Upload logo → preview updates.
- [ ] Upload favicon → preview updates.
- [ ] Pick brand colors → preview updates.
- [ ] Save persists across reload.
- [ ] Reset to defaults.

## Domain

> **Out of scope:** real DNS verification. See
> [`00-priorities.md`](00-priorities.md). We can exercise the form, not the verify-poll outcome.

- [ ] Enter custom domain → DNS record instructions appear.
- [ ] Disconnect custom domain.

## Documents

- [ ] Upload document (PDF) → metadata (category, public flag) → save → row visible.
- [ ] Mark public/private toggle.
- [ ] Categorize.
- [ ] Version (re-upload same doc → new version, history visible).
- [ ] Delete with confirmation.

## NDAs

- [ ] Create NDA template → upload PDF or write content.
- [ ] Auto-send option toggle.
- [ ] Track signatures list.

## Frameworks

- [ ] Select frameworks (SOC2, ISO, HIPAA) → display on public site.
- [ ] Save → public-side mock or assertion that the field updated.

## Controls (public mappings)

- [ ] Toggle which controls are public.
- [ ] Hide implementation details flag.

## Subprocessors

- [ ] Add subprocessor (name, purpose, country).
- [ ] Edit / remove.
- [ ] Auto-generate subprocessor doc (smoke).

## Updates

- [ ] Write update post → schedule publish → confirm scheduled.
- [ ] Edit before publish.
- [ ] Publish now.
- [ ] "Notify customers" checkbox toggle persists. _(Cannot assert real notification delivery — out of scope.)_

## Customer logos

- [ ] Upload → "approval" toggle → display on public.
- [ ] Reorder logos.
- [ ] Remove.

## FAQs

- [ ] Create FAQ (question + answer).
- [ ] Categorize.
- [ ] Reorder.
- [ ] Publish toggle.
- [ ] Delete confirmation.

## Analytics

- [ ] Visitor count widget.
- [ ] Page-view chart.
- [ ] Referrer / geo breakdown.
- [ ] Smoke: data renders without errors when empty.

## Permissions

- [ ] ReadOnly cannot upload / edit / publish anywhere in trust center.
