# Console E2E Tests

End-to-end tests for the Openlane console app, using **Playwright**.

> **Status:** active. Storage-state auth + multi-role seeding are implemented
> (see [`plan.md`](plan.md) Phase 0). The flow inventory in `plans/` and the gap
> list in [`plan.md`](plan.md) drive what's authored next.

## Storage-state auth (implemented)

`e2e/global-setup.ts` runs automatically and seeds four users into **one shared
org**, saving each session to `e2e/.auth/<role>.json` plus a `manifest.json`
(emails + shared org id). **Every run seeds fresh sessions** (~40s). Opt into
reuse with `E2E_REUSE_AUTH=1`, which is only honoured after a probe proves the
captured sessions still return authenticated data from core.

On top of that, **each Playwright worker logs its own profiles in** rather than
replaying the captured state. That matters because `auth.ts`'s signOut event
POSTs `/v1/logout` and revokes tokens _server-side_: with one shared session, a
single test tripping the session-expired modal killed every worker in the run.

| Profile  | Backend role | Seeded state          |
| -------- | ------------ | --------------------- |
| owner    | OWNER        | `.auth/owner.json`    |
| admin    | ADMIN        | `.auth/admin.json`    |
| member   | MEMBER       | `.auth/member.json`   |
| readonly | AUDITOR      | `.auth/readonly.json` |

Switch role with the **`authProfile`** test option — never with
`storageState: authFile(...)`. `authProfile` routes through the worker-scoped
`sessionFor` fixture, which gives each worker its own login; pinning
`storageState` directly replays one shared session and reintroduces the
cross-worker logout cascade described above.

```ts
import { test, expect } from '../fixtures/auth' // logged in as owner by default

test.describe('as readonly', () => {
  test.use({ authProfile: 'readonly' }) // switch role
  test('...', async ({ page }) => { ... })
})
```

Seeding is programmatic (no email service): the owner onboards via UI, then
`e2e/utils/api.ts` creates the shared org and adds each role with
`createOrgMembership` + sets their `defaultOrgID` so login lands in that org.

### Storage state vs. fresh users — which to use

- **Storage state** (`import { test } from '../fixtures/auth'`) — the default for
  render, search/filter, additive-create, validation, and permission specs.
  Fast (~2–9s, no per-test login). The Owner org is **long-lived, shared, and
  concurrently mutated by 8 workers**, so within these tests:
  - Do NOT assert empty-state, exact counts, or rely on a pristine org.
  - After creating an entity, **search its unique name** before asserting on /
    operating on its row — never assume the new row is on the default/first page
    (pagination + concurrent creates will bury it → flaky).
  - Every test must start with its own `await page.goto(...)` (there is no implicit
    post-onboarding landing page like the seeded path had).
- **Fresh per-test user** (`seedLoggedInUser(page, slug)`, ~12–15s) — only for
  tests that need a **pristine/empty org** (empty-state assertions, exact member
  counts, invite-list contents) or exercise **login/onboarding**. A spec keeps
  these in-file via a second test instance:
  ```ts
  import { test, expect } from '../fixtures/auth'      // shared Owner (fast)
  import { test as freshTest } from '@playwright/test'  // un-authed → seeds its own org
  // ...share-safe tests use test(...)...
  freshTest.describe('<area> — fresh org', () => {
    freshTest('empty state ...', async ({ page }) => { await seedLoggedInUser(page, '<slug>'); ... })
  })
  ```
  `auth.spec.ts` (login UI) and `public.spec.ts` (unauthenticated routes) use the
  bare `@playwright/test` `test` with no storage state.

**Gotchas worth knowing:**

