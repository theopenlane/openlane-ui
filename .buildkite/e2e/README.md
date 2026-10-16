# Console e2e tests

Runs the console Playwright suite against a core stack the build starts
itself. The stack is core's own compose files, this directory only adds the console layer.

| File                         |                                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pipeline.yaml`              | the pipeline: checkout of core + this repo, unit tests, console build, sharded e2e, HTML report, test summary, Slack                                                                    |
| `docker-compose.yml`         | the console layer over core's compose files: the `e2e` runner, no host ports, riverboat and the api adjusted for CI                                                                     |
| `run-shard.sh`               | runs inside `e2e`: unpacks the shared console build, serves it, runs one Playwright shard                                                                                               |
| `../plugins/core-dev-config` | vendored plugin: checks core out at its newest release tag, copies core's dev configs into place (`config/.config.yaml`, riverboat's `.config.yaml`) as core's `ensure-config` tasks do |
| `summarize.py`               | the `test summary` step: reads the JUnit artifacts and writes the unit and e2e annotations                                                                                              |
| `console.env`                | console settings for the run; third-party features (AI, chat, analytics, billing) off                                                                                                   |

## How a run works

1. **`unit tests`** runs the repo's unit tests (`bun test apps/console/src packages`, the
   root `test` script) in `oven/bun`, with JUnit output. The e2e shards depend on it, so a
   unit failure stops the build before any stack is started.
2. **`console build`** runs alongside the unit tests: one production build of the console
   (`bun run build` with `console.env`), uploaded as `console-next.tgz` (`.next` without its
   cache). Every shard downloads it and serves it, instead of building its own.
3. **`console e2e`** runs as `parallelism` jobs. In each one:
   - `custom-checkout` shallow-clones the tip of core's `main` into the job's directory and this
     repo into `console/`;
   - `core-dev-config` (vendored here) checks core out at `E2E_CORE_REF` (its newest release
     tag), then copies core's dev configs into place, as core's `ensure-config-api` /
     `ensure-config-river` tasks do;
   - `docker-compose` runs `e2e` with core's `docker-compose-redis`, `-fga` (which includes
     `-pg`), `-riverboat` and `-published` files plus `docker-compose.yml` from here, the
     same set `task core:published` uses. Compose starts what `e2e` depends on (api,
     riverboat, postgres, openfga, redis) and tears it all down afterwards.

   `e2e` shares the API container's network, so `localhost:17608` is core and
   `localhost:3001` is the console, as on a laptop. Playwright's `--shard` splits the suite
   across the jobs; each writes a blob report and JUnit results as artifacts.

4. **`HTML report`** merges the shards' blob reports into one Playwright report
   (`playwright-report/index.html` in the build artifacts, with traces for failures).
5. **`test summary`** (`summarize.py`) adds one annotation per suite to every build: the
   title, then passed / failed / skipped counts, a link to the HTML report (e2e),
   and the failed test names in a collapsed list.
6. **Slack**: the pipeline's `notify` posts when a scheduled (nightly) build fails.
   Passing nightlies, and builds started by hand or by a push, don't notify.

Console server logs from each job are in `console/e2e-logs/` in that job's artifacts.

## Settings

| Setting          | Where                                 | Default           |                                                                                                                                                   |
| ---------------- | ------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `E2E_CORE_REF`   | build env                             | newest `vX.Y.Z`   | core tag the compose files, dev configs and api image (`ghcr.io/theopenlane/core:<tag>`) come from; fails if that tag's image isn't published yet |
| `RIVERBOAT_TAG`  | `pipeline.yaml` env                   | `amd64-latest`    | core's riverboat file defaults to `arm64-latest`                                                                                                  |
| bun image        | `pipeline.yaml`                       | `oven/bun:1.3.13` | keep in step with `packageManager` in `package.json`                                                                                              |
| `parallelism`    | `pipeline.yaml`                       | `6`               | number of shards                                                                                                                                  |
| `E2E_WORKERS`    | `pipeline.yaml` env                   | `4`               | Playwright workers per shard                                                                                                                      |
| Playwright image | `docker-compose.yml`, `pipeline.yaml` | `v1.63.0-noble`   | must match `@playwright/test` in `bun.lock`                                                                                                       |
