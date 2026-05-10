import { defineConfig, devices } from '@playwright/test'

const PORT = process.env.E2E_PORT ?? '3001'
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './e2e/.test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // 1 retry locally absorbs the dev backend's register/login race when
  // many parallel workers seed users at once. Tests still pass cleanly
  // in isolation; the retry exists to soak up the contention flake and
  // keep the suite green. CI keeps 2 retries (more workers, more load).
  retries: process.env.CI ? 2 : 1,
  // Cap local concurrency to 3. seedLoggedInUser hits /v1/register +
  // /v1/login + completes onboarding — the dev backend doesn't love
  // many of those running simultaneously. AUTH_STRATEGY.md plans a
  // global-setup storage-state pattern to remove this; until that
  // lands, 3 workers is the sweet spot between speed and contention
  // flake. CI runs serially (one worker, two retries).
  workers: process.env.CI ? 1 : 3,
  reporter: process.env.CI ? [['github'], ['html', { outputFolder: './e2e/playwright-report', open: 'never' }]] : [['list'], ['html', { outputFolder: './e2e/playwright-report', open: 'never' }]],

  // Default per-test timeout. Most specs use seedLoggedInUser, which
  // burns 10–15s on register + verify + login + onboarding. Pages with
  // heavy data (e.g. /standards rendering a full catalog) can push the
  // total well past 30s. 60s gives headroom without masking real hangs.
  timeout: 60_000,

  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
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
