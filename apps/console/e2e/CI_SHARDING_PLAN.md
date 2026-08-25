# CI sharding plan

How to run the 723-test Playwright suite across parallel GitHub Actions jobs.
Based on [playwright.dev/docs/ci](https://playwright.dev/docs/ci#github-actions)
and [playwright.dev/docs/test-sharding](https://playwright.dev/docs/test-sharding).

## The constraint that shapes everything

Playwright's sharding examples assume the app under test needs nothing but a
build. Ours needs a whole backend: postgres, redis, openfga, riverboat and the
core API on :17608. GitHub-hosted runners **cannot share a service between
matrix jobs**, so every shard has to bring up its own core stack.

That has one very good consequence and one cost:

- **Good:** shards get separate databases, so cross-shard data isolation is
  free. There is no need to make `E2E_RUN_ID` shard-aware for correctness (we
  still do it, so artifacts are readable).
- **Cost:** stack startup, `next build` and the ~40s `global-setup` seed are
  paid once _per shard_. Sharding trades job-minutes for wall-clock.

## What has to change in the repo

### 1. Blob reporter on CI

Sharded runs must emit blob reports and merge them afterwards. In
`playwright.config.ts`:

```ts
reporter: process.env.CI
  ? [['blob', { outputDir: './e2e/blob-report' }]]
  : [['list'], ['html', { outputFolder: './e2e/playwright-report', open: 'never' }]],
```

The merge job turns the blobs into HTML _and_ GitHub annotations, so nothing is
lost by dropping the `github` reporter from the shard jobs:

```bash
bunx playwright merge-reports --reporter html,github ./all-blob-reports
```

### 2. `fullyParallel` stays on

Already set. It is what lets Playwright split at the individual test level; with
it off, shards split by file and our wildly uneven files (`permissions.spec.ts`
has 59 tests, `smoke.spec.ts` has 1) would produce badly unbalanced shards.

### 3. Shard args reach the runner already

`run-prod-suite.sh` ends in `bunx playwright test "$@"`, so
`bun run e2e:full -- --shard=1/4` works with no script change.

## Workflow topology

```
console-checks.yml   (unchanged, every PR — tsc, unit tests, --list, no backend)

console-e2e.yml
  ├─ e2e (matrix: shardIndex 1..N, shardTotal N, fail-fast: false)
  │    core stack up → bun install → playwright install → next build
  │    → run --shard=i/N → upload blob-report-i
  └─ merge-reports (needs: e2e, if: !cancelled())
       download blob-report-* → merge-reports → upload html-report
```

### Shard job

```yaml
e2e:
  name: e2e (${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
  runs-on: ubuntu-latest
  timeout-minutes: 45
  strategy:
    fail-fast: false
    matrix:
      shardIndex: [1, 2, 3, 4]
      shardTotal: [4]
  env:
    E2E_PORT: '3001'
    E2E_WORKERS: '4'
    E2E_RUN_ID: s${{ matrix.shardIndex }}-${{ github.run_id }}
    COOKIE_PLAYWRIGHT_INSECURE: 'true'
    AUTH_TRUST_HOST: 'true'
  steps:
    - uses: actions/checkout@v6
    - uses: actions/checkout@v6
      with: { repository: theopenlane/core, path: core, ref: main }
    - name: Start core stack
      working-directory: core
      run: |
        cp config/config-dev.example.yaml config/.config.yaml
        docker compose \
          -f ./docker/docker-compose-redis.yml \
          -f ./docker/docker-compose-fga.yml \
          -f ./docker/docker-compose-riverboat.yml \
          -f ./docker/docker-compose-published.yml up -d
    - name: Wait for core
      run: |
        for _ in $(seq 1 60); do
          curl -sf --max-time 5 http://localhost:17608/livez >/dev/null && exit 0
          sleep 5
        done
        echo "core did not become healthy on :17608" >&2
        exit 1
    - uses: oven-sh/setup-bun@v2
      with: { bun-version: 1.3.13 }
    - run: bun install --frozen-lockfile
    - name: Write console env
      run: |
        sed -e "s|^AUTH_SECRET=.*|AUTH_SECRET=$(openssl rand -base64 32)|" \
            -e "s|^NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=$(openssl rand -base64 32)|" \
            config/.env.example > apps/console/.env
    - name: Install Playwright browsers
      working-directory: apps/console
      run: bunx playwright install --with-deps chromium
    - name: Build console
      working-directory: apps/console
      run: bun run build
    - name: Run shard
      working-directory: apps/console
      env: { E2E_SKIP_BUILD: '1' }
      run: bun run e2e:full -- --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
    - name: Upload blob report
      if: ${{ !cancelled() }}
      uses: actions/upload-artifact@v4
      with:
        name: blob-report-${{ matrix.shardIndex }}
        path: apps/console/e2e/blob-report
        retention-days: 1
    - name: Core logs on failure
      if: failure()
      working-directory: core
      run: docker compose -f ./docker/docker-compose-published.yml logs --tail=500
```

### Merge job

```yaml
merge-reports:
  if: ${{ !cancelled() }}
  needs: [e2e]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v6
    - uses: oven-sh/setup-bun@v2
      with: { bun-version: 1.3.13 }
    - run: bun install --frozen-lockfile
    - uses: actions/download-artifact@v5
      with:
        path: all-blob-reports
        pattern: blob-report-*
        merge-multiple: true
    - name: Merge into HTML report
      run: bunx playwright merge-reports --reporter html,github ./all-blob-reports
    - uses: actions/upload-artifact@v4
      with:
        name: html-report--attempt-${{ github.run_attempt }}
        path: playwright-report
        retention-days: 14
```

## Choosing N

**Measure before committing to a number.** The only hard datum we have is local:
723 tests in 9.8 min at 8 workers on a 16-core box — about 78 worker-minutes,
~6.5 worker-seconds per test. A hosted runner is slower and shares its CPU with
postgres, openfga and the core API, so assume ~1.5x, i.e. ~117 worker-minutes.
Fixed per-shard overhead (image pulls, install, browser download, `next build`,
seeding) is the unknown; call it ~6 min pending measurement.

| N   | est. test time (4 workers) | + overhead | est. wall clock | job-minutes |
| --- | -------------------------- | ---------- | --------------- | ----------- |
| 1   | 29 min                     | 6 min      | ~35 min         | ~35         |
| 2   | 15 min                     | 6 min      | ~21 min         | ~42         |
| 4   | 7 min                      | 6 min      | ~13 min         | ~54         |
| 6   | 5 min                      | 6 min      | ~11 min         | ~72         |
| 8   | 4 min                      | 6 min      | ~10 min         | ~86         |

Returns collapse once test time drops below fixed overhead — past N=4 you buy
about two minutes for another 18 job-minutes. **Start at N=4.** Revisit only if
the measured overhead comes in much lower than 6 min.

`E2E_WORKERS: 4` assumes a 4-vCPU runner. If these runners are 2-vCPU, set it
to 2 and re-derive the table — the per-shard test time doubles and N=6-8 starts
to look reasonable again.

## Risks specific to this suite

| Risk                              | Detail                                                                                                                                                                                                                     | Mitigation                                                                                                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Port 3001 is mandatory**        | `core/config/config-dev.example.yaml` allows only `http://localhost:3001` in `server.cors.alloworigins`. The browser calls core directly, so any other port silently blocks every GraphQL POST with nothing in either log. | `E2E_PORT: '3001'` is pinned in the job env; `run-prod-suite.sh` hard-fails on other ports.                                                                                                 |
| **Serial describe**               | `onboarding.spec.ts:47` is `mode: 'serial'`. Sharding must keep that group intact or the downstream tests break.                                                                                                           | Playwright shards by test _group_, so a serial describe stays in one shard — confirm on the first sharded run that no onboarding test reports "did not run".                                |
| **`global-setup` runs per shard** | Each shard re-registers 4 role users and re-seeds an org (~40s), against its own database.                                                                                                                                 | Accepted; it is what buys the isolation. Do **not** try to share `.auth` between shards.                                                                                                    |
| **`next build` per shard**        | `.next` is 5.9 GB locally (mostly dev cache); a fresh CI build is much smaller but still far too big to pass between jobs as an artifact.                                                                                  | Rebuild per shard. Wall-clock cost is parallel. If job-minutes become the constraint, cache `.next/cache` with `actions/cache` keyed on the lockfile + source hash — not the whole `.next`. |
| **Flaky tail**                    | Last full run: 714 passed, 0 failed, **3 flaky**, absorbed by `retries: 1`. A flake in one shard fails only that shard.                                                                                                    | `fail-fast: false` so the other shards still produce blobs; the merged report shows flaky separately from failed.                                                                           |
| **Trigger cost**                  | N jobs × a full backend on every push would be expensive.                                                                                                                                                                  | Keep `console-checks.yml` as the every-PR gate. Run the sharded suite on `workflow_dispatch`, on PRs labelled `e2e`, and nightly on `main`.                                                 |

## Shard balance (measured)

`playwright test --list --shard=i/4` on the current suite:

| shard | tests |
| ----- | ----- |
| 1/4   | 181   |
| 2/4   | 181   |
| 3/4   | 181   |
| 4/4   | 180   |

723 total, near-perfect balance — `fullyParallel` is doing its job. Re-check
this after any large authoring push.

## Status

Implemented at N=4 on every pull request. Still open:

1. **Read the step timings from the first real run.** The wall-clock table above
   is extrapolated from a local 16-core box; the fixed per-shard overhead
   (image pulls, install, browser download, `next build`, seeding) has never
   been measured on a hosted runner.
2. **Re-derive N** from those numbers. If overhead lands well under 6 min, N=6
   becomes worth the job-minutes; if the runners turn out to be 2-vCPU, drop
   `E2E_WORKERS` to 2 and N goes up.
3. **Watch for timeout-shaped flakiness** in the first few runs. Four Playwright
   workers share the runner with postgres, openfga, redis, riverboat, core and
   the Next server; if failures cluster on `actionTimeout`, lower
   `E2E_WORKERS` before touching anything else.
