import { addDays, format } from 'date-fns'
import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import type { ApiSession } from '../utils/api'
import {
  createAutomationCampaign,
  createEmailTemplate,
  createQuestionnaireTemplate,
  deleteAutomationCampaign,
  deleteEmailTemplate,
  deleteQuestionnaireTemplate,
  findAutomationCampaignId,
  getAutomationApi,
} from '../utils/api-automation'
import { inlineCsv } from '../utils/files'
import { uniqueName, uniqueRef } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, name: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })

const openCampaigns = async (page: Page): Promise<void> => {
  await page.goto('/automation/campaigns', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: 'Create Campaign' })).toBeVisible({ timeout: 30_000 })
}

const openCampaignStepper = async (page: Page) => {
  await openCampaigns(page)
  await page.getByRole('button', { name: 'Create Campaign' }).click()
  const sheet = page.getByRole('dialog', { name: 'Create Campaign' })
  await expect(sheet).toBeVisible({ timeout: 30_000 })
  return sheet
}

const calendarDayName = (date: Date): string => format(date, 'EEEE, MMMM do, yyyy')

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('campaign targets step accepts a unique in-memory CSV upload', async ({ page }) => {
  const sheet = await openCampaignStepper(page)
  await sheet.getByLabel('Campaign Name').fill(uniqueName('E2E Campaign CSV'))
  await sheet.getByRole('button', { name: 'Next' }).click()
  await sheet.getByRole('tab', { name: 'Upload CSV' }).click()

  const fileName = `${uniqueRef('campaign-targets').toLowerCase()}.csv`
  const email = `${uniqueRef('campaign-csv').toLowerCase()}@example.invalid`
  await sheet.locator('input[type="file"]').setInputFiles(inlineCsv(fileName, `email,fullName\n${email},CSV Recipient\n`))
  await expect(sheet.getByText(fileName, { exact: true })).toBeVisible({ timeout: 30_000 })
})

test('saving from the campaign stepper creates a draft that persists after reload', async ({ page }) => {
  const name = uniqueName('E2E Campaign draft')
  let id: string | undefined

  try {
    const sheet = await openCampaignStepper(page)
    await sheet.getByLabel('Campaign Name').fill(name)
    await sheet.getByRole('button', { name: 'Save Draft' }).click()
    await page.waitForURL(/\/automation\/campaigns\/[^/?]+$/, { timeout: 30_000 })

    id = await findAutomationCampaignId(ownerApi, name)
    expect(id).toBeTruthy()
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Draft', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  } finally {
    if (!id) id = await findAutomationCampaignId(ownerApi, name)
    if (id) await deleteAutomationCampaign(ownerApi, id)
  }
})

test('a launch-ready campaign created through the stepper leaves draft once launched', async ({ page }) => {
  const name = uniqueName('E2E Campaign launch')
  const templateName = uniqueName('E2E Campaign email template')
  const recipient = `${uniqueRef('campaign-launch').toLowerCase()}@example.invalid`
  const emailTemplateId = await createEmailTemplate(ownerApi, templateName)
  let campaignId: string | undefined

  try {
    const sheet = await openCampaignStepper(page)
    await sheet.getByLabel('Campaign Name').fill(name)
    await sheet.getByRole('button', { name: 'Next' }).click()
    await sheet.getByRole('tab', { name: 'Manual' }).click()
    const manualInput = sheet.getByPlaceholder('Type an email and press Enter...')
    await manualInput.fill(recipient)
    await manualInput.press('Enter')
    await expect(sheet.getByText(recipient, { exact: true })).toBeVisible({ timeout: 30_000 })

    await sheet.getByRole('button', { name: 'Next' }).click()
    await sheet.getByRole('combobox', { name: 'Email Template' }).click()
    await page.getByRole('option', { name: templateName, exact: true }).click()
    await sheet.getByRole('button', { name: 'Create Campaign' }).click()
    await page.waitForURL(/\/automation\/campaigns\/[^/?]+$/, { timeout: 30_000 })

    campaignId = await findAutomationCampaignId(ownerApi, name)
    expect(campaignId).toBeTruthy()
    await expect(page.getByText(recipient, { exact: true })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Launch campaign', exact: true }).click()

    const dialog = page.getByRole('dialog', { name: 'Launch campaign' })
    await dialog.getByRole('checkbox', { name: /I understand that this campaign will be launched/ }).check()
    await dialog.getByRole('button', { name: 'Launch campaign' }).click()
    await expect(page.getByText('Campaign launched', { exact: true })).toBeVisible({ timeout: 30_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/^(Active|Completed)$/).first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/^This campaign is (active|completed)$/)).toBeVisible({ timeout: 30_000 })
  } finally {
    if (!campaignId) campaignId = await findAutomationCampaignId(ownerApi, name)
    if (campaignId) await deleteAutomationCampaign(ownerApi, campaignId)
    await deleteEmailTemplate(ownerApi, emailTemplateId)
  }
})

test('clicking a searched campaign row navigates to that campaign detail page', async ({ page }) => {
  const name = uniqueName('E2E Campaign row navigation')
  const id = await createAutomationCampaign(ownerApi, name)

  try {
    await openCampaigns(page)
    await page.getByPlaceholder('Search').fill(name)
    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await row.getByText(name, { exact: true }).click()

    await page.waitForURL(new RegExp(`/automation/campaigns/${id}$`), { timeout: 20_000 })
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  } finally {
    await deleteAutomationCampaign(ownerApi, id)
  }
})

test('editing a questionnaire campaign due date persists after reload', async ({ page }) => {
  const name = uniqueName('E2E Campaign due date')
  const templateId = await createQuestionnaireTemplate(ownerApi, uniqueName('E2E Campaign questionnaire'))
  const initialDate = addDays(new Date(), 10)
  const updatedDate = addDays(initialDate, 1)
  const id = await createAutomationCampaign(ownerApi, name, {
    campaignType: 'QUESTIONNAIRE',
    templateID: templateId,
    dueDate: initialDate.toISOString(),
  })

  try {
    await page.goto(`/automation/campaigns/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 })

    const detailsSidebar = page.getByRole('heading', { name: 'Details', exact: true }).locator('../..')
    const dueRow = detailsSidebar.getByText('Due Date', { exact: true }).locator('../..')
    await expect(dueRow).toContainText(format(initialDate, 'MMMM d, yyyy'))
    await dueRow.getByText(format(initialDate, 'MMMM d, yyyy'), { exact: true }).click()
    await dueRow.getByRole('button').click()
    await page.getByRole('button', { name: calendarDayName(updatedDate) }).click()
    await expect(page.getByText('Campaign updated', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    const reloadedSidebar = page.getByRole('heading', { name: 'Details', exact: true }).locator('../..')
    const reloadedDueRow = reloadedSidebar.getByText('Due Date', { exact: true }).locator('../..')
    await expect(reloadedDueRow).toContainText(format(updatedDate, 'MMMM d, yyyy'), { timeout: 30_000 })
  } finally {
    await deleteAutomationCampaign(ownerApi, id)
    await deleteQuestionnaireTemplate(ownerApi, templateId)
  }
})
