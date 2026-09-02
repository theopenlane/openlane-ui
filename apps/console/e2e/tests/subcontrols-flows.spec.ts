import { test, expect } from '../fixtures/auth'
import { createControl, deleteControl, deleteSubcontrol, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName, uniqueRef } from '../utils/unique'
import { clickResilient } from '../utils/menu'

let ownerApi: ApiSession
let parentRefCode: string
let parentId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  parentRefCode = uniqueRef('E2E-PARENT')
  parentId = await createControl(ownerApi, parentRefCode)
})

test.afterAll(async () => {
  if (parentId) await deleteControl(ownerApi, parentId)
})

test.describe('controls — create subcontrol from the bare route', () => {
  test('the parent combobox searches controls and selecting one fills it', async ({ page }) => {
    test.slow()
    await page.goto('/controls/create-subcontrol', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/Create a? ?Subcontrol/).first()).toBeVisible({ timeout: 60_000 })

    const combobox = page.getByRole('combobox', { name: 'Search Control' })
    await combobox.click()
    await combobox.fill(parentRefCode)

    const option = page.getByRole('option', { name: new RegExp(parentRefCode) }).first()
    await expect(option).toBeVisible({ timeout: 30_000 })
    await clickResilient(option)

    await expect(combobox).toHaveValue(new RegExp(parentRefCode), { timeout: 30_000 })
  })

  test('a subcontrol created from the bare route lands on its detail page', async ({ page }) => {
    test.slow()
    const childRefCode = uniqueRef('E2E-SUBBARE')
    let childId = ''

    try {
      await page.goto('/controls/create-subcontrol', { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByText(/Create a? ?Subcontrol/).first()).toBeVisible({ timeout: 60_000 })

      const combobox = page.getByRole('combobox', { name: 'Search Control' })
      await combobox.click()
      await combobox.fill(parentRefCode)
      await clickResilient(page.getByRole('option', { name: new RegExp(parentRefCode) }).first())

      const refCode = page.getByLabel(/^Ref Code/)
      await expect(refCode).toBeEditable({ timeout: 30_000 })
      await refCode.fill(childRefCode)
      await page.getByRole('button', { name: /^Create$/ }).click()

      await expect(page).toHaveURL(new RegExp(`/controls/${parentId}/[^/]+$`), { timeout: 60_000 })
      childId = page.url().split('/').pop() ?? ''
      expect(childId).not.toBe('')
      await expect(page.getByText(childRefCode).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (childId) await deleteSubcontrol(ownerApi, childId)
    }
  })
})

test.describe('controls — create subcontrol inherits the parent classification', () => {
  test("the parent's category and subcategory are auto-filled", async ({ page }) => {
    test.slow()
    const category = uniqueName('E2E Cat')
    const subcategory = uniqueName('E2E Subcat')
    const classifiedId = await createControl(ownerApi, uniqueRef('E2E-CLASSIFIED'), { category, subcategory })

    try {
      await page.goto(`/controls/${classifiedId}/create-subcontrol`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByText(/Create a? ?Subcontrol/).first()).toBeVisible({ timeout: 60_000 })

      await expect(page.getByText(category).first()).toBeVisible({ timeout: 60_000 })
      await expect(page.getByText(subcategory).first()).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteControl(ownerApi, classifiedId)
    }
  })
})

test.describe('controls — create subcontrol', () => {
  test('the parent control is preselected from the route', async ({ page }) => {
    test.slow()
    await page.goto(`/controls/${parentId}/create-subcontrol`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByText(/Create a? ?Subcontrol/).first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('combobox', { name: 'Search Control' })).toHaveValue(new RegExp(parentRefCode), { timeout: 30_000 })
  })

  test('submitting without a Ref Code surfaces the required-field error', async ({ page }) => {
    test.slow()
    await page.goto(`/controls/${parentId}/create-subcontrol`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/Create a? ?Subcontrol/).first()).toBeVisible({ timeout: 60_000 })

    const refCode = page.getByLabel(/^Ref Code/)
    await expect(refCode).toBeEditable({ timeout: 30_000 })
    await refCode.fill('')
    await page.getByRole('button', { name: /^Create$/ }).click()

    await expect(page).toHaveURL(/\/create-subcontrol$/, { timeout: 15_000 })
    await expect(refCode).toBeVisible()
  })

  test('a subcontrol is created and lands on its detail page under the parent', async ({ page }) => {
    test.slow()
    const childRefCode = uniqueRef('E2E-SUB')
    let childId = ''

    try {
      await page.goto(`/controls/${parentId}/create-subcontrol`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
      await expect(page.getByText(/Create a? ?Subcontrol/).first()).toBeVisible({ timeout: 60_000 })

      const refCode = page.getByLabel(/^Ref Code/)
      await expect(refCode).toBeEditable({ timeout: 30_000 })
      await refCode.fill(childRefCode)
      await page.getByLabel('Title', { exact: true }).fill(`${childRefCode} title`)

      await page.getByRole('button', { name: /^Create$/ }).click()

      await expect(page).toHaveURL(new RegExp(`/controls/${parentId}/[^/]+$`), { timeout: 60_000 })
      childId = page.url().split('/').pop() ?? ''
      expect(childId).not.toBe('')

      await expect(page.getByText(childRefCode).first()).toBeVisible({ timeout: 60_000 })
    } finally {
      if (childId) await deleteSubcontrol(ownerApi, childId)
    }
  })
})
