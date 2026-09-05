# E2E Test Priorities

Global priority order for authoring tests. Higher tier = more critical to ship first.

## Tier 0 — must work before anyone uses the app

| Plan                                                                    | Why                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| [auth.md](auth.md) — login, password, TFA happy path                    | Gate to everything else. If broken, no other test runs. |
| [onboarding.md](onboarding.md) — 3-step wizard                          | First-time user can't reach the app without it.         |
| [cross-cutting.md](cross-cutting.md) — session expiration, org switcher | Affects every authenticated page.                       |

## Tier 1 — core compliance workflows

| Plan                                                                    | Why                                                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [policies.md](policies.md) — create/view/edit/approve                   | Most-touched workflow per product team. Approval flow has historical bugs.           |
| [controls.md](controls.md) — create, map to standards, link evidence    | Fundamental object; many other entities link to it.                                  |
| [programs.md](programs.md) — create wizard, settings, member assignment | Container for compliance work. Wizard has 5 templates that each need smoke coverage. |
| [evidence.md](evidence.md) — upload, renew, link to control             | Document handling — file upload edge cases matter.                                   |
| [user-management.md](user-management.md) — invite, role change, remove  | Permission model touches everything; a regression silently grants/revokes access.    |

## Tier 2 — risk and remediation

| Plan                                                                       | Why                                                            |
| -------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [exposure.md](exposure.md) — risks, findings, remediations                 | Linked to controls; broken linkage is hard to detect by eye.   |
| [automation-tasks.md](automation-tasks.md) — task CRUD, kanban, assignment | Daily-driver feature. Drag-drop is a common regression vector. |
| [procedures.md](procedures.md) — CRUD, link to controls                    | Mirror of policies; piggybacks on the policies test patterns.  |

## Tier 3 — adjacent surfaces

| Plan                                                                                          | Why                                                                      |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [registry.md](registry.md) — vendors, assets, personnel, platforms                            | CRUD-heavy; smoke coverage per entity is enough.                         |
| [trust-center.md](trust-center.md) — branding, domain, documents                              | Customer-facing; cosmetics matter but logic is mostly file/setting CRUD. |
| [organization-settings.md](organization-settings.md) — SSO, billing, integrations             | High blast radius (SSO especially) but rarely changed by users.          |
| [automation-assessments.md](automation-assessments.md) — templates, assessment send, response | Multi-actor flow (admin + respondent). Test as two separate specs.       |
| [automation-workflows.md](automation-workflows.md) — wizard, editor, instances                | Large surface but low traffic. Smoke only for now.                       |
| [standards.md](standards.md) — browse, add to org                                             | Mostly read-only; one happy path is enough.                              |
| [public.md](public.md) — public questionnaire flow                                            | Tokenized, no auth. Single happy path + invalid token.                   |

## Tier 4 — low priority (skip unless explicitly asked)

| Plan                                                           | Why                                              |
| -------------------------------------------------------------- | ------------------------------------------------ |
| [user-settings.md](user-settings.md) — profile editing         | Minor UI, low blast radius.                      |
| [developers.md](developers.md) — API tokens, PATs              | Better tested via API integration tests than UI. |
| [automation-campaigns-comms.md](automation-campaigns-comms.md) | Niche. Smoke only.                               |

---

## Out of scope — flows we cannot E2E

These cannot be tested from a Playwright browser context with the current dev
setup. They are removed from the per-area plans entirely; this list is the
authoritative record of _why_.

| Flow                                                                               | Why it can't be tested                                                                                                                                                                        |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TFA login** (TOTP / backup codes)                                                | Requires a deterministic TOTP secret + clock — out of scope by product decision.                                                                                                              |
| **Forgot-password full flow**                                                      | The reset token is delivered only by email; no dev-mode return path exists in `forgotpassword.go` (unlike `register.go`). We can submit the form, not follow the link.                        |
| **Resend-verify full flow**                                                        | Same as forgot-password — token only in email. We can submit the form.                                                                                                                        |
| **Subscriber-verify full flow**                                                    | Same — token only in email.                                                                                                                                                                   |
| **Email content / delivery**                                                       | Email provider (`resend`) has an empty API key in dev; no mail is actually sent. Asserting on content belongs in backend tests.                                                               |
| **Real Google / GitHub OAuth login buttons**                                       | Round-trips to a real provider; no offline replay. We can assert the button initiates the redirect, nothing more.                                                                             |
| **SSO with a real IdP**                                                            | Out of scope. (A local Dex container exists — `core/docker/docker-compose-oidc.yml` — but the orchestration cost is too high for the first cut. Revisit if SSO regressions become a problem.) |
| **Stripe / billing flows**                                                         | `subscription.enabled: false` in dev `config.yaml`. Stripe key is a placeholder. Any UI that hits Stripe is a no-op or errors out.                                                            |
| **Custom domain DNS verification** (trust-center)                                  | Requires real DNS records to verify against.                                                                                                                                                  |
| **Domain scans** (exposure/scans)                                                  | Hits external scanner infrastructure. We can render the form and assert the request, not assert on results.                                                                                   |
| **Real integration OAuth** (Slack, Jira, ServiceNow, …)                            | Each requires real provider auth. Smoke-test the install button only.                                                                                                                         |
| **AI-driven flows** (PolicySuggestedActions, workflow AI wizard suggestions, chat) | Depend on `GOOGLE_GENERATIVE_AI_API_KEY` and are non-deterministic. We can render the surface and accept/dismiss a suggestion, not assert on suggestion content.                              |
| **In-app notifications** (Novu)                                                    | External SaaS dependency. We assert mutations fire; we don't assert delivery.                                                                                                                 |
| **reCAPTCHA**                                                                      | Disabled by leaving `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` unset in `.env.test`. Not a test target — a test prerequisite.                                                                           |
| **Webhook delivery** to external endpoints                                         | External by definition.                                                                                                                                                                       |

## Open questions

All resolved against backend code in `~/projects/openlane/core`. See
[`AUTH_STRATEGY.md`](../AUTH_STRATEGY.md) for the full answers. Headlines:

- Backend dev mode (`server.dev: true`, on by default with `task run-dev`)
  returns the email-verification token in the `/v1/register` response, so we
  don't need an email service.
- Default password is `mattisthebest1234` everywhere — hardcoded.
- TFA is opt-in per user. Disabled by default; one dedicated test user has
  it enabled.
- No `/test/reset` endpoint. DB persists across `task run-dev` restarts.
  Tests must use unique `runId`-suffixed entity names to stay idempotent.
- Subscription/billing module is disabled in dev — Stripe flows are out of scope.
- Local Dex IdP (`docker-compose-oidc.yml`, port 5556) gives us a real OIDC
  provider for SSO tests — no provider mock needed.
