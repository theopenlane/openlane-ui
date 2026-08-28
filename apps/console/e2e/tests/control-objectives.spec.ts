import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { getOwnerApi, gql, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

let ownerApi: ApiSession

const findObjectiveId = async (name: string): Promise<string | undefined> => {
  const res = await gql<{ controlObjectives: { edges: Array<{ node: { id: string } }> } }>(
    ownerApi,
    `query($n: String!){ controlObjectives(where: { nameContainsFold: $n }, first: 1){ edges { node { id } } } }`,
    { n: name },
  )
  return res.data?.controlObjectives?.edges?.[0]?.node?.id
}

const openObjectives = async (page: Page) => {
  const { sharedControlId } = readManifest()
  await page.goto(`/controls/${sharedControlId}/control-objectives`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Control Objectives' })).toBeVisible({ timeout: 60_000 })
}

const objectiveSheet = (page: Page): Locator => page.getByRole('dialog')

const openCreateSheet = async (page: Page): Promise<Locator> => {
  const sheet = objectiveSheet(page)

  await expect(async () => {
    if (!(await sheet.isVisible().catch(() => false))) {
      await page
        .getByRole('button', { name: /^Create$/ })
        .first()
        .click()
    }
    await expect(sheet.getByRole('button', { name: /^Create$/ })).toBeVisible({ timeout: 5_000 })
  }).toPass({ timeout: 60_000 })

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
  await expect.poll(async () => Boolean(await findObjectiveId(name)), { timeout: 60_000 }).toBe(true)
  await expect(page.getByRole('button', { name: 'Objective actions' }).last()).toBeVisible({ timeout: 30_000 })
}

const openObjectiveAction = async (page: Page, action: 'Edit' | 'Delete') => {
  const trigger = page.getByRole('button', { name: 'Objective actions' }).last()
  const item = page.getByRole('button', { name: action, exact: true })

  await expect(async () => {
    if (!(await item.isVisible().catch(() => false))) await trigger.click()
    await item.click({ timeout: 5_000 })
  }).toPass({ timeout: 45_000 })
}

test.describe('controls — control objectives (seeded control)', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async () => {
    ownerApi = await getOwnerApi()
  })

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
    await expect.poll(async () => Boolean(await findObjectiveId(renamed)), { timeout: 60_000 }).toBe(true)

    await openObjectiveAction(page, 'Edit')
    await expect(objectiveSheet(page).getByRole('textbox').first()).toHaveValue(renamed, { timeout: 30_000 })
    await objectiveSheet(page)
      .getByRole('button', { name: /^Cancel$/ })
      .click()

    await openObjectiveAction(page, 'Delete')
    await expect.poll(async () => findObjectiveId(renamed), { timeout: 60_000 }).toBeFalsy()
  })

  test('a new objective defaults to Draft status and a user-defined source', async ({ page }) => {
    test.slow()
    await openObjectives(page)

    const sheet = await openCreateSheet(page)
    await expect(sheet.getByRole('combobox').filter({ hasText: 'Draft' })).toBeVisible({ timeout: 15_000 })
    await expect(sheet.getByRole('combobox').filter({ hasText: 'User Defined' })).toBeVisible({ timeout: 15_000 })
  })
})
