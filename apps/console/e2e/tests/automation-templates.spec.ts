import { format, subDays } from 'date-fns'
import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createCustomTypeEnum, deleteCustomTypeEnum, type ApiSession } from '../utils/api'
import { createQuestionnaireTemplate, deleteQuestionnaireTemplate, getAutomationApi, getSystemOwnedQuestionnaireTemplate } from '../utils/api-automation'
import { uniqueName } from '../utils/unique'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const rowFor = (page: Page, name: string) => page.getByRole('row', { name: new RegExp(escapeRegExp(name)) })

const openTemplates = async (page: Page): Promise<void> => {
  await page.goto('/automation/questionnaires/templates', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByPlaceholder('Search')).toBeVisible({ timeout: 30_000 })
}

const resetTemplateFilters = async (page: Page): Promise<void> => {
  await page.getByRole('button', { name: /^Filter(?: \d+)?$/ }).click()
  await page.getByRole('button', { name: 'Reset filters' }).click()
}

const calendarDayName = (date: Date): string => format(date, 'EEEE, MMMM do, yyyy')

const chooseRangeDate = async (page: Page, endpoint: 'From' | 'To', date: Date): Promise<void> => {
  await page
    .getByText(endpoint, { exact: true })
    .locator('..')
    .getByRole('button', { name: calendarDayName(date) })
    .click()
}

const openRowAction = async (page: Page, row: Locator, item: string): Promise<void> => {
  const trigger = row.getByRole('button', { name: 'Row actions' })
  const menuItem = page.getByRole('menuitem', { name: item, exact: true })

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!(await menuItem.isVisible().catch(() => false))) await trigger.click().catch(() => {})
    try {
      await menuItem.click({ timeout: 5_000 })
      return
    } catch {
      continue
    }
  }

  await menuItem.click({ timeout: 15_000 })
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getAutomationApi()
})

