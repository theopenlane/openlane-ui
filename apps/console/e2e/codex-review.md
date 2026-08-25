Executive verdict: the 45-minute runtime is primarily an execution-mode problem, then a suite-design problem. Do not invest in making the full suite fast under `next dev`. Run production builds, introduce real CI sharding, and reduce the number of browser-level microtests. The existing `run-sharded.sh` is sequential batching, not wall-clock sharding.

## 1. SPEED

Estimated savings are directional and not additive.

| Rank | Change                                                |                                                         Estimated saving |     Effort | Recommendation                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---- | ----------------------------------------------------- | -----------------------------------------------------------------------: | ---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Run full suites against `next build` + `next start`   |                                        30–35 min from the current 45 min |        Low | Make Mode B the only full-suite/CI mode. Mode A explicitly pays 3–45 seconds per cold route, while Mode B avoids compilation and memory degradation ([README.md:116](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/README.md:116), [README.md:128](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/README.md:128)). Extrapolating 356 tests in six minutes gives roughly 10–15 minutes for 724 tests on one eight-worker runner. |
| 2    | Add four real CI shards                               |                                                     5–9 min after Mode B |     Medium | Yes, sharding is the right move. Start with four jobs, four workers each, and Playwright’s built-in `--shard=i/4`. Build once and distribute the build artifact.                                                                                                                                                                                                                                                                                         |
| 3    | Move browser-level microtests down the pyramid        |                                      3–7 min in Mode B; 10–20 min in dev |       High | The static scan found 613 `page.goto()` calls. Many tests only assert headings, menu contents, tabs, or form-state behavior. Moving 30–50% out of E2E is realistic.                                                                                                                                                                                                                                                                                      |
| 4    | Replace UI-based “fresh org” provisioning             | 3.6–4.5 min aggregate on a serial runner; 30–90 seconds at eight workers |     Medium | There are 18 `seedLoggedInUser` calls, each paying 12–15 seconds, plus onboarding’s repeated register/login path. Create fresh users/orgs through APIs and use the login UI only in auth/onboarding tests.                                                                                                                                                                                                                                               |
| 5    | Consolidate related microtests into journeys          |                                                 10–20% of Mode B runtime |     Medium | Campaign stepper tests independently reopen the same route and dialog three times ([automation-crud.spec.ts:57](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/automation-crud.spec.ts:57)); similar repetition appears across toolbar, column, filter, and dialog-open tests.                                                                                                                                                         |
| 6    | Tune workers against the backend, not CPU alone       |                                     15–35% relative improvement possible |        Low | CI is hard-clamped to one worker ([playwright.config.ts:27](/home/bruno/projects/openlane/openlane-ui/apps/console/playwright.config.ts:27)). Benchmark 4, 6, 8, and 12 workers while measuring backend latency, Postgres connections, retries, and p95 test duration. More workers will eventually slow the suite through backend/FGA contention.                                                                                                       |
| 7    | Fix global setup overhead                             |                                 Up to 15–35 seconds per invocation/shard | Low–Medium | Demo-session capture can spend 30 seconds discovering that demo credentials do not work ([global-setup.ts:119](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/global-setup.ts:119)). Make it opt-in or preflight credentials via API. Register role users concurrently where backend capacity permits.                                                                                                                                       |
| 8    | Reduce retries after fixing the known flakes          |                                         Usually 0–3 minutes of tail time |     Medium | Two retries are explicitly being used to absorb known failures ([playwright.config.ts:16](/home/bruno/projects/openlane/openlane-ui/apps/console/playwright.config.ts:16)). Use zero locally and one in CI. A test passing on retry should still be reported as a reliability defect.                                                                                                                                                                    |
| 9    | Record trace/video only on retry                      |                                        Approximately 5–15% I/O reduction |        Low | `retain-on-failure` records trace/video for every first attempt and discards successful artifacts afterward ([playwright.config.ts:38](/home/bruno/projects/openlane/openlane-ui/apps/console/playwright.config.ts:38)). Prefer trace/video on first retry; keep failure screenshots.                                                                                                                                                                    |
| 10   | Stop optimizing full runs through dev-server restarts |                                               Avoid repeated compile tax |        Low | `run-sharded.sh` runs batches sequentially ([run-sharded.sh:124](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/run-sharded.sh:124)) and may restart the dev server between batches ([run-sharded.sh:72](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/run-sharded.sh:72)), losing compiled-route state. Rename it to `e2e:batched-dev` and reserve it for debugging.                                                           |

