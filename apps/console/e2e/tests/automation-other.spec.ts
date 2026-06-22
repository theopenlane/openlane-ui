import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup).
// Automation subroutes other than /tasks (covered in tasks.spec.ts).
// /automation/exposure renders a "Coming soon" placeholder under the
// Exposure heading; we still exercise the route to catch routing breaks.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/automation/questionnaires', heading: /^Questionnaires$/ },
  { path: '/automation/questionnaires/templates', heading: /^Templates$/ },
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
  { path: '/automation/questionnaires/questionnaire-editor', eyebrow: /^Questionnaires$/, heading: /^Editor$/ },
  { path: '/automation/questionnaires/questionnaire-viewer', eyebrow: /^Questionnaires$/, heading: /^Preview$/ },
  { path: '/automation/questionnaires/templates/template-editor', eyebrow: /^Templates$/, heading: /^Editor$/ },
  { path: '/automation/questionnaires/templates/template-viewer', eyebrow: /^Templates$/, heading: /^Preview$/ },
]

test.describe('automation — assessments editor / viewer routes', () => {
  for (const { path, eyebrow, heading } of EYEBROW_HEADING_ROUTES) {
    test(`${path} renders the ${heading.source} heading with the right eyebrow`, async ({ page }) => {
      await page.goto(path)

      // PageHeading renders eyebrow as a <span> directly above the <h2>.
      // Owner-role users pass the canEdit gate in the *-editor-page
      // wrappers, so the PageHeading branch is the one we hit.
      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(eyebrow).first()).toBeVisible()
    })
  }
})

test.describe('automation — workflow wizard scaffold', () => {
  test('the wizard renders its 4-step nav (Flow / Refine / Configure / Review)', async ({ page }) => {
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^New Workflow$/ })).toBeVisible({ timeout: 20_000 })

    // workflow-wizard-page.tsx defines steps via @stepperize; wizard/nav.tsx
    // renders each step's label as a <span>.
    for (const label of ['Flow', 'Refine', 'Configure', 'Review']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    }
  })
})

test.describe('automation — campaigns create', () => {
  test('Create Campaign opens the campaign creation stepper sheet', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Campaigns$/ })).toBeVisible({ timeout: 20_000 })

    // campaigns-table-toolbar.tsx renders a "Create Campaign" primary button that
    // opens a StepperSheet titled "Create Campaign".
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()
    await expect(page.getByRole('dialog').getByText('Create Campaign').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('automation — communications tabs', () => {
  test('communications page toggles between Email and Notification template tabs', async ({ page }) => {
    await page.goto('/automation/communications', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Communications$/ })).toBeVisible({ timeout: 20_000 })

    // communications-page.tsx Radix tabs: "Email Templates" / "Notification Templates".
    const email = page.getByRole('tab', { name: /Email Templates/ })
    const notification = page.getByRole('tab', { name: /Notification Templates/ })
    await expect(email).toBeVisible()
    await expect(notification).toBeVisible()

    await notification.click()
    await expect(notification).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
    await expect(email).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('automation — workflow editor (render + validation)', () => {
  test('the editor mounts the Workflow Details/Settings/Builder cards with name + schema fields', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Editor$/ })).toBeVisible({ timeout: 20_000 })

    // workflow-editor.tsx renders three CardTitle headings and the details form.
    await expect(page.getByText('Workflow Details', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Settings', { exact: true })).toBeVisible()
    await expect(page.getByText('Workflow Builder', { exact: true })).toBeVisible()
    await expect(page.getByPlaceholder('Control approval workflow')).toBeVisible()
    await expect(page.getByPlaceholder('Describe what this workflow does')).toBeVisible()
  })

  test('the builder toggles between the Form and Visual editor tabs', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Workflow Builder', { exact: true })).toBeVisible({ timeout: 20_000 })

    // workflow-editor.tsx Tabs: "Form" / "Visual" control the builder surface.
    const form = page.getByRole('tab', { name: /^Form$/ })
    const visual = page.getByRole('tab', { name: /^Visual$/ })
    await expect(form).toBeVisible({ timeout: 15_000 })
    await form.click()
    await expect(form).toHaveAttribute('data-state', 'active', { timeout: 10_000 })
    await visual.click()
    await expect(visual).toHaveAttribute('data-state', 'active', { timeout: 10_000 })
  })

  test('saving with an empty name surfaces the "Workflow name is required" error', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create workflow$/ })).toBeVisible({ timeout: 20_000 })

    // handleSave() short-circuits on an empty name with an error toast — no
    // create mutation fires, so this stays a pure validation assertion.
    await page.getByRole('button', { name: /^Create workflow$/ }).click()
    await expect(page.getByText(/^Workflow name is required$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('automation — workflows list create menu', () => {
  test('the Create menu offers Wizard and Editor entry points', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    // The list page renders either the table (with toolbar) or the empty-state
    // embedded wizard. Only the populated list exposes the toolbar "Create"
    // dropdown, so skip if this org has no workflow definitions yet.
    await expect(page.getByRole('heading', { name: /workflow/i }).first()).toBeVisible({ timeout: 20_000 })

    const createTrigger = page.getByRole('button', { name: /^Create$/ })
    if ((await createTrigger.count()) === 0) {
      test.skip(true, 'org has no workflow definitions — list shows the empty-state wizard, not the toolbar Create menu')
    }

    // workflows-table-toolbar.tsx wraps router pushes to /wizard and /editor in
    // a shared Menu (Radix dropdown → role=menu).
    await createTrigger.first().click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Wizard', { exact: true })).toBeVisible()
    await expect(menu.getByText('Editor', { exact: true })).toBeVisible()
  })
})

test.describe('automation — workflow wizard flow selection', () => {
  // FlowStep renders three columns: object types (always-enabled buttons),
  // trigger operations (disabled until an object is picked), and action goals
  // (disabled until an operation is picked). We drive the gating chain.
  test('selecting object → operation → action enables the Continue button and step progression', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^New Workflow$/ })).toBeVisible({ timeout: 20_000 })

    const continueBtn = page.getByRole('button', { name: /^Continue$/ })
    await expect(continueBtn).toBeVisible({ timeout: 20_000 })
    // With nothing selected, the Flow step's validation error keeps Continue
    // disabled — this is the "validation prevents progression" signal.
    await expect(continueBtn).toBeDisabled()

    // Trigger operation buttons carry their description in the accessible name
    // (label + helper text). They start disabled until an object is picked.
    const createOp = page.getByRole('button', { name: /^Create Runs when a new record/ })
    await expect(createOp).toBeDisabled()

    // The object-type column lists each metadata object by label. "Control" is
    // a stable option across orgs.
    const objectButton = page.getByRole('button', { name: 'Control', exact: true })
    await expect(objectButton).toBeVisible({ timeout: 20_000 })
    await objectButton.click()

    // Operation buttons are now enabled — pick "Create".
    await expect(createOp).toBeEnabled({ timeout: 10_000 })
    await createOp.click()

    // Action goals enable after an operation is picked — pick "Send notification".
    const notifyGoal = page.getByRole('button', { name: /^Send notification/ })
    await expect(notifyGoal).toBeEnabled({ timeout: 10_000 })
    await notifyGoal.click()

    // Full Flow selection clears the validation error → Continue enables.
    await expect(continueBtn).toBeEnabled({ timeout: 10_000 })
    await continueBtn.click()

    // Advancing enables the Refine step nav button (disabled until Flow is done).
    await expect(page.getByRole('button', { name: /^Refine$/ })).toBeEnabled({ timeout: 10_000 })
  })

  test('the Flow step offers all five action goals', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^New Workflow$/ })).toBeVisible({ timeout: 20_000 })

    // GOAL_OPTIONS (constants.tsx) render their labels even while disabled.
    for (const label of ['Request approval', 'Request review', 'Send notification', 'Send webhook', 'Update a field']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 20_000 })
    }
  })
})

