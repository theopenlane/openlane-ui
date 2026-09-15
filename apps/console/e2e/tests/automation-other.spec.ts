import { test, expect } from '../fixtures/auth'

const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/automation/questionnaires', heading: /^Questionnaires$/ },
  { path: '/automation/questionnaires/templates', heading: /^Templates$/ },
  { path: '/automation/campaigns', heading: /^Campaigns$/ },
  { path: '/automation/email-templates', heading: /^Email Templates$/ },
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

const NESTED_H1_ROUTES: Array<{ path: string; text: RegExp }> = [
  { path: '/automation/workflows/inbox', text: /^Workflow Inbox$/ },
  { path: '/automation/workflows/instances', text: /^Workflow Instances$/ },
  { path: '/automation/workflows/templates', text: /^Workflow Templates$/ },
]

test.describe('automation — workflows subroutes (nested-h1 variant)', () => {
  for (const { path, text } of NESTED_H1_ROUTES) {
    test(`${path} renders the page heading text`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('heading', { name: text }).first()).toBeVisible({ timeout: 15_000 })
    })
  }
})

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

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible({ timeout: 15_000 })
      await expect(page.getByText(eyebrow).first()).toBeVisible()
    })
  }
})

test.describe('automation — workflow wizard scaffold', () => {
  test('the wizard renders its 4-step nav (Flow / Refine / Configure / Review)', async ({ page }) => {
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^New Workflow$/ })).toBeVisible({ timeout: 20_000 })

    for (const label of ['Flow', 'Refine', 'Configure', 'Review']) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    }
  })
})

test.describe('automation — campaigns create', () => {
  test('Create Campaign opens the campaign creation stepper sheet', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Campaigns$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create Campaign$/ }).click()
    await expect(page.getByRole('dialog').getByText('Create Campaign').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('automation — email templates status filter', () => {
  test('the status filter switches between All, Active and Inactive', async ({ page }) => {
    await page.goto('/automation/email-templates', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Email Templates$/ })).toBeVisible({ timeout: 20_000 })

    const all = page.getByRole('tab', { name: /^All$/ })
    const active = page.getByRole('tab', { name: /^Active$/ })
    const inactive = page.getByRole('tab', { name: /^Inactive$/ })
    await expect(all).toBeVisible()
    await expect(active).toBeVisible()
    await expect(inactive).toBeVisible()
    await expect(all).toHaveAttribute('aria-selected', 'true')

    await inactive.click()
    await expect(inactive).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
    await expect(all).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('automation — workflow editor (render + validation)', () => {
  test('the editor mounts the Workflow Details/Settings/Builder cards with name + schema fields', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Editor$/ })).toBeVisible({ timeout: 20_000 })

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

    await page.getByRole('button', { name: /^Create workflow$/ }).click()
    await expect(page.getByText(/^Workflow name is required$/).first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('automation — workflows list create menu', () => {
  test('the Create menu offers Wizard and Editor entry points', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /workflow/i }).first()).toBeVisible({ timeout: 20_000 })

    const createTrigger = page.getByRole('button', { name: /^Create$/ })
    if ((await createTrigger.count()) === 0) {
      test.skip(true, 'org has no workflow definitions — list shows the empty-state wizard, not the toolbar Create menu')
    }

    await createTrigger.first().click()
    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })
    await expect(menu.getByText('Wizard', { exact: true })).toBeVisible()
    await expect(menu.getByText('Editor', { exact: true })).toBeVisible()
  })
})

test.describe('automation — workflow wizard flow selection', () => {
  test('selecting object → operation → action enables the Continue button and step progression', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^New Workflow$/ })).toBeVisible({ timeout: 20_000 })

    const continueBtn = page.getByRole('button', { name: /^Continue$/ })
    await expect(continueBtn).toBeVisible({ timeout: 20_000 })
    await expect(continueBtn).toBeDisabled()

    const createOp = page.getByRole('button', { name: /^Create Runs when a new record/ })
    await expect(createOp).toBeDisabled()

    const objectButton = page.getByRole('button', { name: 'Control', exact: true })
    await expect(objectButton).toBeVisible({ timeout: 20_000 })
    await objectButton.click()

    await expect(createOp).toBeEnabled({ timeout: 10_000 })
    await createOp.click()

    const notifyGoal = page.getByRole('button', { name: /^Send notification/ })
    await expect(notifyGoal).toBeEnabled({ timeout: 10_000 })
    await notifyGoal.click()

    await expect(continueBtn).toBeEnabled({ timeout: 10_000 })
    await continueBtn.click()

    await expect(page.getByRole('button', { name: /^Refine$/ })).toBeEnabled({ timeout: 10_000 })
  })

  test('the Flow step offers all five action goals', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/wizard', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^New Workflow$/ })).toBeVisible({ timeout: 20_000 })

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

    await expect(page.getByText('Workflow Kind', { exact: true })).toBeVisible()
    await expect(page.getByText('Cooldown (seconds)', { exact: true })).toBeVisible()
    await expect(page.getByText('Active', { exact: true })).toBeVisible()
    await expect(page.getByText('Draft', { exact: true })).toBeVisible()
    await expect(page.getByText('Default for schema', { exact: true })).toBeVisible()
    await expect(page.getByText('Approval timing', { exact: true })).toBeVisible()
  })

  test('the Schema Type dropdown opens and lists object-type options', async ({ page }) => {
    test.slow()
    await page.goto('/automation/workflows/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Workflow Details', { exact: true })).toBeVisible({ timeout: 20_000 })

    const schemaTrigger = page.getByRole('combobox').first()
    await expect(schemaTrigger).toBeEnabled({ timeout: 30_000 })
    await schemaTrigger.click()

    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('automation — workflow instances table', () => {
  test('the instances page renders the column headers and a populated or empty body', async ({ page }) => {
    await page.goto('/automation/workflows/instances', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /^Workflow Instances$/ }).first()).toBeVisible({ timeout: 20_000 })

    for (const header of ['Workflow', 'Schema', 'Kind', 'State', 'Assignments', 'Updated']) {
      await expect(page.getByRole('columnheader', { name: header, exact: true })).toBeVisible({ timeout: 15_000 })
    }

    await expect(page.getByRole('table')).toBeVisible()
  })
})

test.describe('automation — survey editors mount', () => {
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