### How sharding should work

Use Playwright’s built-in `--shard`, not manual area or alphabetical spec slicing.

- Keep `fullyParallel: true` once the data-isolation issues are fixed. It allows large files such as `registry-crud` and `exposure-crud` to be divided instead of making one shard inherit the entire expensive area.
- Start with four shards × four workers: 16 concurrent tests overall. Increase only if the backend remains healthy.
- Do not slice by product area. Registry, programs, permissions, and automation differ substantially in duration; area shards would be badly imbalanced.
- Do not rely on worker count alone. Raising one job from 1 to 8 workers is the immediate emergency fix, but jobs provide more CPU/memory isolation and shorter critical paths.
- Give each shard a unique `E2E_RUN_ID`/email domain and its own org. Ideally each shard also gets its own core/Postgres instance. If all jobs share one backend, keep total concurrency around 12–16 until measurements prove otherwise.
- Build once, publish `.next`, then start a production server in each shard job. Merge blob reports afterward.
- If built-in test-count balancing leaves more than roughly 15–20% duration skew, create duration-aware buckets from prior reports. Do not begin with a hand-maintained file list.

`describe.configure({ mode: 'parallel' })` would be redundant with global `fullyParallel`. Conversely, reverting to file-level parallelism would reduce repeated `beforeAll` execution but create poor load balancing across these oversized files. The right fix is worker-scoped fixtures, not serializing files.

### Realistic floor

For all 724 tests against a real shared backend:

- One production-build job, eight tuned workers: approximately **10–15 minutes**.
- Four shards with 12–16 total workers and per-shard orgs: approximately **4–7 minutes test time**.
- With one shared, contended backend: expect more like **6–10 minutes**.
- Including a non-cached build and initial auth seed: approximately **6–9 minutes** is a realistic pipeline floor.

Getting materially below four minutes while retaining all 724 real-backend browser tests is unlikely. A curated 200–300-test E2E suite could reasonably reach a 2–4-minute test phase.

Do not reuse browser contexts across unrelated tests. Playwright already reuses the browser process per worker; fresh contexts protect cookies, search preferences, theme, table settings, and local storage. Merge tiny tests into coherent journeys where appropriate, but do not create a shared mutable browser context as a speed hack.

## 2. CORRECTNESS & FLAKINESS

### Shared state is the largest systemic risk

The documentation admits that one org is concurrently mutated by eight workers and warns against counts and default-page assumptions ([README.md:39](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/README.md:39)). The same document later requires every test to clean up its own state ([README.md:213](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/README.md:213)), which the suite generally does not do.

Most created records are never deleted. This causes:

- Persistent database growth and progressively slower queries.
- Records moving across pagination boundaries.
- “First row” and `nth(1)` selectors targeting unrelated records.
- Tests passing only because another spec previously seeded the required entity.
- Different behavior when a spec is run alone versus in the full suite.

A concrete cross-spec dependency exists in programs: group-assignment helpers select the first available group checkbox ([programs-crud.spec.ts:476](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/programs-crud.spec.ts:476)), but that file never seeds a group. It depends on old database state or `user-management` running first.

### `fullyParallel` multiplies `beforeAll`

With full parallelism, a `beforeAll` containing tests is executed once per worker group, not reliably once per file. There are 19 `beforeAll` hooks.

For example, permission gating seeds a policy, procedure, and risk in one hook ([permissions.spec.ts:196](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/permissions.spec.ts:196)). Under parallel distribution, that hook may seed the same three entity types several times. Similar owner login hooks are repeated in every major CRUD file.

Move owner API authentication to a worker-scoped fixture. Seed only the entity required by each test, or seed immutable fixture data once per isolated shard.

### Names are not reliably unique across workers

Several “unique” generators combine `RUN_ID`, `Date.now()`, and a process-local counter, such as [registry-crud.spec.ts:13](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:13). Counters reset in every worker process, and workers can call `Date.now()` in the same millisecond.

Use a central ID factory incorporating shard, `parallelIndex`, retry, test identity, and a random UUID. This also makes failed records attributable to their test.

### Search assertions can pass during an intermediate empty state

A recurring pattern is:

