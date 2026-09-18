import { addDays, format } from 'date-fns'
import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import type { ApiSession } from '../utils/api'
import { createAssessment, createContactWithEmail, deleteAssessment, deleteContact, findAssessmentId, getAutomationApi } from '../utils/api-automation'
import { uniqueName, uniqueRef } from '../utils/unique'
import { expectMutationOk } from '../utils/mutations'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, value: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(value)) })

const openQuestionnaires = async (page: Page): Promise<void> => {
  await page.goto('/automation/questionnaires', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 30_000 })
}

const openQuestionnaireViewer = async (page: Page, id: string): Promise<void> => {
  await page.goto(`/automation/questionnaires/questionnaire-viewer?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible({ timeout: 30_000 })
}

const openSendDialog = async (page: Page, id: string): Promise<void> => {
  await openQuestionnaireViewer(page, id)
  await page.getByRole('button', { name: 'Send', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Send Questionnaire' })).toBeVisible({ timeout: 30_000 })
}

const openQuestionnaireEditor = async (page: Page, id?: string): Promise<void> => {
  const query = id ? `?id=${id}` : ''
  await page.goto(`/automation/questionnaires/questionnaire-editor${query}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible({ timeout: 30_000 })
  await expect(page.getByRole('button', { name: 'Save Survey' })).toBeVisible({ timeout: 30_000 })
}

const editorSelect = (page: Page, label: 'Type' | 'Response Due') => page.getByRole('combobox', { name: label })

const selectEditorOption = async (page: Page, label: 'Type' | 'Response Due', option: string): Promise<void> => {
  await editorSelect(page, label).click()
  await page.getByRole('option', { name: option, exact: true }).click()
  await expect(editorSelect(page, label)).toContainText(option)
}

const setSurveyTitle = async (page: Page, title: string): Promise<void> => {
  const settings = page.getByRole('button', { name: 'Survey settings' })
  const field = page.getByLabel(/^Survey title/).first()

  if (!(await field.isVisible().catch(() => false))) await settings.dispatchEvent('click')
  await expect(field).toBeEditable({ timeout: 30_000 })
  await field.fill(title)
  await field.blur()
}

const saveSurvey = async (page: Page): Promise<void> => {
  const save = page.getByRole('button', { name: 'Save Survey' })
  await expect(save).toBeEnabled({ timeout: 30_000 })

  try {
    await save.click({ timeout: 10_000 })
  } catch {
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) await save.dispatchEvent(type)
  }
}

const calendarDayName = (date: Date): string => format(date, 'EEEE, MMMM do, yyyy')

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('send dialog validates malformed and duplicate recipient email addresses', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire email validation')
  const id = await createAssessment(ownerApi, name)
  const email = `${uniqueRef('questionnaire-valid').toLowerCase()}@example.invalid`

  try {
    await openSendDialog(page, id)
    const dialog = page.getByRole('dialog', { name: 'Send Questionnaire' })
    const input = dialog.getByPlaceholder('Enter email address...')

    await input.fill('not-an-email')
    await dialog.getByRole('button', { name: 'Add More' }).click()
    await expect(dialog.getByText('Please enter a valid email address.')).toBeVisible({ timeout: 30_000 })

    await input.fill(email)
    await dialog.getByRole('button', { name: 'Add More' }).click()
    await expect(dialog.getByText(email, { exact: true })).toBeVisible({ timeout: 30_000 })

    await input.fill(email)
    await dialog.getByRole('button', { name: 'Add More' }).click()
    await expect(dialog.getByText('This email is already added.')).toBeVisible({ timeout: 30_000 })
  } finally {
    await deleteAssessment(ownerApi, id)
  }
})