test('template search isolates the matching seeded template by name and description', async ({ page }) => {
  const wanted = uniqueName('E2E Template search')
  const description = uniqueName('E2E Template description')
  const described = uniqueName('E2E Template described')
  const other = uniqueName('E2E Template other')
  const ids = [await createQuestionnaireTemplate(ownerApi, wanted), await createQuestionnaireTemplate(ownerApi, described, { description }), await createQuestionnaireTemplate(ownerApi, other)]

  try {
    await openTemplates(page)
    const search = page.getByPlaceholder('Search')
    await search.fill(wanted)
    await expect(rowFor(page, wanted)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, other)).toHaveCount(0)

    await search.fill(description)
    await expect(rowFor(page, described)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, wanted)).toHaveCount(0)
  } finally {
    for (const id of ids) await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('the column menu shows Description and persists the visibility choice after reload', async ({ page }) => {
  const name = uniqueName('E2E Template columns')
  const description = uniqueName('E2E Template visible description')
  const id = await createQuestionnaireTemplate(ownerApi, name, { description })

  try {
    await openTemplates(page)
    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('columnheader', { name: /^Description\b/ })).toHaveCount(0)

    await expect(async () => {
      await page.getByRole('button', { name: 'Columns' }).click()
      const toggle = page.getByRole('menu').getByRole('checkbox', { name: 'Description' })
      await expect(toggle).toBeVisible({ timeout: 5_000 })
      if (!(await toggle.isChecked())) await toggle.check()
      await page.keyboard.press('Escape')
      await expect(page.getByRole('columnheader', { name: /^Description\b/ })).toBeVisible({ timeout: 10_000 })
    }).toPass({ timeout: 60_000 })
    await expect(rowFor(page, name)).toContainText(description)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(name)
    await expect(page.getByRole('columnheader', { name: /^Description\b/ })).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: 'Columns' }).click()
    await page.getByRole('menu').getByRole('checkbox', { name: 'Description' }).uncheck()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('columnheader', { name: /^Description\b/ })).toHaveCount(0)
  } finally {
    await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('sorting by Name reverses a searched set of seeded templates', async ({ page }) => {
  const prefix = uniqueName('E2E Template sort')
  const names = ['Alpha', 'Bravo', 'Charlie'].map((suffix) => `${prefix} ${suffix}`)
  const ids: string[] = []
  for (const name of names) ids.push(await createQuestionnaireTemplate(ownerApi, name))

  try {
    await openTemplates(page)
    await page.getByPlaceholder('Search').fill(prefix)
    const nameCells = page.getByRole('cell').filter({ hasText: prefix })
    await expect(nameCells).toHaveCount(names.length, { timeout: 20_000 })
    expect((await nameCells.allInnerTexts()).map((value) => value.trim())).toEqual(names)

    await page.getByRole('button', { name: 'Name', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: /^Name\b/ })).toHaveAttribute('aria-sort', 'descending')
    await expect.poll(async () => (await nameCells.allInnerTexts()).map((value) => value.trim()).join('|'), { timeout: 20_000 }).toBe([...names].reverse().join('|'))
  } finally {
    for (const id of ids) await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('environment and scope filters each isolate the matching template', async ({ page }) => {
  const prefix = uniqueName('E2E Template metadata filters')
  const environmentOne = uniqueName('Template environment one')
  const environmentTwo = uniqueName('Template environment two')
  const scopeOne = uniqueName('Template scope one')
  const scopeTwo = uniqueName('Template scope two')
  const enumIds = [
    await createCustomTypeEnum(ownerApi, environmentOne, 'environment'),
    await createCustomTypeEnum(ownerApi, environmentTwo, 'environment'),
    await createCustomTypeEnum(ownerApi, scopeOne, 'scope'),
    await createCustomTypeEnum(ownerApi, scopeTwo, 'scope'),
  ]
  const firstName = `${prefix} Alpha`
  const secondName = `${prefix} Bravo`
  const templateIds = [
    await createQuestionnaireTemplate(ownerApi, firstName, { environmentName: environmentOne, scopeName: scopeOne }),
    await createQuestionnaireTemplate(ownerApi, secondName, { environmentName: environmentTwo, scopeName: scopeTwo }),
  ]

  try {
    await openTemplates(page)
    await page.getByPlaceholder('Search').fill(prefix)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Environment' }).click()
    await page.getByRole('menu').getByText(environmentOne, { exact: true }).click()
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, firstName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, secondName)).toHaveCount(0)

    await resetTemplateFilters(page)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Scope' }).click()
    await page.getByRole('menu').getByText(scopeTwo, { exact: true }).click()
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, secondName)).toBeVisible({ timeout: 20_000 })
    await expect(rowFor(page, firstName)).toHaveCount(0)
  } finally {
    for (const id of templateIds) await deleteQuestionnaireTemplate(ownerApi, id)
    for (const id of enumIds) await deleteCustomTypeEnum(ownerApi, id)
  }
})