1. Fill the search input.
2. Assert the nonmatching row has count zero.
3. Assert the matching row appears.

In tasks, the negative assertion happens before the positive response marker ([tasks.spec.ts:89](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/tasks.spec.ts:89)). It can pass while the table is temporarily empty, then never be checked again after the matching response arrives.

Wait for the specific GraphQL response or matching unique row first, then assert the nonmatching row remains absent. Registry generally uses the safer order ([registry-crud.spec.ts:51](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:51)), although the asset-type test searches the broad term `E2E`, making pagination and accumulated data relevant ([registry-crud.spec.ts:541](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:541)).

### False greens and vacuous skips

Several tests silently stop covering their named behavior:

- Registry bulk-edit skips if any system-detail row is unavailable instead of seeding one ([registry-crud.spec.ts:804](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:804)).
- Task board persistence skips if the board button disappears—the exact regression it claims to detect ([tasks.spec.ts:604](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/tasks.spec.ts:604)).
- Dashboard navigation has four tests that skip based on whichever shared-org branch happens to render ([dashboard.spec.ts:128](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/dashboard.spec.ts:128)).
- Standards permission tests skip when no standard is available ([permissions.spec.ts:244](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/permissions.spec.ts:244)).
- SSO tests wait two seconds and then skip on an unconfigured org ([organization-settings.spec.ts:454](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/organization-settings.spec.ts:454)).
- A cross-cutting auth test explicitly accepts either `/signup` or `/dashboard`, so it detects little beyond “did not crash” ([cross-cutting.spec.ts:15](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/cross-cutting.spec.ts:15)).

The static scan found 23 runtime `test.skip` calls. Environment-dependent capabilities should be separate configured projects with explicit prerequisites. Required coverage should fail setup rather than quietly skip.

### Absence checks sometimes prove the wrong thing

The permission suite acknowledges that member/readonly users may be unable to load an owner-created control at all ([permissions.spec.ts:122](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/permissions.spec.ts:122)). Asserting that the Edit button is absent after only checking the app shell can therefore pass because the entity itself was denied or failed to load, not because the affordance was correctly gated.

For negative permission tests, first assert a role-specific positive marker: entity name, detail heading, or explicit access-denied state. Then assert the action is absent.

The auditor evidence test seeds a particular evidence record but only checks that _some_ Approve button exists on the current page ([permissions.spec.ts:446](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/permissions.spec.ts:446)). Old evidence can make it pass even if the new record is buried or inaccessible.

### Assertions that can pass with no operation

The duplicate-query regression test collects requests, sleeps three seconds, then only asserts that no variable set repeats ([controls-crud.spec.ts:695](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/controls-crud.spec.ts:695)). Zero requests satisfy that assertion. It must first prove exactly one relevant list request occurred.

Other weak validations include:

- Empty risk submission only asserts that the form and URL remain ([exposure-crud.spec.ts:24](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/exposure-crud.spec.ts:24)).
- Registry required-field tests assert that the first textbox is focused, not that the correct validation message appears ([registry-crud.spec.ts:207](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:207)).
- Campaign edits titled “persists” only assert a toast; they do not reload or read the value back ([automation-crud.spec.ts:369](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/automation-crud.spec.ts:369)).
- Exposure checks any matching local-storage value rather than the exact key/value written by the drill-through ([exposure-crud.spec.ts:674](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/exposure-crud.spec.ts:674)).

### Hard waits and selectors

Hard waits are limited but occur in sensitive places:

- Onboarding uses 250 ms step waits and repeated 1.5-second navigation polling ([onboarding.ts:50](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/utils/onboarding.ts:50)).
- Duplicate-query detection sleeps three seconds.
- SSO capability detection sleeps two seconds.

Wait for a network response, URL/session state, or rendered marker instead.

The scan found 539 `.first()`, `.last()`, and `.nth()` calls. Some are justified by duplicate accessible markup, but many are brittle:

- Icon CSS to switch controls view ([controls-crud.spec.ts:43](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/controls-crud.spec.ts:43)).
- First button in `<main>` for Exposure settings ([exposure-crud.spec.ts:384](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/exposure-crud.spec.ts:384)).
- Second checkbox as the assumed first data row in program assignment ([programs-crud.spec.ts:381](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/programs-crud.spec.ts:381)).
- Last row button as a token action menu ([developers.spec.ts:226](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/developers.spec.ts:226)).

