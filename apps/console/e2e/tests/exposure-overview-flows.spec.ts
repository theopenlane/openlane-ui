import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'

const openOverview = async (page: Page) => {
  await page.goto('/exposure/overview', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { level: 2, name: /^Exposure Overview$/ })).toBeVisible({ timeout: 60_000 })
}

const openSlaSheet = async (page: Page): Promise<Locator> => {
  await page.getByRole('main').getByRole('button').first().click()
  await page.getByText(/^(Configure SLA|View SLA)$/).click()

  const sheet = page.getByRole('dialog')
  await expect(sheet.getByText(/SLA Definitions$/).first()).toBeVisible({ timeout: 30_000 })
  return sheet
}

test.describe('exposure overview — quick actions', () => {
  test('Triage Queue navigates to the triage page', async ({ page }) => {
    test.slow()
    await openOverview(page)

    await page.getByText('Triage Queue', { exact: true }).click()
    await expect(page).toHaveURL(/\/exposure\/triage$/, { timeout: 60_000 })
  })

  test('Track Remediation opens the Create Remediation sheet for an owner', async ({ page }) => {
    test.slow()
    await openOverview(page)

    const remediation = page.getByText(/^(Track Remediation|View Remediations)$/)
    test.skip(!(await remediation.isVisible().catch(() => false)), 'no remediation quick action in this org')
    await remediation.click()

    await expect(
      page
        .getByRole('dialog')
        .getByText(/^Create Remediation$/)
        .or(page.getByRole('heading', { level: 2, name: /^Remediations$/ }))
        .first(),
    ).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('exposure overview — drill-through', () => {
  test('a critical count card navigates to its filtered table', async ({ page }) => {
    test.slow()
    await openOverview(page)

    const critical = page.getByRole('button', { name: 'Critical Vulnerabilities' })
    await expect(critical).toBeVisible({ timeout: 60_000 })
    await critical.click()

    await expect(page).toHaveURL(/\/exposure\/vulnerabilities$/, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: /^Filter \d+$/ })).toBeVisible({ timeout: 60_000 })
  })

  test('a severity chart segment navigates to its filtered table', async ({ page }) => {
    test.slow()
    await openOverview(page)

    const segment = page.getByRole('button', { name: /Open Vulnerabilities$/ }).first()
    test.skip(!(await segment.isVisible()), 'no open vulnerabilities in this org, so the chart renders no segments')
    await segment.click()

    await expect(page).toHaveURL(/\/exposure\/vulnerabilities$/, { timeout: 60_000 })
    await expect(page.getByRole('button', { name: /^Filter \d+$/ })).toBeVisible({ timeout: 60_000 })
  })

  test('an attention-item row opens its associations dialog', async ({ page }) => {
    test.slow()
    await openOverview(page)

    const rows = page.getByRole('row')
    test.skip(
      !(await rows
        .first()
        .isVisible()
        .catch(() => false)),
      'no items requiring attention in this org',
    )
    const dataRow = rows.nth(1)
    test.skip(!(await dataRow.isVisible()), 'no items requiring attention in this org')

    await dataRow.click()
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('exposure overview — SLA definitions', () => {
  test.describe.configure({ mode: 'serial' })

  test('the SLA sheet lists a severity row with an edit affordance', async ({ page }) => {
    test.slow()
    await openOverview(page)
    const sheet = await openSlaSheet(page)

    const editButtons = sheet.getByRole('button', { name: /^Edit SLA days for / })
    await expect(editButtons.first().or(sheet.getByText('No SLA definitions configured.'))).toBeVisible({ timeout: 30_000 })
  })

  test('Escape abandons an inline SLA edit without saving', async ({ page }) => {
    test.slow()
    await openOverview(page)
    const sheet = await openSlaSheet(page)

    const edit = sheet.getByRole('button', { name: /^Edit SLA days for / }).first()
    test.skip(!(await edit.isVisible()), 'no SLA definitions configured in this org')
    await edit.click()

    const input = sheet.getByRole('spinbutton').first()
    await expect(input).toBeVisible({ timeout: 15_000 })
    const original = await input.inputValue()

    await input.fill(String(Number(original) + 3))
    await input.press('Escape')

    await expect(sheet.getByRole('spinbutton')).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByText('SLA updated', { exact: true })).toHaveCount(0)
  })

  test('Enter commits an inline SLA edit and the value round-trips', async ({ page }) => {
    test.slow()
    await openOverview(page)
    const sheet = await openSlaSheet(page)

    const edit = sheet.getByRole('button', { name: /^Edit SLA days for / }).first()
    test.skip(!(await edit.isVisible()), 'no SLA definitions configured in this org')
    await edit.click()

    const input = sheet.getByRole('spinbutton').first()
    await expect(input).toBeVisible({ timeout: 15_000 })
    const original = await input.inputValue()
    const bumped = String(Number(original) + 1)

    await input.fill(bumped)
    await input.press('Enter')
    await expect(page.getByText('SLA updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

    await openOverview(page)
    const reopened = await openSlaSheet(page)
    await reopened
      .getByRole('button', { name: /^Edit SLA days for / })
      .first()
      .click()
    const restored = reopened.getByRole('spinbutton').first()
    await expect(restored).toHaveValue(bumped, { timeout: 15_000 })

    await restored.fill(original)
    await restored.press('Enter')
    await expect(page.getByText('SLA updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  })
})
