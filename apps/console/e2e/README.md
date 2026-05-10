# Console E2E Tests

End-to-end tests for the Openlane console app, using **Playwright**.

> **Status:** planning phase. The flow inventory in `plans/` is complete; actual tests will be authored incrementally.

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

```bash
cd apps/console
bun run e2e            # all tests, default project (chromium)
bun run e2e:ui         # interactive UI mode
bun run e2e:headed     # run with visible browser
bun run e2e --grep auth   # filter by name
```

The dev server (`task dev:console`) on port 3001 must be running, OR set
`PLAYWRIGHT_USE_WEBSERVER=1` so Playwright starts it via `webServer` config.

The backend (`theopenlane/core` on port 17608) must also be running and seeded.

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

1. **Storage state** — `e2e/global-setup.ts` registers + verifies + logs in
   each role once per `playwright test` invocation, saving cookies to
   `e2e/.auth/<role>.json`. Most specs use `test.use({ storageState })` to
   skip the login UI.
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
