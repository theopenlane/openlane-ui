import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'
import { confirmDestructiveDialog, openRowAction } from '../utils/menu'
import { RUN_ID } from '../utils/constants'
import { createCampaign, createQuestionnaire, createTemplate, type ApiSession, getOwnerApi } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { expectMutationOk, toast } from '../utils/mutations'

let ownerApi: ApiSession
const uniqueCampaignName = () => uniqueName('E2E Campaign')

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('automation — campaigns list tooling', () => {
  test('the column-visibility menu opens from the campaigns toolbar', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('the filter panel exposes a Status field', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('Status', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the Create Campaign stepper step 1 has Campaign Name + questionnaire selector', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('Campaign Name')).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByPlaceholder('Enter a campaign name')).toBeVisible()
    await expect(sheet.getByText(/^Select Questionnaire Template/)).toBeVisible()
  })
})

test.describe('automation — campaign create stepper', () => {
  test('the stepper opens on step 1 of 3 with the empty questionnaire picker', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })

    await expect(sheet.getByText(/STEP 1 OF 3/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('No questionnaire template selected')).toBeVisible()
  })

  test('Next advances from the Campaign Details step to the Targets step', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Campaign Name')).toBeVisible({ timeout: 10_000 })

    await sheet.getByRole('button', { name: /^Next$/ }).click()
    await expect(sheet.getByText(/STEP 2 OF 3/)).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByRole('button', { name: /^Previous$/ })).toBeVisible()
  })

  test('the stepper header exposes Save Draft and the final Create Campaign action', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })

    await expect(sheet.getByRole('button', { name: /^Save Draft$/ })).toBeVisible({ timeout: 10_000 })
    await sheet.getByRole('button', { name: /^Next$/ }).click()
    await sheet.getByRole('button', { name: /^Next$/ }).click()
    await expect(sheet.getByText(/STEP 3 OF 3/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 10_000 })
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

    await expect(page.getByRole('button', { name: /^Bulk Delete/ })).toBeVisible({ timeout: 10_000 })
  })

  test('a draft campaign detail page exposes the Launch action', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Launch$/ })).toBeVisible({ timeout: 45_000 })
  })

  test('deleting a campaign from the actions menu redirects to the list', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Launch$/ })).toBeVisible({ timeout: 45_000 })

    await page.getByRole('button', { name: 'Action' }).click()
    await page.getByRole('button', { name: /^Delete campaign$/ }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^Delete campaign$/ }).click()

    await page.waitForURL(/\/automation\/campaigns(\?|$)/, { timeout: 20_000 })
  })
})

test.describe('automation — email templates', () => {
  test('Create Email Template opens the editor page with its name field', async ({ page }) => {
    await page.goto('/automation/email-templates', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Email Templates$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create Email Template$/ }).click()
    await page.waitForURL(/\/automation\/email-templates\/editor(\?|$)/, { timeout: 20_000 })

    await expect(page.getByRole('heading', { level: 2, name: /^Create Email Template$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByPlaceholder('e.g. Welcome Email')).toBeVisible()

    await expect(page.getByRole('button', { name: /^Save Draft$/ })).toBeDisabled()
  })

  test('the editor returns to the list when cancelled', async ({ page }) => {
    await page.goto('/automation/email-templates/editor', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Create Email Template$/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Cancel$/ }).click()
    await page.waitForURL(/\/automation\/email-templates(\?|$)/, { timeout: 20_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Email Templates$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('the email templates list exposes search + active/inactive status filter', async ({ page }) => {
    await page.goto('/automation/email-templates', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Email Templates$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByPlaceholder('Search email templates...')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^All$/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Active$/ })).toBeVisible()
    await expect(page.getByRole('tab', { name: /^Inactive$/ })).toBeVisible()
  })
})

test.describe('automation — questionnaires', () => {
  test('the questionnaires page shows summary cards and switches to the Templates tab', async ({ page }) => {
    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded' })
    const questionnaires = page.getByRole('tab', { name: 'Questionnaires' })
    await expect(questionnaires).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Pending', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Overdue', { exact: true }).first()).toBeVisible()

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

    // Toggle-safe open: under parallel load the first click can land before the row-action trigger is ready
    const menuTrigger = row.getByRole('button').filter({ has: page.locator('.lucide-ellipsis') })
    await expect(async () => {
      if (!(await page.getByRole('menu').isVisible())) await menuTrigger.click()
      await expect(page.getByRole('menu')).toBeVisible({ timeout: 3_000 })
    }).toPass({ timeout: 20_000 })
  })
})

