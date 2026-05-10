import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

// Automation subroutes other than /tasks (covered in tasks.spec.ts).
// /automation/exposure renders a "Coming soon" placeholder under the
// Exposure heading; we still exercise the route to catch routing breaks.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/automation/assessments', heading: /^Questionnaires$/ },
  { path: '/automation/assessments/templates', heading: /^Templates$/ },
  { path: '/automation/campaigns', heading: /^Campaigns$/ },
  { path: '/automation/communications', heading: /^Communications$/ },
  // Empty workflows shows "Create your first workflow" instead of a
  // "Workflows" heading. Match either to stay green across both states
  // — note the regex matches singular "workflow" too.
  { path: '/automation/workflows', heading: /workflow/i },
  { path: '/automation/workflows/wizard', heading: /^New Workflow$/ },
  { path: '/automation/workflows/editor', heading: /^Editor$/ },
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

// The workflow inbox / instances / templates pages render their visible
// heading text inside a nested <h1> (inside PageHeading's <h2>). Match by
// text to dodge the invalid-h1-inside-h2 role ambiguity.
const NESTED_H1_ROUTES: Array<{ path: string; text: RegExp }> = [
  { path: '/automation/workflows/inbox', text: /^Workflow Inbox$/ },
  { path: '/automation/workflows/instances', text: /^Workflow Instances$/ },
  { path: '/automation/workflows/templates', text: /^Workflow Templates$/ },
]

test.describe('automation — workflows subroutes (nested-h1 variant)', () => {
  for (const { path, text } of NESTED_H1_ROUTES) {
    test(`${path} renders the page heading text`, async ({ page }) => {
      await seedLoggedInUser(page, `auto-${path.split('/').pop()}`)

      await page.goto(path)

      // workflow-inbox-page.tsx (and siblings) pass JSX with an inner
      // <h1>Workflow Inbox</h1> to PageHeading's `heading` prop. Match
      // by role+name so we accept either the outer <h2> or inner <h1>.
      await expect(page.getByRole('heading', { name: text }).first()).toBeVisible({ timeout: 15_000 })
    })
  }
})

// Editor / viewer routes that all happen to use the heading "Editor" or
// "Preview" — disambiguate via the eyebrow text alongside.
const EYEBROW_HEADING_ROUTES: Array<{ path: string; eyebrow: RegExp; heading: RegExp }> = [
  { path: '/automation/assessments/questionnaire-editor', eyebrow: /^Questionnaires$/, heading: /^Editor$/ },
  { path: '/automation/assessments/questionnaire-viewer', eyebrow: /^Questionnaires$/, heading: /^Preview$/ },
  { path: '/automation/assessments/templates/template-editor', eyebrow: /^Templates$/, heading: /^Editor$/ },
  { path: '/automation/assessments/templates/template-viewer', eyebrow: /^Templates$/, heading: /^Preview$/ },
]

test.describe('automation — assessments editor / viewer routes', () => {
  for (const { path, eyebrow, heading } of EYEBROW_HEADING_ROUTES) {
    test(`${path} renders the ${heading.source} heading with the right eyebrow`, async ({ page }) => {
      await seedLoggedInUser(page, `auto-${path.split('/').pop()}`)

      await page.goto(path)

      // PageHeading renders eyebrow as a <span> directly above the <h2>.
      // Owner-role users pass the canEdit gate in the *-editor-page
      // wrappers, so the PageHeading branch is the one we hit.
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(eyebrow).first()).toBeVisible()
    })
  }
})
