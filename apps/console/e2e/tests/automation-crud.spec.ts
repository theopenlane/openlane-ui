import type { Page } from '@playwright/test'
import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createCampaign, createQuestionnaire, createTemplate, type ApiSession } from '../utils/api'

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

test.describe('automation — campaign create stepper', () => {
  test('the stepper opens on step 1 of 3 with the questionnaire selector', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })
    // stepper-sheet.tsx renders a "STEP n OF total" badge; QuestionnaireStep's
    // Select uses the "Select one from the list" placeholder.
    await expect(sheet.getByText(/STEP 1 OF 3/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByText('Select one from the list')).toBeVisible()
  })

  test('Next advances from the Questionnaire step to the Targets step', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Campaign Name')).toBeVisible({ timeout: 10_000 })

    // canProceed is always true, so "Next" moves to step 2 ("Targets"); the
    // header badge flips to STEP 2 OF 3 and a "Previous" button appears.
    await sheet.getByRole('button', { name: /^Next$/ }).click()
    await expect(sheet.getByText(/STEP 2 OF 3/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByRole('button', { name: /^Previous$/ })).toBeVisible()
  })

  test('the stepper header exposes Save Draft and Launch Now actions', async ({ page }) => {
    await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await page.getByRole('button', { name: /^Create Campaign$/ }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet).toBeVisible({ timeout: 10_000 })

    // create-campaign-sheet.tsx passes completeLabel="Launch Now"; "Save Draft"
    // is always present. Step through to the last step to surface Launch Now.
    await expect(sheet.getByRole('button', { name: /^Save Draft$/ })).toBeVisible({ timeout: 10_000 })
    await sheet.getByRole('button', { name: /^Next$/ }).click()
    await sheet.getByRole('button', { name: /^Next$/ }).click()
    await expect(sheet.getByText(/STEP 3 OF 3/)).toBeVisible({ timeout: 10_000 })
    await expect(sheet.getByRole('button', { name: /^Launch Now$/ })).toBeVisible({ timeout: 10_000 })
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

    // Toggle-safe open: under parallel load the first click can land before the
    // row-action trigger is ready, so retry opening until the menu is shown.
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

    // questionnaire-detail-page.tsx PageHeading uses heading={assessment.name};
    // StatCards expose Recipients / Responses / Due Date labels.
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

    // handleTabChange pushes ?tab=responses; Radix tabs are URL-controlled.
    await responses.click()
    await page.waitForURL(/[?&]tab=responses/, { timeout: 15_000 })
    await expect(responses).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
    await expect(delivery).toHaveAttribute('aria-selected', 'false')
  })
})

test.describe('automation — questionnaire send dialog (viewer)', () => {
  /**
   * The row-menu / detail-page "Send" action is permission-gated (canSendMap →
   * needs campaign/entity edit, which a bare-seeded assessment lacks for the
   * storage-state Owner). The questionnaire-viewer page renders an UNGATED Send
   * button once loaded, so we drive the SendQuestionnaireDialog from there.
   */
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

    // send-questionnaire-dialog.tsx: email input + "Add More" trigger; the in-dialog
    // Send is disabled until at least one recipient is present (totalCount === 0).
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

    // addEmail() pushes a Badge chip, clears the input, and enables Send.
    await expect(dialog.getByText(email, { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^Send$/ })).toBeEnabled()
  })

  test('adding an invalid email surfaces the inline validation error', async ({ page }) => {
    test.slow()
    const dialog = await openSendDialogFromViewer(page)

    await dialog.getByPlaceholder('Enter email address...').fill('not-an-email')
    await dialog.getByRole('button', { name: /^Add More$/ }).click()

    // addEmail() rejects an invalid address and renders INVALID_EMAIL_MESSAGE via
    // FormMessage; the Send button stays disabled (no recipients added).
    await expect(dialog.getByText('Please enter a valid email address.').first()).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^Send$/ })).toBeDisabled()
  })
})