- **reCAPTCHA:** the dev `.env` ships a real `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, so
  `login.tsx` gates submit on it. `loginViaForm` installs the reCAPTCHA shim
  (stubs grecaptcha, mocks `/api/recaptchaVerify`, blocks the Google bundle) — a
  no-op when the key is unset.
- **GraphQL `/query` auth:** needs `Authorization: Bearer` **and** the
  `temporary-cookie` session **and** CSRF. CSRF is double-submit (header must
  equal cookie, value arbitrary) so `api.ts` mints its own token instead of
  calling the flaky `/csrf` endpoint.
- **FGA lag:** `createOrgMembership` returns a "not found" payload error even on
  success (authorization propagation lag); membership is verified out-of-band by
  polling the member's own session.

## Layout

```
apps/console/e2e/
├── README.md            # this file
├── plans/               # human-written inventory of flows that need coverage
├── tests/               # Playwright spec files (one per area, mirrors plans/)
├── fixtures/            # custom test fixtures (auth, seeded org, API client)
├── pages/               # page-object models, one per high-traffic page
└── utils/               # helpers (selectors, network mocks, data factories)
```

The `plans/` directory is the source of truth for what should be tested. As tests
are authored, mark items in the relevant plan as ✅ done. Items left unchecked
are open work.

## Running

Two prerequisites for either mode:

1. **Backend** — `theopenlane/core` running on port **17608** with `server.dev: true`
   (returns verify tokens so we can register users without email). `task run-dev`.
2. **Console** on port **3001** — either the dev server or a production build (below).

All commands run from `apps/console`.

```bash
bun run e2e:full            # RECOMMENDED for a full run — builds, serves, runs, tears down
bun run e2e                 # all tests against whatever is already on :3001
bun run e2e -- --grep auth  # filter by title
bun run e2e tests/tasks.spec.ts          # one file
bun run e2e -- --last-failed             # re-run only previous failures
bun run e2e:ui              # interactive UI mode
bun run e2e:headed          # visible browser
bun run e2e:report          # open the HTML report from the last run
bun run e2e:typecheck       # tsc the e2e project (no run)
bun run e2e:sharded         # self-managing sharded runner (restarts server on bloat)
```

### Mode A — dev server (simplest, slowest)

```bash
task dev:console            # next dev on :3001 (Turbopack)
bun run e2e
```

`next dev` compiles each route on first hit (3–45s) and the server bloats over a
long run, so a full suite is ~30 min. Fine for iterating on a few specs; use
Mode B for the whole suite. (Or set `PLAYWRIGHT_USE_WEBSERVER=1` to let Playwright
start the dev server itself.)

### Mode B — production build (fast, recommended for full runs)

A `next build` + `next start` server has **no compile tax and no memory
degradation**, so a full run is a small fraction of Mode A's. `bun run e2e:full`
(`e2e/run-prod-suite.sh`) does the whole dance for you — build, serve, run, tear
down — and serves on **:3004** so it never fights a `next dev` already on :3001:

```bash
bun run e2e:full                             # everything
E2E_SKIP_BUILD=1 bun run e2e:full            # reuse the last build
bun run e2e:full tests/tasks.spec.ts         # pass through to playwright
```

> The build needs several GB of RAM and a few minutes.

Doing it by hand is still fine. Over HTTP `localhost` it needs two test-only env
flags (both **default-off**, so production deploys are unaffected):

```bash
COOKIE_PLAYWRIGHT_INSECURE=true bun run build
COOKIE_PLAYWRIGHT_INSECURE=true AUTH_TRUST_HOST=true bun run start   # :3001
# in another shell:
bun run e2e
```

- `COOKIE_PLAYWRIGHT_INSECURE=true` — emits dev-style cookies (`secure:false`, no
  `Domain`, `sameSite:lax`) so the browser accepts the session/CSRF cookies over
  HTTP. Without it a prod build sets `Secure; SameSite=None; Domain=.theopenlane.io`,
  which the browser rejects on localhost → CSRF / session-expired errors. Read at
  runtime, so it must be set on `bun run start` (setting it on `build` too is
  harmless). See `packages/dally/src/index.ts` → `useInsecureCookies`.
- `AUTH_TRUST_HOST=true` — Auth.js auto-trusts the host only in dev; a prod build
  rejects every host (`UntrustedHost`) unless you opt in. Runtime flag, set on
  `bun run start`.

> Re-run `bun run build` only when app/auth code changes — not between test runs.

### Environment variables

| Variable                         | Default                  | Purpose                                                                                                                                                                                     |
| -------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `COOKIE_PLAYWRIGHT_INSECURE`     | off                      | **Mode B only.** Dev-style insecure cookies so a prod build works over HTTP localhost.                                                                                                      |
| `AUTH_TRUST_HOST`                | off                      | **Mode B only.** Make Auth.js trust `localhost` in a prod build.                                                                                                                            |
| `E2E_WORKERS`                    | `8`                      | Local parallel worker count (CI is always 1). 16-core box handles ~12.                                                                                                                      |
| `E2E_RESEED`                     | off                      | Legacy no-op alias — seeding is already fresh every run.                                                                                                                                    |
| `E2E_REUSE_AUTH`                 | off                      | Set to `1` to reuse `.auth/` between runs for tight iteration. Honoured only if a probe proves the captured sessions still work.                                                            |
| `E2E_RUN_ID`                     | timestamp                | Pin the per-run id so all users/emails in one invocation match.                                                                                                                             |
| `E2E_BASE_URL` / `E2E_PORT`      | `http://localhost:3001`  | Console URL / port under test. `e2e:full` defaults `E2E_PORT` to `3004`. **Must be 3001 or 3004** — core's CORS `alloworigins` allows no other origin, and the browser calls core directly. |
| `E2E_API_BASE`                   | `http://localhost:17608` | Backend (core) base URL.                                                                                                                                                                    |
| `E2E_EMAIL_DOMAIN`               | `e2e-${runId}.invalid`   | Per-run email domain for seeded users.                                                                                                                                                      |
| `E2E_SKIP_BUILD`                 | off                      | **`e2e:full` only.** Reuse the existing production build instead of rebuilding.                                                                                                             |
| `PLAYWRIGHT_USE_WEBSERVER`       | off                      | Let Playwright start the dev server via `webServer` config (Mode A).                                                                                                                        |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | (from `.env`)            | If set, login gates on reCAPTCHA; the login helper shims it. Build-time inlined.                                                                                                            |
| `CI`                             | off                      | Enables `forbidOnly` + the `github` reporter and drops the default worker count to 4. `retries` is `1` everywhere (see `playwright.config.ts`).                                             |