test('send dialog suggests a seeded contact and adds the selected email', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire contact suggestion')
  const contactName = uniqueName('E2E Questionnaire contact')
  const email = `${uniqueRef('questionnaire-contact').toLowerCase()}@example.invalid`
  const assessmentId = await createAssessment(ownerApi, name)
  const contactId = await createContactWithEmail(ownerApi, contactName, email)

  try {
    await openSendDialog(page, assessmentId)
    const dialog = page.getByRole('dialog', { name: 'Send Questionnaire' })
    await dialog.getByPlaceholder('Enter email address...').fill(email)
    await dialog.getByRole('button', { name: `${contactName} (${email})`, exact: true }).click()
    await expect(dialog.getByText(email, { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByRole('button', { name: 'Send', exact: true })).toBeEnabled()
  } finally {
    await deleteContact(ownerApi, contactId)
    await deleteAssessment(ownerApi, assessmentId)
  }
})

test('sending from assessment detail persists the recipient in the delivery table', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire persisted delivery')
  const email = `${uniqueRef('questionnaire-delivery').toLowerCase()}@example.invalid`
  const id = await createAssessment(ownerApi, name)

  try {
    await page.goto(`/automation/questionnaires/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Send', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Send Questionnaire' })
    await expect(dialog).toBeVisible({ timeout: 30_000 })
    await dialog.getByPlaceholder('Enter email address...').fill(email)
    await dialog.getByRole('button', { name: 'Send', exact: true }).click()
    await expect(page.getByText('Questionnaire sent to 1 recipient', { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(dialog).toHaveCount(0)

    await expect(page.getByRole('tab', { name: 'Delivery' })).toHaveAttribute('data-state', 'active', { timeout: 30_000 })
    await expect(rowFor(page, email)).toBeVisible({ timeout: 30_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(rowFor(page, email)).toBeVisible({ timeout: 30_000 })
  } finally {
    await deleteAssessment(ownerApi, id)
  }
})

test('questionnaire pagination navigates forward and backward through a searched fixture set', async ({ page }) => {
  const prefix = uniqueName('E2E Questionnaire pagination')
  const names = Array.from({ length: 11 }, (_, index) => `${prefix} ${String(index + 1).padStart(2, '0')}`)
  const ids = await Promise.all(names.map((name) => createAssessment(ownerApi, name)))

  try {
    await openQuestionnaires(page)
    await page.getByPlaceholder('Search').fill(prefix)
    const pageSize = page.getByText('Rows per page', { exact: true }).locator('..').getByRole('combobox')
    await pageSize.click()
    await page.getByRole('option', { name: '10', exact: true }).click()
    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled()

    await page.getByRole('button', { name: 'Next page' }).click()
    await expect(page.getByText('Page 2 of 2')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled()

    await page.getByRole('button', { name: 'Previous page' }).click()
    await expect(page.getByText('Page 1 of 2')).toBeVisible({ timeout: 20_000 })
  } finally {
    for (const id of ids) await deleteAssessment(ownerApi, id)
  }
})

test('assessment type selection persists when an existing assessment is saved', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire assessment type')
  const id = await createAssessment(ownerApi, name, { assessmentType: 'EXTERNAL' })

  try {
    await openQuestionnaireEditor(page, id)
    await selectEditorOption(page, 'Type', 'Internal')
    await saveSurvey(page)
    await page.waitForURL(new RegExp(`/automation/questionnaires/${id}$`), { timeout: 30_000 })

    await openQuestionnaireEditor(page, id)
    await expect(page.getByRole('combobox', { name: 'Type' })).toContainText('Internal')
  } finally {
    await deleteAssessment(ownerApi, id)
  }
})

test('all response-due presets are selectable and the saved duration persists', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire due presets')
  const id = await createAssessment(ownerApi, name)

  try {
    await openQuestionnaireEditor(page, id)
    for (const duration of ['7 days', '14 days', '30 days', '60 days', '90 days']) {
      await selectEditorOption(page, 'Response Due', duration)
    }
    await saveSurvey(page)
    await page.waitForURL(new RegExp(`/automation/questionnaires/${id}$`), { timeout: 30_000 })

    await openQuestionnaireEditor(page, id)
    await expect(editorSelect(page, 'Response Due')).toContainText('90 days')
  } finally {
    await deleteAssessment(ownerApi, id)
  }
})

test('a custom response due date is saved and restored in the editor', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire custom due date')
  const targetDate = addDays(new Date(), 14)
  const formattedTarget = format(targetDate, 'PPP')
  const id = await createAssessment(ownerApi, name)

  try {
    await openQuestionnaireEditor(page, id)
    await selectEditorOption(page, 'Response Due', 'Custom')
    const dateButton = page.getByRole('button', { name: /\w+ \d{1,2}(?:st|nd|rd|th), \d{4}/ })
    await dateButton.click()
    await page.getByRole('button', { name: calendarDayName(targetDate) }).click()
    await expect(dateButton).toContainText(formattedTarget)
    await saveSurvey(page)
    await page.waitForURL(new RegExp(`/automation/questionnaires/${id}$`), { timeout: 30_000 })

    await openQuestionnaireEditor(page, id)
    await expect(editorSelect(page, 'Response Due')).toContainText('Custom')
    await expect(page.getByRole('button', { name: new RegExp(escapeRegExp(formattedTarget)) })).toBeVisible({ timeout: 30_000 })
  } finally {
    await deleteAssessment(ownerApi, id)
  }
})

test('the questionnaire editor creates a named internal assessment with a persisted duration', async ({ page }) => {
  const name = uniqueName('E2E Questionnaire editor create')

  try {
    await openQuestionnaireEditor(page)
    await setSurveyTitle(page, name)
    await selectEditorOption(page, 'Type', 'Internal')
    await selectEditorOption(page, 'Response Due', '30 days')
    await saveSurvey(page)
    await page.waitForURL(/\/automation\/questionnaires(?:\?|$)/, { timeout: 30_000 })

    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toBeVisible({ timeout: 30_000 })
    const id = await findAssessmentId(ownerApi, name)
    expect(id).toBeTruthy()

    if (id) {
      await openQuestionnaireEditor(page, id)
      await expect(page.getByRole('combobox', { name: 'Type' })).toContainText('Internal')
      await expect(editorSelect(page, 'Response Due')).toContainText('30 days')
    }
  } finally {
    const id = await findAssessmentId(ownerApi, name)
    if (id) await deleteAssessment(ownerApi, id)
  }
})

test.describe('questionnaires — delivery recipient delete', () => {
  test('a delivery recipient can be removed from the questionnaire', async ({ page }) => {
    test.slow()
    const name = uniqueName('E2E Questionnaire delivery')
    const assessmentId = await createAssessment(ownerApi, name)
    const recipient = `${uniqueRef('delivery').toLowerCase()}@example.invalid`

    await page.goto(`/automation/questionnaires/${assessmentId}?tab=delivery`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page.getByRole('button', { name: /^Send/ }).first().click()
    const sendDialog = page.getByRole('dialog')
    await sendDialog.getByRole('textbox').first().fill(recipient)
    await sendDialog.getByRole('textbox').first().press('Enter')
    await sendDialog.getByRole('button', { name: /^Send/ }).click()
    await expect(page.getByText(recipient, { exact: true })).toBeVisible({ timeout: 60_000 })

    const row = page.getByRole('row').filter({ hasText: recipient }).first()
    await row.getByRole('button', { name: 'Open delivery actions' }).click()
    await page.getByRole('menuitem', { name: /^Delete$/ }).click()

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'DeleteAssessmentResponse', async () => {
      await confirm.getByRole('button', { name: /^Delete$/ }).click()
    })
    await expect(page.getByText('Recipient deleted')).toBeVisible({ timeout: 30_000 })
  })
})