test.describe('automation — campaign detail inline edits (seeded)', () => {
  /**
   * campaign-detail-page.tsx renders editable property fields (name TextField,
   * Status/Type SelectFields, Due Date DateField) that persist on
   * blur/selection via handleUpdateField → updateCampaign → "Campaign updated"
   * toast. Each edit is exercised on its own freshly-seeded DRAFT campaign so
   * the flows are independent and additive.
   */
  const properties = (page: Page) =>
    page
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Properties' }) })
      .last()

  test('editing the campaign name inline persists and surfaces the updated toast', async ({ page }) => {
    test.slow()
    const name = uniqueCampaignName()
    const id = await createCampaign(ownerApi, name)

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    // The name appears in the breadcrumb (a link, rendered first) AND the editable
    // TextField display div (rendered after). Target the latter via .last() so the
    // click enters inline-edit mode rather than following the breadcrumb link.
    const display = page.getByText(name, { exact: true }).last()
    await expect(display).toBeVisible({ timeout: 45_000 })
    await display.click()

    // Clicking turns it into an autoFocused Input; target it via focus to avoid
    // the recipients-table search input. Enter blurs → handleUpdateField persists.
    const input = page.locator('input:focus')
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.fill(`${name} edited`)
    await input.press('Enter')

    await expect(page.getByText('Campaign updated').first()).toBeVisible({ timeout: 15_000 })
  })

  test('editing the campaign Status dropdown persists and surfaces the updated toast', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const props = properties(page)
    // A fresh campaign is DRAFT; clicking the Status value swaps the div for a
    // Radix Select trigger (combobox). Opening it surfaces the options portal.
    await expect(props.getByText('Draft').first()).toBeVisible({ timeout: 45_000 })
    await props.getByText('Draft').first().click()
    await props.getByRole('combobox').click()

    await page.getByRole('option', { name: 'Scheduled' }).click()
    await expect(page.getByText('Campaign updated').first()).toBeVisible({ timeout: 15_000 })
  })

  test('editing the campaign Type dropdown persists and surfaces the updated toast', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const props = properties(page)
    // A fresh campaign defaults to a Questionnaire type; click it, open the
    // combobox, and switch to Custom to drive the persist path.
    await expect(props.getByText('Questionnaire').first()).toBeVisible({ timeout: 45_000 })
    await props.getByText('Questionnaire').first().click()
    await props.getByRole('combobox').click()

    await page.getByRole('option', { name: 'Custom' }).click()
    await expect(page.getByText('Campaign updated').first()).toBeVisible({ timeout: 15_000 })
  })

  test('completing a campaign from the active state surfaces the completed toast', async ({ page }) => {
    test.slow()
    const id = await createCampaign(ownerApi, uniqueCampaignName())

    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    // DRAFT → start the campaign (status ACTIVE), which swaps the primary action
    // to "Complete Campaign" (handleCompleteCampaign → "Campaign completed").
    await page.getByRole('button', { name: /^Start Campaign$/ }).click()
    await expect(page.getByText('Campaign started').first()).toBeVisible({ timeout: 15_000 })

    const complete = page.getByRole('button', { name: /^Complete Campaign$/ })
    await expect(complete).toBeVisible({ timeout: 15_000 })
    await complete.click()
    await expect(page.getByText('Campaign completed').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('automation — questionnaires list tooling (seeded)', () => {
  test('the Type filter is available in the questionnaires filter panel', async ({ page }) => {
    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    // getQuestionnaireFilterFields → Tags / Type / Template / Due Date / Updated At / Created At.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText('Type', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the Create dropdown exposes From Scratch and From Template options', async ({ page }) => {
    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    // create.tsx CreateDropdown → DropdownMenu with "From Scratch" / "From Template".
    await page.getByRole('button', { name: /^Create$/ }).click()
    await expect(page.getByRole('menuitem', { name: /From Scratch/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('menuitem', { name: /From Template/ })).toBeVisible()
  })

  test('clicking the Name header toggles the questionnaire table sort indicator', async ({ page }) => {
    test.slow()
    await createQuestionnaire(ownerApi, `E2E Qn Sort ${RUN_ID} ${Date.now().toString(36)}`)

    await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('tab', { name: 'Questionnaires' })).toBeVisible({ timeout: 20_000 })

    // DataTable SortableHeaderCell exposes a role=button trigger whose accessible
    // name is the header label; the TableHead aria-sort flips off "none" on sort.
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

    // questionnaire-table-toolbar.tsx shows "Bulk Delete (n)" for an org editor.
    const bulkDelete = page.getByRole('button', { name: /^Bulk Delete \(/ })
    await expect(bulkDelete).toBeVisible({ timeout: 10_000 })
    await bulkDelete.click()

    // ConfirmationDialog (alertdialog) confirm button defaults to "Delete".
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()

    await expect(page.getByText('Selected questionnaires have been successfully deleted.').first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('automation — questionnaire templates list', () => {
  /**
   * The dedicated /automation/questionnaires/templates route renders the
   * TemplatesTable (separate from the in-page Templates tab). Seeded templates
   * are non-system-owned, so the Owner sees Edit/Delete row actions and the
   * Columns/Filter toolbar tooling.
   */
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
    // template-table-toolbar.tsx → shared ColumnVisibilityMenu ("Columns").
    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('menu')).toBeVisible({ timeout: 10_000 })
  })

  test('the templates filter panel exposes Environment and Scope fields', async ({ page }) => {
    await gotoTemplates(page)
    // useTemplateFilters → Environment / Scope / System Owned / Updated At / Created At.
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText('Environment', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Scope', { exact: true }).first()).toBeVisible()
  })

  test('clicking the Name header toggles the templates table sort indicator', async ({ page }) => {
    test.slow()
    await createTemplate(ownerApi, `E2E Tmpl Sort ${RUN_ID} ${Date.now().toString(36)}`)

    await gotoTemplates(page)
    const header = page.getByRole('columnheader', { name: 'Name', exact: false }).first()
    await expect(header).toBeVisible({ timeout: 20_000 })
    // Default sort is Name ASC, so toggling moves it off "ascending".
    await header.getByRole('button', { name: 'Name', exact: true }).click()
    await expect(header).not.toHaveAttribute('aria-sort', 'ascending', { timeout: 10_000 })
  })

  test('the Create button navigates to the template editor', async ({ page }) => {
    await gotoTemplates(page)
    // CreateTemplateButton → router.push('/automation/questionnaires/templates/template-editor').
    await page.getByRole('button', { name: /^Create$/ }).click()
    await page.waitForURL(/\/automation\/questionnaires\/templates\/template-editor/, { timeout: 20_000 })
  })

  test('the row Edit action navigates to the template editor for a seeded template', async ({ page }) => {
    test.slow()
    const name = `E2E Tmpl Edit ${RUN_ID} ${Date.now().toString(36)}`
    const id = await createTemplate(ownerApi, name)

    await gotoTemplates(page)
    await page.getByPlaceholder('Search').first().fill(name)
    // Wait for the filtered table to settle to a single matching row (the user
    // map resolving re-renders rows; clicking too early detaches the menu trigger).
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
    const row = page.getByRole('row').filter({ hasText: name }).first()

    await row
      .getByRole('button')
      .filter({ has: page.locator('.lucide-ellipsis, .lucide-more-horizontal') })
      .click()
    const edit = page.getByRole('menuitem', { name: /^Edit$/ })
    await expect(edit).toBeVisible({ timeout: 10_000 })
    await edit.click()
    await page.waitForURL(new RegExp(`template-editor\\?id=${id}`), { timeout: 20_000 })
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
    const del = page.getByRole('menuitem', { name: /^Delete$/ })
    // Toggle-safe open (parallel-load resilient): re-open until the item shows.
    await expect(async () => {
      if (!(await del.isVisible())) await menuTrigger.click()
      await expect(del).toBeVisible({ timeout: 3_000 })
    }).toPass({ timeout: 20_000 })
    await del.click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()
    await expect(page.getByText('Template deleted successfully').first()).toBeVisible({ timeout: 15_000 })
  })
})