`E2E_SHARD_SIZE` and `E2E_RSS_LIMIT_MB` tune `bun run e2e:sharded` (see
`run-sharded.sh`).

## CI

Two workflows cover this suite:

| Workflow                               | Trigger                                         | What it does                                                                                                                              |
| -------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/console-checks.yml` | every pull request + push to `main`             | Console type-check, unit tests (`apps/console/src` + `packages`), E2E type-check, `playwright test --list`. No backend needed.            |
| `.github/workflows/console-e2e.yml`    | `workflow_dispatch`, or a PR labelled **`e2e`** | Brings up the `theopenlane/core` stack from its published image, builds the console, runs the full Mode B suite, uploads the HTML report. |

`console-checks` is the always-on gate: it catches broken specs (type errors,
duplicate titles, unresolvable imports) in about a minute without any backend.

`console-e2e` is opt-in because it needs the whole core stack. Notes if you
touch it:

- **Port 3001, not 3004.** `core/config/config-dev.example.yaml` lists only
  `http://localhost:3001` under `server.cors.alloworigins`. The browser calls
  core directly, so any other origin silently fails every GraphQL POST with no
  error in either log. The local `.config.yaml` many of us run also allows 3004
  — CI does not.
- Core's runtime config is **not** committed in that repo; the workflow copies
  `config/config-dev.example.yaml` to `config/.config.yaml`.
- The suite is not sharded. One job at 4 workers is the current shape; shard
  with Playwright's own `--shard=i/N` across jobs only when wall time justifies
  it, and give each shard its own `E2E_RUN_ID` so the seeded orgs stay isolated.

## Test users

Each test run creates a fresh set of users via the backend register-and-verify
endpoints (relies on `server.dev: true` returning the verify token). Emails
are suffixed with a `runId` so reruns don't collide:

| Role     | Email                                 | Used by                               |
| -------- | ------------------------------------- | ------------------------------------- |
| Owner    | `e2e-owner-${runId}@openlane.test`    | Most specs (storage state)            |
| Admin    | `e2e-admin-${runId}@openlane.test`    | Permission specs                      |
| Member   | `e2e-member-${runId}@openlane.test`   | Permission specs                      |
| ReadOnly | `e2e-readonly-${runId}@openlane.test` | Permission gates                      |
| Pending  | `e2e-pending-${runId}@openlane.test`  | Invite-accept spec (no storage state) |

Password for everyone: `mattisthebest1234` (matches the backend default).

## Auth strategy

Two-tier:

1. **Seeded profiles** — `e2e/global-setup.ts` registers + verifies + logs in
   each role once per `playwright test` invocation, saving cookies to
   `e2e/.auth/<role>.json`. Most specs use `test.use({ authProfile })` to
   skip the login UI; the worker-scoped `sessionFor` fixture then logs that
   profile in once per worker so no two workers share a server session.
2. **Login spec** — `tests/auth.spec.ts` exercises the real login UI without
   storage state.

See [`AUTH_STRATEGY.md`](AUTH_STRATEGY.md) for the full design and the
implementation checklist.

## Conventions

- **One spec file per plan area.** Match plan filenames: `plans/programs.md` →
  `tests/programs.spec.ts`.
- **Page-object models** for any page touched by 3+ specs. Otherwise inline
  selectors are fine.
- **Selectors:** prefer `getByRole`, `getByLabel`, `getByTestId`. Avoid CSS
  selectors. Add `data-testid` to the app where roles/labels aren't enough —
  don't bend tests around brittle DOM.
- **Backend filtering only.** This codebase always uses GraphQL `where` clauses
  — never assert on client-side filtered data.
- **No flaky waits.** Use `expect(locator).toBeVisible()` polling, never
  `waitForTimeout`.
- **One assertion per concept.** Each `expect` checks one user-visible fact.
- **Test independence.** Every test must clean up its own state (or run against
  data scoped to a fresh test org).

## Priority

See `plans/00-priorities.md` for the global priority order.

In short: auth → onboarding → policies/controls/programs CRUD → tasks → the rest.