test('system-owned and created-date filters change whether an organization template is returned', async ({ page }) => {
  const name = uniqueName('E2E Template ownership date')
  const id = await createQuestionnaireTemplate(ownerApi, name)

  try {
    await openTemplates(page)
    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toBeVisible({ timeout: 20_000 })

    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'System Owned', exact: true }).click()
    await page.getByRole('menu').getByText('System owned', { exact: true }).click()
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })

    await resetTemplateFilters(page)
    await page.getByRole('button', { name: /^Filter$/ }).click()
    await page.getByRole('menu').getByRole('button', { name: 'Created At' }).click()
    await page.getByRole('button', { name: 'Pick date range' }).click()
    const yesterday = subDays(new Date(), 1)
    await chooseRangeDate(page, 'From', yesterday)
    await chooseRangeDate(page, 'To', yesterday)
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'View Results' }).click()
    await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })
  } finally {
    await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('the Create template button navigates to the template editor', async ({ page }) => {
  await openTemplates(page)
  await page.getByRole('button', { name: 'Create', exact: true }).click()
  await page.waitForURL(/\/automation\/questionnaires\/templates\/template-editor(?:\?|$)/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible({ timeout: 30_000 })
})

test('the template table Edit row action opens the seeded template in the editor', async ({ page }) => {
  const name = uniqueName('E2E Template table edit')
  const id = await createQuestionnaireTemplate(ownerApi, name)

  try {
    await openTemplates(page)
    await page.getByPlaceholder('Search').fill(name)
    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await openRowAction(page, row, 'Edit')

    await page.waitForURL(new RegExp(`/automation/questionnaires/templates/template-editor\\?id=${id}$`), { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Survey settings' }).click()
    await expect(page.getByLabel(/^Survey title/).first()).toHaveValue(name, { timeout: 30_000 })
  } finally {
    await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('the template table Delete row action removes the template after confirmation and reload', async ({ page }) => {
  const name = uniqueName('E2E Template table delete')
  const id = await createQuestionnaireTemplate(ownerApi, name)

  try {
    await openTemplates(page)
    await page.getByPlaceholder('Search').fill(name)
    const row = rowFor(page, name)
    await expect(row).toBeVisible({ timeout: 20_000 })
    await openRowAction(page, row, 'Delete')

    const dialog = page.getByRole('alertdialog', { name: 'Delete Template' })
    await dialog.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Template deleted successfully', { exact: true })).toBeVisible({ timeout: 20_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })
  } finally {
    await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('a system-owned template exposes duplicate but gates edit and delete row actions', async ({ page }) => {
  const template = await getSystemOwnedQuestionnaireTemplate(ownerApi)
  test.skip(!template, 'No system-owned questionnaire template is available in this organization')
  if (!template) return

  await openTemplates(page)
  await page.getByPlaceholder('Search').fill(template.name)
  const row = rowFor(page, template.name)
  await expect(row).toBeVisible({ timeout: 20_000 })
  await expect(row.getByText('Openlane Managed', { exact: true })).toBeVisible({ timeout: 30_000 })
  await row.getByRole('button', { name: 'Row actions' }).click()

  const menu = page.getByRole('menu')
  await expect(menu.getByRole('menuitem', { name: 'Duplicate' })).toBeVisible({ timeout: 30_000 })
  await expect(menu.getByRole('menuitem', { name: 'Edit' })).toHaveCount(0)
  await expect(menu.getByRole('menuitem', { name: 'Delete' })).toHaveCount(0)
})

test('the template viewer Edit button opens the editor for the same seeded template', async ({ page }) => {
  const name = uniqueName('E2E Template viewer edit')
  const id = await createQuestionnaireTemplate(ownerApi, name)

  try {
    await page.goto(`/automation/questionnaires/templates/template-viewer?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.waitForURL(new RegExp(`/automation/questionnaires/templates/template-editor\\?id=${id}$`), { timeout: 20_000 })
    await expect(page.getByRole('heading', { name: 'Editor' })).toBeVisible({ timeout: 30_000 })
  } finally {
    await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test('the template viewer Delete confirmation removes the template and returns to the list', async ({ page }) => {
  const name = uniqueName('E2E Template viewer delete')
  const id = await createQuestionnaireTemplate(ownerApi, name)

  try {
    await page.goto(`/automation/questionnaires/templates/template-viewer?id=${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: 'Preview' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Delete' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Are you sure?' })
    await dialog.getByRole('button', { name: 'Delete Template' }).click()
    await page.waitForURL(/\/automation\/questionnaires\/templates(?:\?|$)/, { timeout: 20_000 })

    await page.getByPlaceholder('Search').fill(name)
    await expect(rowFor(page, name)).toHaveCount(0, { timeout: 20_000 })
  } finally {
    await deleteQuestionnaireTemplate(ownerApi, id)
  }
})

test.describe('questionnaire template editor permissions', () => {
  test.use({ authProfile: 'readonly' })

  test('a readonly user sees the protected area instead of the template editor', async ({ page }) => {
    await page.goto('/automation/questionnaires/templates/template-editor', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/This page is part of a protected area/)).toBeVisible({ timeout: 30_000 })
    await expect(page.locator('.svc-creator')).toHaveCount(0)
  })
})
