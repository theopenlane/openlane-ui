import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

// Automation subroutes other than /tasks (covered in tasks.spec.ts).
// /automation/exposure renders a "Coming soon" placeholder under the
// Exposure heading; we still exercise the route to catch routing breaks.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/automation/assessments', heading: /^Questionnaires$/ },
  { path: '/automation/campaigns', heading: /^Campaigns$/ },
  { path: '/automation/communications', heading: /^Communications$/ },
  // Empty workflows shows "Create your first workflow" instead of a
  // "Workflows" heading. Match either to stay green across both states
  // — note the regex matches singular "workflow" too.
  { path: '/automation/workflows', heading: /workflow/i },
  { path: '/automation/exposure', heading: /^Exposure$/ },
]

test.describe('automation — other subroutes render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await seedLoggedInUser(page, `auto-${path.split('/').pop()}`)

      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})
