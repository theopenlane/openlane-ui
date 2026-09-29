import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createControl, createProgram, getOwnerApi, seedEntity, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

type TSeededWork = {
  programId: string
  openTasks: [string, string]
  completedTask: string
  controlRef: string
  policyName: string
}

const seedProgramWork = async (): Promise<TSeededWork> => {
  const programId = await createProgram(ownerApi, uniqueName('E2E ProgWork'))
  const programIDs = [programId]
  const openTasks: [string, string] = [uniqueName('E2E Work open task A'), uniqueName('E2E Work open task B')]
  const completedTask = uniqueName('E2E Work done task')
  const controlRef = uniqueRef('E2E-WORK')
  const policyName = uniqueName('E2E Work policy')

  await Promise.all([
    ...openTasks.map((title) => seedEntity(ownerApi, 'createTask', 'CreateTaskInput', 'task', { title, status: 'OPEN', programIDs })),
    seedEntity(ownerApi, 'createTask', 'CreateTaskInput', 'task', { title: completedTask, status: 'COMPLETED', programIDs }),
    createControl(ownerApi, controlRef, { status: 'NOT_IMPLEMENTED', programIDs }),
    seedEntity(ownerApi, 'createInternalPolicy', 'CreateInternalPolicyInput', 'internalPolicy', { name: policyName, status: 'DRAFT', programIDs }),
  ])

  return { programId, openTasks, completedTask, controlRef, policyName }
}

const statCard = (page: Page, label: string): Locator =>
  page
    .getByRole('main')
    .getByRole('button')
    .filter({ has: page.getByText(label, { exact: true }) })
    .first()

const expectCount = async (page: Page, label: string, count: number) => {
  await expect(statCard(page, label)).toHaveText(new RegExp(`^${count}\\s*${label}$`), { timeout: 30_000 })
}

const workRow = (page: Page, text: string): Locator => page.getByRole('main').getByRole('row').filter({ hasText: text })

const openWorkTab = async (page: Page, programId: string) => {
  await page.goto(`/programs/${programId}?tab=work`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('tab', { name: 'Work', exact: true })).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })
  await expect(page.getByPlaceholder('Search work')).toBeVisible({ timeout: 30_000 })
}