Add accessible names or stable test IDs to these controls and target the uniquely seeded row.

### Auth reuse is not actually validated

`canReuseAuth` only checks file age and existence ([global-setup.ts:107](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/global-setup.ts:107)). It does not verify the backend session, shared org, seeded control, or demo file. Worse, the batched runner touches the manifest to keep it “fresh” without refreshing authentication ([run-sharded.sh:87](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/run-sharded.sh:87)).

`saveAuthState` also extends cookie expiry in JSON ([global-setup.ts:26](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/global-setup.ts:26)); that cannot extend backend token validity. Reuse should perform a lightweight authenticated health check and reseed on failure.

The API helper also documents that mutations may return errors after successfully writing because of FGA lag ([api.ts:53](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/utils/api.ts:53)), while the generic seeder requires a successful payload immediately ([api.ts:120](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/utils/api.ts:120)). That contradiction is a likely source of intermittent setup failures.

## 3. STRUCTURE & MAINTAINABILITY

The API seeding foundation is useful, but the fixture layer is much too thin.

- `fixtures/auth.ts` only supplies storage state ([auth.ts:34](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/fixtures/auth.ts:34)). It should expose worker-scoped `ownerApi`, validated manifest data, role profiles, a unique-name factory, and per-test cleanup tracking.
- The README says page objects exist for high-traffic pages ([README.md:78](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/README.md:78)), but `e2e/pages/` is empty.
- Registry duplicates `createPersonnelViaUI` and `createSystemDetailViaUI` in multiple describes ([registry-crud.spec.ts:361](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:361), [registry-crud.spec.ts:590](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/registry-crud.spec.ts:590)).
- Developer token creation exists in several slightly different helpers ([developers.spec.ts:112](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/developers.spec.ts:112), [developers.spec.ts:204](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/developers.spec.ts:204), [developers.spec.ts:442](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/developers.spec.ts:442)).
- Every CRUD spec independently defines `counter`, `uniqueName`, and an owner API `beforeAll`.
- `AUTH_STRATEGY.md` is stale: it says there is no shared E2E org ([AUTH_STRATEGY.md:155](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/AUTH_STRATEGY.md:155)), contradicting the implementation and README. Its implementation checklist also remains unchecked for files that already exist.
- `run-sharded.sh` should not be named “sharded”; it sequentially batches spec files and discards normal Playwright reporting semantics.
- `foo.spec.ts` versus `foo-crud.spec.ts` does not communicate tier or intent clearly. Prefer names such as `controls.smoke`, `controls.lifecycle`, `controls.permissions`, and `controls.ui-contract`, with the last category likely moved out of E2E.

Use task-oriented flow objects rather than enormous page-object classes: `TasksPage.create`, `TasksPage.search`, `TokenDialog.create`, `RegistryPage.openRow`. They should contain navigation and stable selectors, while assertions remain in tests.

Seeders should return typed disposable resources or register created IDs with a cleanup fixture. Cleanup can run through APIs in `afterEach`; it should tolerate already-deleted objects.

## 4. COVERAGE STRATEGY

More E2E is not the right default. The coverage audit reports 1,568 identified flows and roughly 20% coverage ([COVERAGE.md:5](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/COVERAGE.md:5)). The suite already contains 724 tests because many tests are one browser assertion each, not because it has broad business-flow coverage.

Use this split:

| Layer                     | What belongs there                                                                                                                                                                                                                                                   |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                      | Filter builders, enum formatting, storage keys, permission predicates, date validation, wizard transition rules, sorting, derived counts.                                                                                                                            |
| Component/integration     | Dialog-open behavior, field validation, tab switching, column menus, filter options, button enabled/disabled state, Radix interaction, permission-based visibility with explicit role inputs.                                                                        |
| API/backend integration   | CRUD semantics, server-side search/filter/sort, permission matrix, associations, FGA propagation, pagination, membership roles. Most of this belongs in `theopenlane/core`.                                                                                          |
| E2E with real backend     | Login/signup/onboarding, one representative lifecycle per critical entity, one real server-side search/filter contract, cross-object linking, file upload/download, destructive confirmations, critical multi-role flows, and the most important wizard happy paths. |
| Small cross-browser smoke | Login, dashboard, one CRUD flow, major navigation, and file upload on Chromium/Firefox/WebKit.                                                                                                                                                                       |

