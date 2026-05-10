import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

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
      await seedLoggedInUser(page, `os-${path.split('/').pop()}`)

      await page.goto(path)

      // PageHeading from @repo/ui renders the heading as an <h2>.
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})