test.describe('automation — workflow editor settings + schema type', () => {
  test('the Settings card exposes kind / cooldown / active-draft-default controls', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Settings', { exact: true })).toBeVisible({ timeout: 20_000 })

    // workflow-editor.tsx Settings CardContent labels.
    await expect(page.getByText('Workflow Kind', { exact: true })).toBeVisible()
    await expect(page.getByText('Cooldown (seconds)', { exact: true })).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
    await expect(page.getByText('Draft', { exact: true })).toBeVisible()
    await expect(page.getByText('Default for schema', { exact: true })).toBeVisible()
    // workflowKind defaults to APPROVAL, so the Approval-timing field renders.
    await expect(page.getByText('Approval timing', { exact: true })).toBeVisible()
  })

  test('the Schema Type dropdown opens and lists object-type options', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Workflow Details', { exact: true })).toBeVisible({ timeout: 20_000 })

    // The Schema Type Radix Select trigger sits under the "Schema Type" label.
    // It's disabled while metadata loads, then enables with a chosen value.
    const schemaTrigger = page.getByRole('combobox').first()
    await expect(schemaTrigger).toBeEnabled({ timeout: 30_000 })
    await schemaTrigger.click()

    // Opening the select renders a listbox with at least one object option.
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('automation — workflow instances table', () => {
  test('the instances page renders the column headers and a populated or empty body', async ({ page }) => {
    await page.goto('/automation/workflows/instances', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /^Workflow Instances$/ }).first()).toBeVisible({ timeout: 20_000 })

    // workflow-instances-page.tsx static column headers.
    for (const header of ['Workflow', 'Schema', 'Kind', 'State', 'Assignments', 'Updated']) {
      await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible({ timeout: 15_000 })
    }

    // The table itself is always present (header + body), regardless of whether
    // the org has any active workflow runs.
    await expect(page.getByRole('table')).toBeVisible()
  })
})

test.describe('automation — survey editors mount', () => {
  // template-editor.tsx / questionnaire-editor.tsx embed survey-creator-react,
  // which renders its root as `.svc-creator`. The question-authoring DOM lives
  // inside SurveyJS (not our source), so we assert the creator surface mounts
  // rather than driving its internal toolbox/drag-reorder.
  for (const { path, label } of [
    { path: '/automation/questionnaires/templates/template-editor', label: 'template' },
    { path: '/automation/questionnaires/questionnaire-editor', label: 'questionnaire' },
  ]) {
    test(`the ${label} editor mounts the SurveyJS creator surface`, async ({ page }) => {
      test.slow()
      await page.goto(path, { waitUntil: 'domcontentloaded' })
      await expect(page.getByRole('heading', { level: 2, name: /^Editor$/ })).toBeVisible({ timeout: 20_000 })
      await expect(page.locator('.svc-creator')).toBeVisible({ timeout: 30_000 })
    })
  }
})