Examples to move down:

- Campaign stepper scaffold and button visibility tests at [automation-crud.spec.ts:57](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/automation-crud.spec.ts:57).
- Column/filter/menu presence across registry and exposure.
- Task quick-filter class toggling at [tasks.spec.ts:409](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/tasks.spec.ts:409).
- Token scope preset UI state at [developers.spec.ts:595](/home/bruno/projects/openlane/openlane-ui/apps/console/e2e/tests/developers.spec.ts:595).
- Most permission affordance combinations, provided a smaller real-backend permission smoke remains.

Keep in E2E:

- Auth and onboarding happy/error paths.
- Control/policy/procedure/program lifecycle.
- Evidence upload and linking.
- Campaign/questionnaire send.
- One owner/admin/member/auditor contrast per permission family.
- A small number of server-side search and persistence checks.

An appropriate target is roughly **150–250 Chromium E2E tests on PRs**, with **20–40 cross-browser smoke tests** and a broader real-backend suite nightly if needed. Coverage should be tracked by risk-weighted business journey, not raw route-flow inventory.

## 5. TOP 10 ACTIONS

1. **Make Mode B the default full-suite path.**  
   Files: `apps/console/package.json`, `apps/console/e2e/README.md`, CI configuration.  
   Payoff: reduce approximately 45 minutes to 10–15 minutes before any test rewrite.

2. **Add four built-in Playwright shards and remove the CI one-worker clamp.**  
   Files: `apps/console/playwright.config.ts`; add the E2E workflow in the actual CI repository.  
   Payoff: approximately 4–7-minute test phase with healthy backend capacity.

3. **Provision a unique org and auth profiles per shard.**  
   Files: `e2e/global-setup.ts`, `e2e/utils/constants.ts`, `e2e/fixtures/auth.ts`.  
   Payoff: enables safe sharding, removes cross-shard mutation, and reduces order-dependent flakes.

4. **Replace `seedLoggedInUser` UI onboarding with a programmatic fresh-org fixture.**  
   Files: `e2e/utils/seedUser.ts`, `e2e/utils/api.ts`, especially `user-management.spec.ts`, `tasks.spec.ts`, and empty-state specs.  
   Payoff: eliminate 3.6–4.5 minutes of serial aggregate setup. Keep real UI onboarding only in `onboarding.spec.ts`.

5. **Create worker-scoped `ownerApi` and central unique-ID fixtures.**  
   Files: `e2e/fixtures/auth.ts`, `e2e/utils/api.ts`; remove repeated `beforeAll` login and local counters from CRUD specs.  
   Payoff: less repeated seeding/authentication, collision-free data, better shard balance.

6. **Eliminate vacuous skips and weak assertions.**  
   Files: `registry-crud.spec.ts`, `tasks.spec.ts`, `dashboard.spec.ts`, `permissions.spec.ts`, `organization-settings.spec.ts`, `controls-crud.spec.ts`.  
   Payoff: converts false greens into real coverage and exposes missing prerequisites immediately.

7. **Move static UI-contract tests to component/integration tests.**  
   Files: begin with `automation-crud.spec.ts`, `controls-crud.spec.ts`, `exposure-crud.spec.ts`, `developers.spec.ts`, and `programs-crud.spec.ts`.  
   Payoff: remove 30–50% of browser tests while increasing deterministic coverage.

8. **Extract task-oriented flows and remove positional selectors.**  
   Files: populate `e2e/pages/`; start with tasks, registry, programs, and developer tokens. Add accessible names/test IDs in app components where necessary.  
   Payoff: substantial maintenance reduction and fewer detached/wrong-element flakes.

9. **Set retries to zero locally/one in CI and capture trace/video on retry.**  
   File: `apps/console/playwright.config.ts`.  
   Payoff: shorter failure tail, less artifact I/O, and visible flaky-test debt.

10. **Retire the sequential “sharded” runner and harden auth reuse.**  
    Files: `e2e/run-sharded.sh`, `e2e/global-setup.ts`, `e2e/README.md`, `e2e/AUTH_STRATEGY.md`.  
    Payoff: avoids repeated dev compilation, prevents stale-session reuse, and removes misleading/stale documentation.

No tests were executed and no files were changed.

Suggested commit after implementing the first performance tranche:

```bash
git commit -s -m "test(e2e): shard and stabilize Playwright execution"
```
