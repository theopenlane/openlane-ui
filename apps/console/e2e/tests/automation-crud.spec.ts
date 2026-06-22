import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createCampaign, createQuestionnaire, type ApiSession } from '../utils/api'

/**
 * Deep automation flows beyond automation-other.spec.ts (subroute renders +
 * survey editors mount): campaign list tooling, communications template
 * create-sheets, questionnaire summary/tabs. Runs as the storage-state Owner.
 * List-tooling + dialog-open flows need no seeded data (toolbars render anyway);
 * campaign detail/search/bulk are seeded via the createCampaign API helper.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueCampaignName = () => `E2E Campaign ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('automation — campaigns list tooling', () => {
  test('the column-visibility menu opens from the campaigns toolbar', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 20_000 })

    // campaigns-table-toolbar.tsx → shared ColumnVisibilityMenu ("Columns").
    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('the filter panel exposes a Status field', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 20_000 })

    // table-config.ts getCampaignFilterFields → Name / Status / Type / Due Date.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the Create Campaign stepper step 1 has Campaign Name + Questionnaire fields', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    // create-campaign-sheet.tsx step 1 (QuestionnaireStep): "Campaign Name" input
    // + a "Questionnaire" selector.
    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('Campaign Name')).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('Questionnaire', { exact: true }).first()).toBeVisible()
  })
})

test.describe('automation — campaigns (seeded)', () => {
  test('search filters campaigns to the matching seeded campaign', async ({ page }) => {
    test.slow()
    const a = uniqueCampaignName()
    const b = uniqueCampaignName()
    await createCampaign(ownerApi, a)
    await createCampaign(ownerApi, b)

    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search').fill(a)
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('a seeded campaign detail page shows the campaign name', async ({ page }) => {
    test.slow()
    const name = uniqueCampaignName()
    const id = await createCampaign(ownerApi, name)

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    // campaign-detail-page.tsx sets the breadcrumb to the campaign name and a
    // draft campaign renders the "Start Campaign" action.
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 45_000 })
  })

  test('selecting a campaign row reveals the Bulk Delete action', async ({ page }) => {
    test.slow()
    const name = uniqueCampaignName()
    await createCampaign(ownerApi, name)

    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search').fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    // campaigns-table-toolbar.tsx shows "Bulk Delete (n)" once a row is selected.
    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })

  test('a draft campaign detail page exposes the Start Campaign action', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    // A freshly-seeded campaign is in DRAFT, so campaign-detail-page.tsx renders
    // the "Start Campaign" primary action (not "Complete Campaign").
    await expect(page.getByRole('button', { name: /^Start Campaign$/ })).toBeVisible({ timeout: 45_000 })
  })

  test('deleting a campaign from the actions menu redirects to the list', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Start Campaign$/ })).toBeVisible({ timeout: 45_000 })

    // The shared Menu (ellipsis, descriptiveTooltipText "Action") holds a
    // destructive "Delete Campaign" item; handleDeleteCampaign redirects to the list.
    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Delete Campaign$/ }).click()
    await page.waitForURL(/\/automation\/campaigns(\?|$)/, { timeout: 20_000 })
  })
})

test.describe('automation — communications templates', () => {
  test('Create Email Template opens the email template sheet', async ({ page }) => {
    await page.goto('/automation/communications', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Email Templates' })).toBeVisible({ timeout: 20_000 })

    // email-templates-tab.tsx "Create Email Template" → email-template-sheet.tsx
    // (breadcrumb "Communications / Create Email Template" inside the sheet).
    await page.getByRole('button', { name: /^Create Email Template$/ }).click()
    await expect(page.getByRole('dialog').getByText('Create Email Template').first()).toBeVisible({ timeout: 10_000 })

    // email-template-sheet.tsx form fields.
    await expect(page.getByPlaceholder('e.g. Welcome Email')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. welcome-email')).toBeVisible()
    await expect(page.getByPlaceholder('Describe the purpose of this template...')).toBeVisible()
  })

  test('Create Notification Template opens the notification template sheet', async ({ page }) => {
    await page.goto('/automation/communications', { waitUntil: 'domcontentloaded' })

    // Switch to the Notification Templates tab, then open its create sheet.
    await page.getByRole('tab', { name: 'Notification Templates' }).click()
    await page.getByRole('button', { name: /^Create Notification Template$/ }).click()
    await expect(page.getByRole('dialog').getByText('Create Notification Template').first()).toBeVisible({ timeout: 10_000 })

    // notification-template-sheet.tsx form fields (name/key + topic pattern).
    await expect(page.getByPlaceholder('e.g. Campaign Reminder Notification')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. campaign-reminder-notif')).toBeVisible()
    await expect(page.getByPlaceholder('e.g. campaign.reminder')).toBeVisible()
  })

  test('email templates tab exposes search + active/inactive status filter', async ({ page }) => {
    await page.goto('/automation/communications', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('tab', { name: 'Email Templates' })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByPlaceholder('Search email templates...')).toBeVisible({ timeout: 15_000 })
    // The status filter is a 3-way All / Active / Inactive control.
    await expect(page.getByText('Active', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Inactive', { exact: true }).first()).toBeVisible()
  })
})

test.describe('automation — questionnaires', () => {
  test('the questionnaires page shows summary cards and switches to the Templates tab', async ({ page }) => {
    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded' })
    const questionnaires = page.getByRole('tab', { name: 'Questionnaires' })
    await expect(questionnaires).toBeVisible({ timeout: 20_000 })

    // SummaryCard labels (questionnaires-page-wrapper.tsx): Pending / Overdue.
    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Overdue', { exact: true }).first()).toBeVisible()

    // Tab switch questionnaires → templates.
    const templates = page.getByRole('tab', { name: 'Templates' })
    await templates.click()
    await expect(templates).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 })
    await expect(questionnaires).toHaveAttribute('aria-selected', 'false')
  })

  test('search surfaces a seeded questionnaire in the list', async ({ page }) => {
    test.slow()
    const name = `E2E Qn ${RUN_ID} ${Date.now().toString(36)}`
    await createQuestionnaire(ownerApi, name)

    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    await page.getByPlaceholder('Search').first().fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('a seeded questionnaire row opens its actions menu', async ({ page }) => {
    test.slow()
    const name = `E2E Qn ${RUN_ID} ${Date.now().toString(36)}`
    await createQuestionnaire(ownerApi, name)

    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByPlaceholder('Search').first().fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row
      .getByRole('button')
      .filter({ has: page.locator('.lucide-ellipsis') })
      .click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })
})
