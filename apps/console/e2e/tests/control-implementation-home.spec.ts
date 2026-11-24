import type { Locator, Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { createControl, createControlImplementation, createSubcontrol, deleteControl, deleteControlImplementation, getOwnerApi, gqlData, type ApiSession } from '../utils/api'
import { confirmDestructive, readMutation, toast, waitForMutation } from '../utils/mutations'
import { uniqueName, uniqueRef } from '../utils/unique'

type TImplementationState = {
  status: string | null
  verified: boolean | null
  verificationDate: string | null
  controls: { edges: Array<{ node: { id: string } }> }
}

const LIST_PATH = '/control-implementations'

let ownerApi: ApiSession
const implementationIds: string[] = []
const controlIds: string[] = []

const readImplementation = async (id: string): Promise<TImplementationState> => {
  const data = await gqlData<{ controlImplementation: TImplementationState }>(
    ownerApi,
    'controlImplementation',
    `query($id: ID!){ controlImplementation(id: $id){ status verified verificationDate controls { edges { node { id } } } } }`,
    { id },
  )
  return data.controlImplementation
}

const linkedControlIds = ({ controls }: TImplementationState): string[] => controls.edges.map(({ node }) => node.id).sort()

const seedControl = async (refCode: string): Promise<string> => {
  const id = await createControl(ownerApi, refCode)
  controlIds.push(id)
  return id
}

const seedImplementation = async (extra: Record<string, unknown> = {}): Promise<string> => {
  const id = await createControlImplementation(ownerApi, uniqueName('E2E Implementation'), extra)
  implementationIds.push(id)
  return id
}

const openTable = async (page: Page): Promise<void> => {
  await page.goto(LIST_PATH, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: 'Control Implementations', exact: true })).toBeVisible({ timeout: 60_000 })
}

const searchTable = (page: Page, term: string): Promise<void> => page.getByPlaceholder(/^Search$/).fill(term)

const rowFor = (page: Page, title: string): Locator => page.getByRole('row').filter({ has: page.getByText(title, { exact: true }) })

const titleHeading = (page: Page, title: string): Locator => page.getByRole('heading', { level: 1, name: title, exact: true })

const editButton = (page: Page): Locator => page.getByRole('button', { name: 'Edit control implementation', exact: true })

const saveButton = (page: Page): Locator => page.getByRole('button', { name: /^Save( Changes)?$/ })

