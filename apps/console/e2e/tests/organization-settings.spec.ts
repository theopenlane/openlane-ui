import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Owner-only settings pages.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/organization-settings', heading: /^Organization settings$/ },
  { path: '/organization-settings/general-settings', heading: /^General$/ },
  { path: '/organization-settings/custom-data', heading: /^Custom Data$/ },
  { path: '/organization-settings/billing', heading: /^Billing$/ },
  { path: '/organization-settings/authentication', heading: /^Authentication$/ },
  { path: '/organization-settings/integrations', heading: /^Integrations$/ },
  { path: '/organization-settings/logs', heading: /^Audit Logs$/ },
  { path: '/organization-settings/subscribers', heading: /^Subscribers$/ },
]

test.describe('organization-settings — pages render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })

      // PageHeading from @repo/ui renders the heading as an <h2>. Generous
      // timeout absorbs first-hit route compilation in the dev server.
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 20_000 })
    })
  }
})