test.describe('programs — Work view (ISS-2984)', () => {
  test('the Work tab is linkable through ?tab=work and Overview clears the param', async ({ page }) => {
    test.slow()
    const programId = await createProgram(ownerApi, uniqueName('E2E ProgWork tabs'))

    await page.goto(`/programs/${programId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const overview = page.getByRole('tab', { name: 'Overview', exact: true })
    const work = page.getByRole('tab', { name: 'Work', exact: true })
    await expect(overview).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })

    await work.click()
    await expect(page).toHaveURL(/[?&]tab=work\b/, { timeout: 15_000 })
    await expect(page.getByPlaceholder('Search work')).toBeVisible({ timeout: 30_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(work).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })

    await overview.click()
    await expect(page).not.toHaveURL(/[?&]tab=/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Basic information' })).toBeVisible({ timeout: 30_000 })
  })

  test('stat cards count outstanding work per type and the table lists it, excluding completed items', async ({ page }) => {
    test.slow()
    const seeded = await seedProgramWork()
    await openWorkTab(page, seeded.programId)

    await expectCount(page, 'Total', 4)
    await expectCount(page, 'Tasks', 2)
    await expectCount(page, 'Controls', 1)
    await expectCount(page, 'Internal Policies', 1)
    await expectCount(page, 'Procedures', 0)

    for (const title of seeded.openTasks) await expect(workRow(page, title)).toBeVisible({ timeout: 30_000 })
    await expect(workRow(page, seeded.controlRef)).toBeVisible()
    await expect(workRow(page, seeded.policyName)).toBeVisible()
    await expect(workRow(page, seeded.completedTask)).toHaveCount(0)
  })

  test('clicking a type card filters the table without changing any card count', async ({ page }) => {
    test.slow()
    const seeded = await seedProgramWork()
    await openWorkTab(page, seeded.programId)
    await expectCount(page, 'Total', 4)

    await statCard(page, 'Tasks').click()

    await expect(workRow(page, seeded.controlRef)).toHaveCount(0, { timeout: 30_000 })
    await expect(workRow(page, seeded.policyName)).toHaveCount(0)
    for (const title of seeded.openTasks) await expect(workRow(page, title)).toBeVisible()
    await expectCount(page, 'Tasks', 2)
    await expectCount(page, 'Total', 4)
    await expectCount(page, 'Controls', 1)

    await statCard(page, 'Total').click()
    await expect(workRow(page, seeded.controlRef)).toBeVisible({ timeout: 30_000 })
    await expect(workRow(page, seeded.policyName)).toBeVisible()
  })

  test('searching narrows the rows but leaves the counts alone', async ({ page }) => {
    test.slow()
    const seeded = await seedProgramWork()
    await openWorkTab(page, seeded.programId)
    await expectCount(page, 'Total', 4)

    await page.getByPlaceholder('Search work').fill(seeded.openTasks[0])

    await expect(workRow(page, seeded.openTasks[1])).toHaveCount(0, { timeout: 30_000 })
    await expect(workRow(page, seeded.openTasks[0])).toBeVisible()
    await expect(workRow(page, seeded.controlRef)).toHaveCount(0)
    await expectCount(page, 'Total', 4)
    await expectCount(page, 'Tasks', 2)
  })

  test('the Board view groups items into outstanding status columns', async ({ page }) => {
    test.slow()
    const seeded = await seedProgramWork()
    await openWorkTab(page, seeded.programId)
    await expect(workRow(page, seeded.openTasks[0])).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Board view' }).click()

    const main = page.getByRole('main')
    await expect(main.getByText('Open', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(main.getByText('In Progress', { exact: true })).toBeVisible()
    await expect(main.getByText('In Review', { exact: true })).toBeVisible()
    await expect(main.getByText('Completed', { exact: true })).toHaveCount(0)

    const column = (status: string): Locator => main.locator('[class*="min-w-[300px]"]').filter({ has: page.getByText(status, { exact: true }) })
    await expect(column('Open').getByText(seeded.openTasks[0])).toBeVisible({ timeout: 30_000 })
    await expect(column('Open').getByText(seeded.openTasks[1])).toBeVisible()
    await expect(column('Open').getByText(seeded.controlRef)).toBeVisible()
    await expect(column('In Progress').getByText(seeded.policyName)).toBeVisible()
    await expect(column('In Review').getByText('No work', { exact: true })).toBeVisible()
    await expect(main.getByRole('row')).toHaveCount(0)
  })
})

test.describe('programs — Work counts follow the status filter (ISS-3048)', () => {
  test('the Total card explains that counts reflect the selected status', async ({ page }) => {
    test.slow()
    const seeded = await seedProgramWork()
    await openWorkTab(page, seeded.programId)
    await expectCount(page, 'Total', 4)

    await statCard(page, 'Total').hover()
    await expect(page.getByRole('tooltip').filter({ hasText: 'Counts reflect the selected status' }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('filtering on Completed switches the counts and rows to completed work', async ({ page }) => {
    test.slow()
    const seeded = await seedProgramWork()
    await openWorkTab(page, seeded.programId)
    await expectCount(page, 'Total', 4)

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    const panel = page.getByRole('menu').last()
    await panel.getByText('Status', { exact: true }).click()
    await panel
      .getByRole('option')
      .filter({ hasText: /^Completed$/ })
      .first()
      .click()
    await page.getByRole('button', { name: /^View Results$/ }).click()

    await expectCount(page, 'Total', 1)
    await expectCount(page, 'Tasks', 1)
    await expectCount(page, 'Controls', 0)
    await expectCount(page, 'Internal Policies', 0)
    await expect(workRow(page, seeded.completedTask)).toBeVisible({ timeout: 30_000 })
    await expect(workRow(page, seeded.openTasks[0])).toHaveCount(0)
  })
})
