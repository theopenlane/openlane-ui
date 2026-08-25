import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const openObjectives = async (page: Page) => {
  const { sharedControlId } = readManifest()
  await page.goto(`/controls/${sharedControlId}/control-objectives`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Control Objectives' })).toBeVisible({ timeout: 60_000 })
}

const objectiveSheet = (page: Page): Locator => page.getByRole('dialog')

const openCreateSheet = async (page: Page): Promise<Locator> => {
  await page
    .getByRole('button', { name: /^Create$/ })
    .first()
    .click()
  const sheet = objectiveSheet(page)
  await expect(sheet.getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 30_000 })
  return sheet
}

/**
 * The objective list never renders the objective's own name — the card shows
 * status, source, revision, type and category only. Cards are therefore
 * indistinguishable, so a test can only reach one through its actions menu.
 * This describe runs serially so exactly one objective exists at a time.
 */
const createObjective = async (page: Page, name: string) => {
  const sheet = await openCreateSheet(page)
  await sheet.getByRole('textbox').first().fill(name)
  await sheet.getByRole('button', { name: /^Create$/ }).click()
  await expect(toast(page, 'Control Objective created')).toBeVisible({ timeout: 60_000 })
  await expect(page.getByRole('button', { name: 'Objective actions' }).last()).toBeVisible({ timeout: 30_000 })
}

const openObjectiveAction = async (page: Page, action: 'Edit' | 'Delete') => {
  await page.getByRole('button', { name: 'Objective actions' }).last().click()
  await page.getByRole('button', { name: action, exact: true }).click()
}

test.describe('controls — control objectives (seeded control)', () => {
  test.describe.configure({ mode: 'serial' })

  test('creating an objective without a name surfaces the required-field error', async ({ page }) => {
    test.slow()
    await openObjectives(page)

    const sheet = await openCreateSheet(page)
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(page.getByText('Name is required')).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, 'Control Objective created')).toBeHidden()
  })

  test('an objective can be created, renamed and deleted', async ({ page }) => {
    test.slow()
    await openObjectives(page)

    const name = uniqueName('E2E Objective')
    await createObjective(page, name)

    await openObjectiveAction(page, 'Edit')
    const sheet = objectiveSheet(page)
    await expect(sheet.getByRole('textbox').first()).toHaveValue(name, { timeout: 30_000 })

    const renamed = `${name} revised`
    await sheet.getByRole('textbox').first().fill(renamed)
    await sheet.getByRole('button', { name: 'Save Changes' }).click()
    await expect(toast(page, 'Control Objective updated')).toBeVisible({ timeout: 60_000 })

    await openObjectiveAction(page, 'Edit')
    await expect(objectiveSheet(page).getByRole('textbox').first()).toHaveValue(renamed, { timeout: 30_000 })
    await objectiveSheet(page)
      .getByRole('button', { name: /^Cancel$/ })
      .click()

    await openObjectiveAction(page, 'Delete')
    await expect(toast(page, 'Control Objective deleted')).toBeVisible({ timeout: 60_000 })
  })

  test('a new objective defaults to Draft status and a user-defined source', async ({ page }) => {
    test.slow()
    await openObjectives(page)

    const sheet = await openCreateSheet(page)
    await expect(sheet.getByRole('combobox').filter({ hasText: 'Draft' })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByRole('combobox').filter({ hasText: 'User Defined' })).toBeVisible({ timeout: 15_000 })
  })
})
