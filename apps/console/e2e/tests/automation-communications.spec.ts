import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import type { ApiSession } from '../utils/api'
import { createEmailTemplate, deleteEmailTemplate, getAutomationApi } from '../utils/api-automation'
import { uniqueName } from '../utils/unique'

const openEmailTemplates = async (page: Page): Promise<void> => {
  await page.goto('/automation/email-templates', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByPlaceholder('Search email templates...')).toBeVisible({ timeout: 30_000 })
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('editing an email template name persists after returning to and reloading the list', async ({ page }) => {
  const originalName = uniqueName('E2E Email template edit')
  const updatedName = uniqueName('E2E Email template updated')
  const id = await createEmailTemplate(ownerApi, originalName)

  try {
    await openEmailTemplates(page)
    await page.getByPlaceholder('Search email templates...').fill(originalName)
    await expect(page.getByText(originalName, { exact: true })).toBeVisible({ timeout: 20_000 })
    const editTemplate = page.getByRole('button', { name: 'Edit template' })
    await expect(editTemplate).toHaveCount(1, { timeout: 20_000 })
    await editTemplate.click()
    await page.waitForURL(new RegExp(`/automation/email-templates/editor\\?id=${id}$`), { timeout: 20_000 })

    const nameInput = page.getByPlaceholder('e.g. Welcome Email')
    await expect(nameInput).toHaveValue(originalName, { timeout: 20_000 })
    await nameInput.fill(updatedName)
    await page.getByRole('button', { name: 'Save Changes' }).click()
    await expect(page.getByText('Email template updated', { exact: true })).toBeVisible({ timeout: 20_000 })
    await page.waitForURL(/\/automation\/email-templates(?:\?|$)/, { timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search email templates...').fill(updatedName)
    await expect(page.getByText(updatedName, { exact: true })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText(originalName, { exact: true })).toHaveCount(0)
  } finally {
    await deleteEmailTemplate(ownerApi, id)
  }
})

test('deleting an email template through its confirmation removes it after reload', async ({ page }) => {
  const name = uniqueName('E2E Email template delete')
  const id = await createEmailTemplate(ownerApi, name)

  try {
    await openEmailTemplates(page)
    await page.getByPlaceholder('Search email templates...').fill(name)
    await expect(page.getByText(name, { exact: true })).toBeVisible({ timeout: 20_000 })
    const moreActions = page.getByRole('button', { name: 'More actions' })
    await expect(moreActions).toHaveCount(1, { timeout: 20_000 })
    await moreActions.click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    const dialog = page.getByRole('alertdialog', { name: 'Delete email template?' })
    await expect(dialog).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.getByText('Template deleted', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search email templates...').fill(name)
    await expect(page.getByText(name, { exact: true })).toHaveCount(0, { timeout: 20_000 })
  } finally {
    await deleteEmailTemplate(ownerApi, id)
  }
})