const openImplementation = async (page: Page, id: string): Promise<void> => {
  await page.goto(`${LIST_PATH}/${id}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(editButton(page)).toBeVisible({ timeout: 60_000 })
}

const openMenuAction = async (page: Page, anchor: string): Promise<void> => {
  await page.getByTestId('control-implementation-actions-menu').click()
  await page.getByTestId(anchor).click()
}

const controlsSection = (page: Page): Locator => page.locator('section').filter({ has: page.getByRole('heading', { level: 2, name: 'Controls', exact: true }) })

const recordMutations = (page: Page, operationName: string): Array<Record<string, unknown>> => {
  const inputs: Array<Record<string, unknown>> = []
  page.on('request', (request) => {
    if (request.method() !== 'POST' || !request.postData()?.includes(`mutation ${operationName}(`)) return
    inputs.push(request.postDataJSON().variables.input)
  })
  return inputs
}

const createFromSheet = async (page: Page, sheet: Locator): Promise<string> => {
  const pending = waitForMutation(page, 'CreateControlImplementation')
  await sheet.getByRole('button', { name: /^Create$/ }).click()
  const response = await pending
  expect((await readMutation(response)).errors).toEqual([])
  const id: string = (await response.json()).data.createControlImplementation.controlImplementation.id
  implementationIds.push(id)
  await expect(page).toHaveURL(new RegExp(`${LIST_PATH}/${id}$`), { timeout: 60_000 })
  return id
}

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.afterAll(async () => {
  await Promise.all(implementationIds.map((id) => deleteControlImplementation(ownerApi, id)))
  await Promise.all(controlIds.map((id) => deleteControl(ownerApi, id)))
})

test.describe('control implementations — table', () => {
  test('creating with a picked control opens the new page, and Enter in the picker creates nothing', async ({ page }) => {
    test.slow()
    const refCode = uniqueRef('E2E-CI-PICK')
    const controlId = await seedControl(refCode)
    const creates = recordMutations(page, 'CreateControlImplementation')

    await openTable(page)
    await page.getByRole('button', { name: /^Create$/ }).click()

    const sheet = page.getByRole('dialog')
    const search = sheet.getByPlaceholder('Search controls', { exact: true })
    await search.fill(refCode)
    const controlRow = sheet.getByRole('row').filter({ hasText: refCode })
    await expect(controlRow).toBeVisible({ timeout: 30_000 })

    await search.press('Enter')
    await controlRow.getByRole('checkbox').click()
    await expect(controlRow.getByRole('checkbox')).toBeChecked()
    expect(creates).toEqual([])

    const id = await createFromSheet(page, sheet)

    expect(creates).toHaveLength(1)
    expect(creates[0].controlIDs).toEqual([controlId])
    await expect(titleHeading(page, `${refCode} Implementation`)).toBeVisible({ timeout: 60_000 })
    expect(linkedControlIds(await readImplementation(id))).toEqual([controlId])
  })

  test('the Not verified filter keeps records that were never verified', async ({ page }) => {
    test.slow()
    const base = uniqueRef('E2E-CI-VER')
    const refs = { verified: `${base}-YES`, unverified: `${base}-NO`, never: `${base}-NEVER` }
    const title = (refCode: string) => `${refCode} Implementation`

    await seedImplementation({ controlIDs: [await seedControl(refs.verified)], verified: true })
    await seedImplementation({ controlIDs: [await seedControl(refs.unverified)], verified: false })
    const neverId = await seedImplementation({ controlIDs: [await seedControl(refs.never)] })
    expect((await readImplementation(neverId)).verified).not.toBe(true)

    await openTable(page)
    await searchTable(page, base)
    await expect(rowFor(page, title(refs.verified))).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    const menu = page.getByRole('menu')
    await menu.getByRole('button', { name: 'Verified', exact: true }).click()
    await menu.getByRole('radio', { name: 'Not verified', exact: true }).click()
    await menu.getByRole('button', { name: /^View Results$/ }).click()

    await expect(rowFor(page, title(refs.verified))).toHaveCount(0, { timeout: 30_000 })
    await expect(rowFor(page, title(refs.unverified))).toBeVisible()
    await expect(rowFor(page, title(refs.never))).toBeVisible()
  })

  test('the table and the page title a record by the same first control', async ({ page }) => {
    test.slow()
    const base = uniqueRef('E2E-CI-TITLE')
    const tenth = await seedControl(`${base}-10`)
    const second = await seedControl(`${base}-2`)
    const id = await seedImplementation({ controlIDs: [tenth, second] })
    const title = `${base}-2 Implementation`

    await openTable(page)
    await searchTable(page, `${base}-10`)
    await expect(rowFor(page, title)).toBeVisible({ timeout: 30_000 })

    await rowFor(page, title).getByText(title, { exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${LIST_PATH}/${id}$`), { timeout: 60_000 })
    await expect(titleHeading(page, title)).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('control implementations — page', () => {
  test('verifying and un-verifying sets and clears the verification date', async ({ page }) => {
    test.slow()
    const id = await seedImplementation({ controlIDs: [await seedControl(uniqueRef('E2E-CI-TOGGLE'))] })
    await openImplementation(page, id)

    const verifying = waitForMutation(page, 'UpdateControlImplementation')
    await page.getByRole('button', { name: 'Mark Verified', exact: true }).click()
    expect((await verifying).request().postDataJSON().variables.input).toEqual({ verified: true })
    await expect(page.getByRole('combobox', { name: 'Verified. Change verification', exact: true })).toBeVisible({ timeout: 30_000 })
    await expect.poll(async () => (await readImplementation(id)).verificationDate, { timeout: 30_000 }).toBeTruthy()

    const unverifying = waitForMutation(page, 'UpdateControlImplementation')
    await page.getByRole('button', { name: 'Mark Not Verified', exact: true }).click()
    expect((await unverifying).request().postDataJSON().variables.input).toEqual({ verified: false, clearVerificationDate: true })
    await expect(page.getByRole('combobox', { name: 'Not verified. Change verification', exact: true })).toBeVisible({ timeout: 30_000 })
    await expect.poll(async () => (await readImplementation(id)).verificationDate, { timeout: 30_000 }).toBeNull()
  })

  test('a save with no change sends nothing, and an edit sends only the details', async ({ page }) => {
    test.slow()
    const id = await seedImplementation({ controlIDs: [await seedControl(uniqueRef('E2E-CI-EDIT'))] })
    const updates = recordMutations(page, 'UpdateControlImplementation')
    const editor = page.getByRole('tabpanel', { name: 'Overview' }).locator('[contenteditable="true"]')

    await openImplementation(page, id)
    await editButton(page).click()
    await expect(editor).toBeVisible({ timeout: 30_000 })
    await saveButton(page).click()
    await expect(editButton(page)).toBeVisible({ timeout: 30_000 })
    expect(updates).toEqual([])

    await editButton(page).click()
    await editor.click()
    await page.keyboard.type('Reviewed quarterly.')
    const pending = waitForMutation(page, 'UpdateControlImplementation')
    await saveButton(page).click()
    const update = await pending

    expect(Object.keys(update.request().postDataJSON().variables.input)).toEqual(['details'])
    await expect(toast(page, 'Control Implementation updated')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('tabpanel', { name: 'Overview' }).getByText('Reviewed quarterly.')).toBeVisible({ timeout: 30_000 })
  })

  test('a clone keeps the controls as a draft, and deleting it returns to the table', async ({ page }) => {
    test.slow()
    const base = uniqueRef('E2E-CI-CLONE')
    const controls = [await seedControl(`${base}-1`), await seedControl(`${base}-2`)].sort()
    const originalId = await seedImplementation({ controlIDs: controls, status: 'PUBLISHED', verified: true })

    await openImplementation(page, originalId)
    await openMenuAction(page, 'control-implementation-clone-button')
    const cloneId = await createFromSheet(page, page.getByRole('dialog'))

    expect(cloneId).not.toBe(originalId)
    const clone = await readImplementation(cloneId)
    expect(clone.status).toBe('DRAFT')
    expect(clone.verified).not.toBe(true)
    expect(linkedControlIds(clone)).toEqual(controls)

    await expect(page.getByRole('combobox', { name: 'Status: Draft. Change status', exact: true })).toBeVisible({ timeout: 60_000 })
    await openMenuAction(page, 'control-implementation-delete-button')
    await confirmDestructive(page, 'DeleteControlImplementation')

    await expect(page).toHaveURL(new RegExp(`${LIST_PATH}$`), { timeout: 60_000 })
    expect(linkedControlIds(await readImplementation(originalId))).toEqual(controls)
  })

  test('a control linked only through its subcontrol is not a link and says why', async ({ page }) => {
    test.slow()
    const controlRef = uniqueRef('E2E-CI-PARENT')
    const subcontrolRef = uniqueRef('E2E-CI-CHILD')
    const controlId = await seedControl(controlRef)
    const subcontrolId = await createSubcontrol(ownerApi, subcontrolRef, controlId)
    const id = await seedImplementation({ subcontrolIDs: [subcontrolId] })

    await openImplementation(page, id)
    const section = controlsSection(page)
    await expect(section.getByRole('link', { name: subcontrolRef, exact: true })).toHaveAttribute('href', `/controls/${controlId}/${subcontrolId}`, { timeout: 30_000 })

    const parent = section.getByText(controlRef, { exact: true })
    await expect(parent).toBeVisible()
    await expect(section.getByRole('link', { name: controlRef, exact: true })).toHaveCount(0)
    await parent.hover()
    await expect(page.getByRole('tooltip').getByText('Not linked directly. Only its subcontrols are linked to this implementation.')).toBeAttached({ timeout: 15_000 })
  })

  test('the List choice survives a reload', async ({ page }) => {
    test.slow()
    const id = await seedImplementation({ controlIDs: [await seedControl(uniqueRef('E2E-CI-VIEW'))] })

    await openImplementation(page, id)
    const listTab = controlsSection(page).getByRole('tab', { name: 'List', exact: true })
    await expect(controlsSection(page).getByRole('tab', { name: 'Map', exact: true })).toHaveAttribute('aria-selected', 'true', { timeout: 30_000 })
    await listTab.click()
    await expect(listTab).toHaveAttribute('aria-selected', 'true')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(listTab).toHaveAttribute('aria-selected', 'true', { timeout: 60_000 })
    await expect(controlsSection(page).getByRole('columnheader', { name: 'Title', exact: true })).toBeVisible()
  })

  test('an unknown id shows the not-found state and leads back to the table', async ({ page }) => {
    test.slow()
    await page.goto(`${LIST_PATH}/01ARZ3NDEKTSV4RRFFQ69G5FAV`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByText('Control implementation not found.', { exact: true })).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: 'Back to Implementations', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`${LIST_PATH}$`), { timeout: 60_000 })
  })
})
