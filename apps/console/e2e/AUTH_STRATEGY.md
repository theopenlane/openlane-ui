# E2E Auth & Fixture Strategy

> **Status:** answered. All open questions from the initial draft have concrete
> answers based on backend code at `~/projects/openlane/core` (commit at time
> of writing).

## Goals

1. Tests should be **fast** — don't pay the login UI cost on every spec.
2. Tests should be **realistic** — the login UI itself must be tested without shortcuts.
3. Tests should be **isolated** — one spec's mutations must not break another.
4. Tests should be **debuggable** — failures should point at the product, not the test rig.

## Backend findings (drives the rest of this doc)

These are the facts on the ground in `core` that change what's possible:

| Fact                                                                                                                                                                               | Where                                                                                                 | Implication                                                                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server.dev: true` is set in `config/config-dev.example.yaml` and `config/.config.yaml`. `task run-dev` enables it.                                                                | `core/cmd/serve.go:265` reads `Server.Dev` into `handlers.IsDev`.                                     | Dev-only code paths are active during E2E.                                                                                                                                           |
| **Register handler returns the email-verification token in the response when `IsDev=true`.**                                                                                       | `core/internal/httpserve/handlers/register.go:137-140` (`if h.IsDev { out.Token = meowtoken.Token }`) | We can register a fresh user and verify them programmatically — **no email service required**.                                                                                       |
| Verify endpoint is `GET /v1/verify?token=...`                                                                                                                                      | `core/internal/httpserve/route/verify.go`                                                             | Same flow that the email link uses; we just hit it directly.                                                                                                                         |
| Default password across all CLI bootstrap tasks: `mattisthebest1234`. Hardcoded in `core/internal/integrations/cli/config/config.go:37` and `core/cli/Taskfile.yaml`.              | n/a                                                                                                   | Use this for every seeded E2E user.                                                                                                                                                  |
| Default seeded users available via `task user:all` / `task user:all:admin`: `mitb@theopenlane.io`, `funk@theopenlane.io`, `admin@admin.theopenlane.io`.                            | `core/cli/Taskfile.yaml`                                                                              | These are the only "guaranteed" users on a fresh dev DB. We will create our own `e2e-*@openlane.test` users instead — see "Test users" below.                                        |
| **No `/test/*` reset or impersonation endpoints exist.** Closest is the (admin-only) impersonation HTTP handler at `internal/httpserve/handlers/impersonation.go`.                 | n/a                                                                                                   | We cannot wipe the DB via HTTP. Tests must be idempotent (unique entity names per run). DB state persists across `task run-dev` restarts — Postgres via `pgx` driver, no auto-reset. |
| **TFA is opt-in per user**, not enforced by default. Login handler only routes through TFA if `user.Edges.Setting.IsTfaEnabled` or `orgStatus.OrgTFAEnforced`.                     | `core/internal/httpserve/handlers/login.go:103-110`                                                   | Most E2E users can skip TFA entirely. We'll seed exactly one TFA-enabled user for the TFA spec.                                                                                      |
| **SSO enforcement** has a CLI helper (`task orgsetting:enforce-sso`) that wires up against a local Dex container (`docker/docker-compose-oidc.yml`, runs on port 5556).            | `core/cli/Taskfile.yaml:263-272`                                                                      | We can test SSO redirects against a real local IdP — no need to mock OAuth.                                                                                                          |
| **Subscription module is disabled in dev** (`subscription.enabled: false` in `config-dev.example.yaml`). Stripe key is a placeholder.                                              | n/a                                                                                                   | Billing UI flows that hit Stripe are not exercisable in dev. Skip those, or mock at the network layer.                                                                               |
| **Email provider in dev is `resend` with an empty API key** — emails are silently dropped (or fail) on real send.                                                                  | `core/config/.config.yaml:32-33`                                                                      | The dev-mode register-token-in-response is the only way to get verification tokens. For forgot-password and resend-verify, see "Gaps" below.                                         |
| **Frontend reCAPTCHA gates login** when `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` is set.                                                                                                   | `apps/console/src/components/pages/auth/login/login.tsx:195-212`                                      | E2E tests need that env var unset (or empty) to skip the reCAPTCHA branch entirely.                                                                                                  |
| Frontend session cookie is `temporary-cookie` (configurable via `SESSION_COOKIE_NAME`). NextAuth wraps backend's `access_token`/`refresh_token`/`session` into this single cookie. | `apps/console/.env`, `apps/console/src/lib/auth/providers/credentials.ts`                             | Storage state has to capture the NextAuth cookie. Easiest path: log in via the real UI in `global-setup` and let Playwright save whatever cookies appear.                            |

## Layered approach

### Layer 1 — global setup / storage state (90% of tests)

Most specs assume the user is already authenticated. Playwright's
[storage state](https://playwright.dev/docs/auth):

- A **global setup** file (`e2e/global-setup.ts`) runs once per `playwright test`
  invocation.
- For each role (Owner, Admin, Member, ReadOnly), the setup either:
  - **(a) Reuses** an existing seeded user (`mitb@`, `admin@admin.`, etc.), or
  - **(b) Creates** an `e2e-<role>-<runId>@openlane.test` user via the
    register-then-verify backend dance (see helper below), then logs in via
    the UI.
- Either way, the resulting cookies are saved to `e2e/.auth/<role>.json`.
- Specs declare `test.use({ storageState: '.auth/owner.json' })` (or use a
  custom fixture — see below) to skip the login UI entirely.

```ts
// e2e/utils/registerUser.ts — idempotent backend register+verify.
// Works only when server.dev=true (returns the token in the response).
export async function registerAndVerify(opts: {
  apiBase: string // e.g. http://localhost:17608
  email: string
  password: string
  firstName: string
  lastName: string
}) {
  const reg = await fetch(`${opts.apiBase}/v1/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(opts),
  })
  const { token } = await reg.json()
  if (!token) throw new Error('no verify token in /v1/register response — is server.dev=true?')

  const v = await fetch(`${opts.apiBase}/v1/verify?token=${encodeURIComponent(token)}`)
  if (!v.ok) throw new Error(`verify failed: ${v.status}`)
}
```

```ts
// e2e/global-setup.ts (sketch)
import { chromium } from '@playwright/test'
import { registerAndVerify } from './utils/registerUser'

const ROLES = ['owner', 'admin', 'member', 'readonly'] as const
const PASSWORD = process.env.E2E_PASSWORD ?? 'mattisthebest1234'
const RUN_ID = process.env.E2E_RUN_ID ?? Date.now().toString(36)

export default async function globalSetup() {
  const apiBase = process.env.E2E_API_BASE ?? 'http://localhost:17608'
  const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3001'

  for (const role of ROLES) {
    const email = `e2e-${role}-${RUN_ID}@openlane.test`

    await registerAndVerify({
      apiBase,
      email,
      password: PASSWORD,
      firstName: 'E2E',
      lastName: role,
    })

    const browser = await chromium.launch()
    const ctx = await browser.newContext()
    const page = await ctx.newPage()
    await page.goto(`${baseURL}/login`)
    // …fill the login form, submit, wait for /dashboard or /onboarding…
    await ctx.storageState({ path: `e2e/.auth/${role}.json` })
    await browser.close()
  }
}
```

### Layer 2 — login UI spec (no storage state)

`e2e/tests/auth.spec.ts` exercises the login form directly. It must NOT use
storage state. It is the only spec where:

- We type passwords into the UI.
- We assert on form validation, error messages, redirect-after-login.
- We test SSO redirects, TFA prompts, invite flows.

If this spec breaks, all storage-state-based specs are invalid. Run it first.

### Layer 3 — programmatic seeding

For tests that need entities to exist (e.g. "verify the policy list shows
something"), use the same `e2e/utils/registerUser.ts` pattern but extended:

- Login programmatically (`POST /v1/login` → cookies).
- Mutate via GraphQL (`POST /query` with the access token).
- Pass the resulting entity IDs into the spec.

This avoids hitting the UI for setup, which is brittle and slow.

## Test users

A fresh user per role per **test run** (timestamp-suffixed) is the safest
choice given the lack of a reset endpoint. Old users accumulate but are
harmless — they just need unique email addresses.

| Role     | Login email                           | Storage state         | Notes                                  |
| -------- | ------------------------------------- | --------------------- | -------------------------------------- |
| Owner    | `e2e-owner-${runId}@openlane.test`    | `.auth/owner.json`    | Owns its own org (created on register) |
| Admin    | `e2e-admin-${runId}@openlane.test`    | `.auth/admin.json`    | Created via Owner-issued invite        |
| Member   | `e2e-member-${runId}@openlane.test`   | `.auth/member.json`   | Standard member, no manage perms       |
| ReadOnly | `e2e-readonly-${runId}@openlane.test` | `.auth/readonly.json` | Used to verify permission gates        |
| Pending  | `e2e-pending-${runId}@openlane.test`  | n/a — invite UI only  | Has unaccepted invite from Owner       |

> No TFA-enabled user. TFA login is out of scope — see
> [`plans/00-priorities.md`](plans/00-priorities.md).

Password for all: `mattisthebest1234` (matches the backend default — keeps the
test rig grep-able).

`runId` defaults to `Date.now().toString(36)` but can be pinned via
`E2E_RUN_ID` so multiple test files in the same `playwright test` invocation
share the same set of users.

## Test organization

There is no shared "e2e-test-org" — each Owner registers and gets a fresh
personal organization. Specs that need a multi-org setup invite the other
test users (Admin / Member / ReadOnly) into the Owner's org via the regular
invite flow.

Mutating tests must use unique names: `e2e-${runId}-${test-name}-${counter}`.

## Open questions — answered

1. **Backend test endpoints?** ✅ No reset/login-as exists. The dev-mode
   register-returns-token mechanism gives us 90% of what we'd want from a
   `/test/login-as` endpoint anyway. **Action:** no upstream PR needed for
   the initial test suite. If we later need forgot-password or resend-verify
   E2E coverage, file an upstream issue to extend the dev-mode token return
   pattern to those handlers (`forgotpassword.go`, `resendemail.go`).

2. **Test user passwords.** ✅ `mattisthebest1234` everywhere. Keep it
   hard-coded in `e2e/utils/constants.ts` (not env vars — there's no secret
   to protect).

3. **TFA in tests.** ✅ Out of scope. TFA login is not E2E-tested. All test
   users have TFA disabled (the default for new users).

4. **Email verification.** ✅ Register response carries the verify token in
   dev mode. No email service needed.

5. **File upload fixtures.** ✅ Stash in `e2e/fixtures/files/`. Commit a
   small PDF, image, and CSV — kept under 50KB total.

6. **CI environment.** Deferred. The Playwright config already gates
   parallelism / retries on `process.env.CI`. Pick GitHub Actions when the
   first wave of tests is green locally.

7. **Visual regression.** Out of scope. Add later via Playwright snapshots
   if needed.

8. **GraphQL mutation mocking.** ✅ Two flows are de-facto mocked at the
   backend (subscription disabled, email provider keyless). For destructive
   flows we cannot exercise (delete-org cascade, real Stripe), use
   `page.route()` to intercept the mutation and assert the request shape
   without executing.

## Additional findings worth remembering

- **Recaptcha:** unset `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in the test env
  (`apps/console/.env.test`) so the login form skips the reCAPTCHA branch
  entirely. Same for `RECAPTCHA_SECRET_KEY` on the server side.
- **SSO testing:** `docker compose -f core/docker/docker-compose-oidc.yml up`
  starts a local Dex IdP on `:5556`. The CLI task `orgsetting:enforce-sso`
  configures an org against it. Wire E2E SSO specs to start Dex via the
  Playwright `globalSetup` → `globalTeardown` lifecycle, not via the
  `webServer` config.
- **DB persistence:** Postgres state survives `task run-dev` restarts. There
  is no migration/seeding step that wipes data. Tests must be idempotent.
  If we want a clean slate, drop and re-create the database between CI runs:
  `docker compose -f core/docker/docker-compose-postgres.yml down -v && task run-dev`.
- **Subscription/billing:** disabled in dev. UI may render placeholder
  states; assertions should account for this. Don't write tests against
  Stripe flows from dev.
- **Frontend session cookie:** Playwright's `storageState` captures it
  automatically. No manual cookie wrangling needed.

## Implementation checklist (for the next session)

- [ ] Create `e2e/.env.test.example` listing required env vars
      (`E2E_API_BASE`, `E2E_BASE_URL`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=`, …).
- [ ] Create `e2e/utils/constants.ts` with `PASSWORD`, `API_BASE`, etc.
- [ ] Create `e2e/utils/registerUser.ts` (sketch above).
- [ ] Create `e2e/utils/loginViaApi.ts` for the GraphQL-seed path.
- [ ] Create `e2e/global-setup.ts` and wire into `playwright.config.ts`.
- [ ] Create `e2e/fixtures/auth.ts` exporting a `test` extended with
      `asRole(role)` helper that swaps storage state.
- [ ] Add `e2e/utils/uniqueName.ts` for idempotent entity names.
- [ ] Commit sample files under `e2e/fixtures/files/` (sample.pdf,
      sample.png, sample.csv).
- [ ] Update `e2e/README.md` "Auth strategy" section to point at this doc
      instead of restating the plan.
- [ ] Sanity check: run `task run-dev` (in core repo) + `task dev:console`
      (in this repo), then `bun run e2e` — confirm `smoke.spec.ts` passes
      against the real stack.