test.describe('automation — questionnaire detail (seeded)', () => {
  test('the detail page renders the questionnaire name plus Recipients/Responses/Due Date stat cards', async ({ page }) => {
    test.slow()
    const name = `E2E Qn Detail ${RUN_ID} ${Date.now().toString(36)}`
    const id = await createQuestionnaire(ownerApi, name)

    await page.goto(`/automation/questionnaires/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('heading', { name }).first()).toBeVisible({ timeout: 45_000 })
    await expect(page.getByText('Recipients', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Responses', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Due Date', { exact: true }).first()).toBeVisible()
  })

  test('the detail page switches between the Delivery and Responses tabs (URL-controlled)', async ({ page }) => {
    test.slow()
    const id = await createQuestionnaire(ownerApi, `E2E Qn Detail ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto(`/automation/questionnaires/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const delivery = page.getByRole('tab', { name: 'Delivery' })
    const responses = page.getByRole('tab', { name: 'Responses' })
    await expect(delivery).toBeVisible({ timeout: 45_000 })

    await responses.click()
    await page.waitForURL(/[?&]tab=responses/, { timeout: 15_000 })
    await expect(responses).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(delivery).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('automation — questionnaire send dialog (viewer)', () => {
  const openSendDialogFromViewer = async (page: Page) => {
    const id = await createQuestionnaire(ownerApi, `E2E Qn Send ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto(`/automation/questionnaires/questionnaire-viewer?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Preview$/ })).toBeVisible({ timeout: 45_000 })

    await page.getByRole('button', { name: /^Send$/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Send Questionnaire')).toBeVisible({ timeout: 10_000 })
    return dialog
  }

  test('the Send button opens the dialog with a recipient email input and a disabled Send', async ({ page }) => {
    test.slow()
    const dialog = await openSendDialogFromViewer(page)

    await expect(dialog.getByPlaceholder('Enter email address...')).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^Add More$/ })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Send$/ })).toBeDisabled()
  })

  test('adding a valid email enables Send and renders the recipient chip', async ({ page }) => {
    test.slow()
    const dialog = await openSendDialogFromViewer(page)

    const email = `e2e-recipient-${Date.now().toString(36)}@example.com`
    await dialog.getByPlaceholder('Enter email address...').fill(email)
    await dialog.getByRole('button', { name: /^Add More$/ }).click()

    await expect(dialog.getByText(email, { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^Send$/ })).toBeEnabled()
  })

  test('adding an invalid email surfaces the inline validation error', async ({ page }) => {
    test.slow()
    const dialog = await openSendDialogFromViewer(page)

    await dialog.getByPlaceholder('Enter email address...').fill('not-an-email')
    await dialog.getByRole('button', { name: /^Add More$/ }).click()

    await expect(dialog.getByText('Please enter a valid email address.').first()).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^Send$/ })).toBeDisabled()
  })
})

test.describe('automation — campaign detail inline edits (seeded)', () => {
  test('editing the campaign name inline persists and surfaces the updated toast', async ({ page }) => {
    test.slow()
    const name = uniqueCampaignName()
    const id = await createCampaign(ownerApi, name)

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const display = page.getByText(name, { exact: true }).last()
    await expect(display).toBeVisible({ timeout: 45_000 })
    await display.click()

    const input = page.locator('input:focus')
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.fill(`${name} edited`)
    await input.press('Enter')

    await expect(page.getByText('Campaign updated').first()).toBeVisible({ timeout: 15_000 })
  })

  test('a draft campaign with no content or recipients cannot be launched', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const launch = page.getByRole('button', { name: /^Launch$/ })
    await expect(launch).toBeVisible({ timeout: 45_000 })
    await expect(launch).toBeDisabled()
  })

  test('the campaign action menu exposes the cancel and delete entries', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('button', { name: 'Action', exact: true }).click()

    const actionMenu = page.getByRole('menu')
    await expect(actionMenu.getByRole('button', { name: /^Cancel campaign$/ })).toBeVisible({ timeout: 10_000 })
    await expect(actionMenu.getByRole('button', { name: /^Delete campaign$/ })).toBeVisible()
    await expect(actionMenu.getByRole('button', { name: /^Send test email$/ })).toBeVisible()
  })
})

test.describe('automation — questionnaires list tooling (seeded)', () => {
  test('the Type filter is available in the questionnaires filter panel', async ({ page }) => {
    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('Type', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the Create dropdown exposes From Scratch and From Template options', async ({ page }) => {
    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Create$/ }).click()
    await expect(page.getByRole('menuitem', { name: /From Scratch/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('menuitem', { name: /From Template/ })).toBeVisible()
  })

  test('clicking the Name header toggles the questionnaire table sort indicator', async ({ page }) => {
    test.slow()
    await createQuestionnaire(ownerApi, `E2E Qn Sort ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    const header = page.getByRole('columnheader', { name: 'Name', exact: false }).first()
    await expect(header).toBeVisible({ timeout: 20_000 })
    await header.getByRole('button', { name: 'Name', exact: true }).click()
    await expect(header).not.toHaveAttribute('aria-sort', 'none', { timeout: 10_000 })
  })

  test('selecting a seeded questionnaire enables bulk delete and removes it after confirmation', async ({ page }) => {
    test.slow()
    const name = `E2E Qn Bulk ${RUN_ID} ${Date.now().toString(36)}`
    await createQuestionnaire(ownerApi, name)

    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByPlaceholder('Search').first().fill(name)
    const row = page.getByRole('row').filter({ hasText: name })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await row.getByRole('checkbox').first().check()

    const bulkDelete = page.getByRole('button', { name: /^Bulk Delete \(/ })
    await expect(bulkDelete).toBeVisible({ timeout: 10_000 })
    await bulkDelete.click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText('Selected questionnaires have been successfully deleted.').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('automation — questionnaire templates list', () => {
  const gotoTemplates = async (page: Page) => {
    await page.goto('/automation/questionnaires/templates', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Templates' }).first()).toBeVisible({ timeout: 45_000 })
  }

  test('search surfaces a seeded template in the templates table', async ({ page }) => {
    test.slow()
    const name = `E2E Tmpl ${RUN_ID} ${Date.now().toString(36)}`
    await createTemplate(ownerApi, name)

    await gotoTemplates(page)
    await page.getByPlaceholder('Search').first().fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('the column-visibility menu opens from the templates toolbar', async ({ page }) => {
    await gotoTemplates(page)
    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('the templates filter panel exposes Environment and Scope fields', async ({ page }) => {
    await gotoTemplates(page)
    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('Environment', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Scope', { exact: true }).first()).toBeVisible()
  })

  test('clicking the Name header toggles the templates table sort indicator', async ({ page }) => {
    test.slow()
    await createTemplate(ownerApi, `E2E Tmpl Sort ${RUN_ID} ${Date.now().toString(36)}`)

    await gotoTemplates(page)
    const header = page.getByRole('columnheader', { name: 'Name', exact: false }).first()
    await expect(header).toBeVisible({ timeout: 20_000 })
    await header.getByRole('button', { name: 'Name', exact: true }).click()
    await expect(header).not.toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })
  })

  test('the Create button navigates to the template editor', async ({ page }) => {
    await gotoTemplates(page)
    await page.getByRole('button', { name: /^Create$/ }).click()
    await page.waitForURL(/\/automation\/questionnaires\/templates\/template-editor/, { timeout: 20_000 })
  })

  test('the row Edit action navigates to the template editor for a seeded template', async ({ page }) => {
    test.slow()
    const name = `E2E Tmpl Edit ${RUN_ID} ${Date.now().toString(36)}`
    const id = await createTemplate(ownerApi, name)

    await gotoTemplates(page)
    await page.getByPlaceholder('Search').first().fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
    const row = page.getByRole('row').filter({ hasText: name }).first()

    const trigger = row.getByRole('button').filter({ has: page.locator('.lucide-ellipsis, .lucide-more-horizontal') })
    await openRowAction(page, trigger, page.getByRole('menuitem', { name: /^Edit$/ }))
    await page.waitForURL(new RegExp(`template-editor\\?id=${id}`), { timeout: 30_000 })
  })

  test('the row Delete action removes a seeded template after confirmation', async ({ page }) => {
    test.slow()
    const name = `E2E Tmpl Del ${RUN_ID} ${Date.now().toString(36)}`
    await createTemplate(ownerApi, name)

    await gotoTemplates(page)
    await page.getByPlaceholder('Search').first().fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
    const row = page.getByRole('row').filter({ hasText: name }).first()

    const menuTrigger = row.getByRole('button').filter({ has: page.locator('.lucide-ellipsis, .lucide-more-horizontal') })
    await openRowAction(page, menuTrigger, page.getByRole('menuitem', { name: /^Delete$/ }))
    await confirmDestructiveDialog(page)

    await expect(page.getByRole('cell').filter({ hasText: name })).toHaveCount(0, { timeout: 30_000 })
  })
})

test.describe('automation — campaigns table view (ISS-2560)', () => {
  test('the campaigns page renders the shared table toolbar', async ({ page }) => {
    test.slow()
    await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('button', { name: /^Create Campaign$/ })).toBeVisible({ timeout: 30_000 })

    await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Columns$/ })).toBeVisible()
  })

  test('a seeded campaign appears as a table row', async ({ page }) => {
    test.slow()
    const name = uniqueCampaignName()
    await createCampaign(ownerApi, name)

    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByPlaceholder('Search').fill(name)

    await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('automation — remaining submits', () => {
  test('an email template created in the editor persists', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E EmailTemplate create')

    await page.goto('/automation/email-templates/editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByPlaceholder('e.g. Welcome Email').fill(name)

    const save = page.getByRole('button', { name: /^Save Draft$/ })
    await expect(save).toBeEnabled({ timeout: 30_000 })

    await expectMutationOk(page, 'CreateEmailTemplate', async () => {
      await save.click()
    })
    await expect(toast(page, 'Email template created')).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('questionnaires — create from template', () => {
  test('a questionnaire is created from an existing template', async ({ page }) => {
    test.slow()
    const templateName = uniqueName('E2E FromTemplate source')
    await createTemplate(ownerApi, templateName)

    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page
      .getByRole('button', { name: /^Create$/ })
      .first()
      .click()
    await page.getByRole('menuitem', { name: /From Template/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: templateName, exact: true }).click()

    await expectMutationOk(page, 'CreateAssessment', async () => {
      await dialog
        .getByRole('button', { name: /^(Create|Continue|Use)/ })
        .last()
        .click()
    })
  })
})
