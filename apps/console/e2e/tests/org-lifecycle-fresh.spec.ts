import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'

import { addOrgMember, getSelf, loginViaApi } from '../utils/api'
import { PASSWORD, RUN_ID } from '../utils/constants'
import { registerAndVerify } from '../utils/registerUser'
import { seedLoggedInUser } from '../utils/seedUser'
import { uniqueName } from '../utils/unique'

const openGeneralSettings = async (page: Page, marker: ReturnType<Page['getByText']>): Promise<void> => {
  await expect
    .poll(
      async () => {
        if (await marker.isVisible().catch(() => false)) return true
        await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded', timeout: 180_000 })
        return marker.isVisible().catch(() => false)
      },
      { timeout: 120_000, intervals: [2_000] },
    )
    .toBe(true)
}

const orgNameField = (page: Page) => page.locator('form').filter({ hasText: 'Save Changes' }).getByRole('textbox').first()

const shortOrgName = (prefix: string): string => `${prefix} ${Date.now().toString(36)}`.slice(0, 32)

test.describe('organization settings — general settings on a fresh org', () => {
  test('renaming the organization persists across a reload', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'org-rename')

    await openGeneralSettings(page, page.getByText('Organization name'))

    const renamed = shortOrgName('E2E Renamed')
    await orgNameField(page).fill(renamed)
    await page.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText('Organization updated', { exact: true }).first()).toBeVisible({ timeout: 30_000 })

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(orgNameField(page)).toHaveValue(renamed, { timeout: 60_000 })
  })

  test('a one-character organization name is rejected', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'org-rename-invalid')

    await openGeneralSettings(page, page.getByText('Organization name'))

    await orgNameField(page).fill('x')
    await page.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(/at least 2/i).first()).toBeVisible({ timeout: 20_000 })
    await expect(page.getByText('Organization updated', { exact: true })).toHaveCount(0)
  })

  test('deleting the organization requires the typed DELETE and lands on /organization', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'org-delete')

    await openGeneralSettings(page, page.getByRole('button', { name: /^Delete organization$/ }))
    await page.getByRole('button', { name: /^Delete organization$/ }).click()

    const confirmation = page.getByRole('alertdialog')
    await expect(confirmation.getByRole('heading', { name: /^Delete Organization/ })).toBeVisible({ timeout: 20_000 })

    const confirm = confirmation.getByRole('button', { name: /^Delete$/ })
    await expect(confirm).toBeDisabled()

    await confirmation.getByRole('textbox').fill('DELETE')
    await expect(confirm).toBeEnabled({ timeout: 15_000 })
    await confirm.click()

    await expect(page.getByText('Organization successfully deleted', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
    await expect(page).toHaveURL(/\/organization$/, { timeout: 60_000 })
  })
})

test.describe('organization settings — transfer ownership on a fresh org', () => {
  test('transferring to a seeded admin reports success', async ({ page }) => {
    test.slow()
    const { email: ownerEmail, orgId } = await seedLoggedInUser(page, 'org-transfer')

    const successorEmail = `successor-${RUN_ID}-${Date.now().toString(36)}@e2e-transfer.invalid`
    await registerAndVerify({ email: successorEmail })

    const ownerApi = await loginViaApi(ownerEmail, PASSWORD)
    const successorApi = await loginViaApi(successorEmail, PASSWORD)
    const successor = await getSelf(successorApi)
    await addOrgMember(ownerApi, orgId, successor.id, 'ADMIN')

    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText('Transfer ownership').first()).toBeVisible({ timeout: 60_000 })
    await page.getByRole('button', { name: /^Transfer ownership$/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('heading', { name: 'Transfer ownership' })).toBeVisible({ timeout: 30_000 })

    const transfer = dialog.getByRole('button', { name: /^Transfer$/ })
    await expect(transfer).toBeDisabled()
    await dialog.getByPlaceholder('Email').fill(successorEmail)
    await expect(transfer).toBeEnabled({ timeout: 15_000 })
    await transfer.click()

    await expect(page.getByText(/^Ownership transfer(red| initiated)$/).first()).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('organization — create and switch on a fresh account', () => {
  test('creating a second organization switches into it and lists it', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'org-create')

    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Create (your first|another) organization$/ })).toBeVisible({ timeout: 60_000 })

    const created = shortOrgName('E2E Second')
    await page.locator('input[name="name"]').fill(created)
    await page.getByRole('button', { name: /^Create organization$/ }).click()

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 90_000 })

    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(created).first()).toBeVisible({ timeout: 60_000 })
  })

  test('the previous organization can be switched back into from the list', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'org-switch')

    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Create (your first|another) organization$/ })).toBeVisible({ timeout: 60_000 })

    const created = shortOrgName('E2E Switch')
    await page.locator('input[name="name"]').fill(created)
    await page.getByRole('button', { name: /^Create organization$/ }).click()
    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 90_000 })

    await page.goto('/organization', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const select = page.getByRole('button', { name: /^Select$/ })
    await expect(select.first()).toBeVisible({ timeout: 60_000 })
    const before = await select.count()

    await select.first().click()

    await expect.poll(async () => page.getByRole('button', { name: /^Select$/ }).count(), { timeout: 90_000 }).not.toBe(before)
  })
})

test.describe('user settings — profile on a fresh account', () => {
  test('editing the profile first and last name persists across a reload', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'profile-name')

    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 60_000 })

    await expect(page.getByLabel('Email', { exact: true })).not.toHaveValue('', { timeout: 60_000 })

    const stamp = Date.now().toString(36)
    const firstName = `E2EFirst${stamp}`
    const lastName = `E2ELast${stamp}`

    await page.getByLabel('First name', { exact: true }).fill(firstName)
    await page.getByLabel('Last name', { exact: true }).fill(lastName)
    await page.getByLabel('Display name', { exact: true }).fill(`${firstName} ${lastName}`)

    const saved = page.waitForResponse((response) => (response.request().postData() ?? '').includes('UpdateUser'), { timeout: 60_000 })
    await page
      .getByRole('main')
      .getByRole('button', { name: /^Save$/ })
      .first()
      .click()
    expect((await saved).ok()).toBe(true)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByLabel('First name', { exact: true })).toHaveValue(firstName, { timeout: 60_000 })
    await expect(page.getByLabel('Last name', { exact: true })).toHaveValue(lastName, { timeout: 60_000 })
  })
})
