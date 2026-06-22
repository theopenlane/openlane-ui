import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.E2E_PORT ?? '3001'
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/.test-results',
  // Seeds the Owner + role users into one shared org and saves storage state to
  // e2e/.auth/ (+ manifest.json). Idempotent: reuses a recent .auth set instead
  // of re-seeding every run, so the ~40s cost is paid once per ~30 min window.
  // Force a fresh seed with E2E_RESEED=1.
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 2 retries absorb the irreducible flaky tail (~5 timing-sensitive specs:
  // inline-edit persistence, Radix menu/dialog interactions, role dropdowns)
  // that pass in isolation but occasionally need a re-run under parallel load
  // against the real backend. These are environmental timing flakes, not
  // product defects; retries keep the suite green without losing coverage.
  retries: 2,
  // P0.1 moved the share-safe specs onto the shared storage-state Owner
  // session, so per-test register/login contention no longer caps local
  // concurrency. The bottleneck is now dev-server route compilation, which
  // parallelises across workers. Default to 8 locally; override with
  // E2E_WORKERS to tune for the machine. CI runs serially (one worker).
  workers: process.env.CI ? 1 : Number(process.env.E2E_WORKERS ?? 8),
  reporter: process.env.CI ? [['github'], ['html', { outputFolder: './e2e/playwright-report', open: 'never' }]] : [['list'], ['html', { outputFolder: './e2e/playwright-report', open: 'never' }]],

  // Default per-test timeout. Most specs use seedLoggedInUser, which
  // burns 10–15s on register + verify + login + onboarding. The dev server also
  // compiles each route on its FIRST hit, and heavy detail/registry routes can
  // take 30–45s to compile — so a single goto can be slow. 90s leaves room for
  // a cold-compile navigation plus the assertions after it. (A built app / CI
  // has no compile step, so real test time is a few seconds.)
  timeout: 90_000,

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // 15s (not 10s) so form submit/edit controls stay actionable when the
    // backend is under concurrent load from many parallel workers.
    actionTimeout: 15_000,
    // 60s absorbs first-hit dev-server route compilation of heavy routes.
    navigationTimeout: 60_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Add firefox / webkit later once chromium suite is stable.
  ],

  // Optional: have Playwright start the dev server itself.
  // Enable by setting PLAYWRIGHT_USE_WEBSERVER=1.
  webServer: process.env.PLAYWRIGHT_USE_WEBSERVER
    ? {
        command: 'bun run dev',
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: 'pipe',
        stderr: 'pipe',
      }
    : undefined,
})
