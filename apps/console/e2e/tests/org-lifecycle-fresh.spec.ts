import type { Page } from '@playwright/test'
import { test, expect } from '@playwright/test'

import { addOrgMember, createSharedOrg, getOwnerApi, getSelf, loginViaApi, roleOf } from '../utils/api'
import { PASSWORD, RUN_ID } from '../utils/constants'
import { registerAndVerify } from '../utils/registerUser'
import { seedLoggedInUser, seedNonOwnerMember } from '../utils/seedUser'
import { expectMutationOk } from '../utils/mutations'
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

test.describe('organization — non-owner member', () => {
  test('a member can leave the shared organization', async ({ page }) => {
    test.slow()
    const { email, orgId } = await seedNonOwnerMember(page, 'leave')

    await page.goto('/organization', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Existing organizations$/ })).toBeVisible({ timeout: 30_000 })

    await page
      .getByRole('button', { name: /^Leave$/ })
      .first()
      .click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Leave Organization')).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole('button', { name: /^Leave$/ }).click()

    await expect(page.getByText('Successfully left organization').first()).toBeVisible({ timeout: 30_000 })

    const ownerApi = await getOwnerApi()
    await expect.poll(async () => roleOf(ownerApi, orgId, email), { timeout: 60_000 }).toBeNull()
  })

  test('a member who owns no organization can delete their account', async ({ page }) => {
    test.slow()
    const { email, orgId } = await seedNonOwnerMember(page, 'selfdelete')

    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 30_000 })

    const deleteButton = page.getByRole('button', { name: /^Delete account$/ })
    await expect(deleteButton).toBeEnabled({ timeout: 30_000 })
    await deleteButton.click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Delete Your Account')).toBeVisible({ timeout: 30_000 })

    const confirm = dialog.getByRole('button', { name: /^Delete$/ })
    await expect(confirm).toBeDisabled()
    await dialog.getByRole('textbox').fill('DELETE')
    await expect(confirm).toBeEnabled({ timeout: 15_000 })
    await confirm.click()

    const ownerApi = await getOwnerApi()
    await expect.poll(async () => roleOf(ownerApi, orgId, email), { timeout: 60_000 }).toBeNull()
  })
})

test.describe('user-settings — two-factor and default org (fresh user)', () => {
  test('Configure provisions a TFA setting and opens the QR dialog', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'tfa')

    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('A second factor method has not been setup for your account.')).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'CreateTFASetting', async () => {
      await page.getByRole('button', { name: /^Configure$/ }).click()
    })

    await expect(page.getByRole('heading', { name: 'Scan this QR Code' })).toBeVisible({ timeout: 30_000 })
  })

  test('choosing a default organization and saving persists it', async ({ page }) => {
    test.slow()
    const { email } = await seedLoggedInUser(page, 'defaultorg')

    const api = await loginViaApi(email)
    await createSharedOrg(api, uniqueName('E2E Second Org'))

    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const panel = page.locator('form').filter({ hasText: 'Default Organization' }).first()
    const trigger = panel.getByRole('combobox').first()
    await expect(trigger).toBeVisible({ timeout: 30_000 })

    const current = (await trigger.innerText()).trim()
    await trigger.click()

    const options = page.getByRole('option')
    await expect(options.first()).toBeVisible({ timeout: 30_000 })
    const labels = (await options.allInnerTexts()).map((t) => t.trim())
    const different = labels.find((label) => label && label !== current)
    expect(different, 'the user needs a second organization to switch to').toBeTruthy()
    await page
      .getByRole('option', { name: different ?? '', exact: true })
      .first()
      .click()

    await expectMutationOk(page, 'UpdateUserSetting', async () => {
      await panel
        .getByRole('button', { name: /^Save$/ })
        .last()
        .click()
    })

    await expect(page.getByText('Default organization updated successfully!').first()).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('organization — general settings name (fresh org)', () => {
  test('renaming the organization from general settings persists', async ({ page }) => {
    test.slow()
    await seedLoggedInUser(page, 'orgname')
    const renamed = uniqueName('E2E Renamed Org')

    await page.goto('/organization-settings/general-settings', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const nameField = page.locator('input[name="displayName"]').first()
    await expect(async () => {
      if (!(await nameField.isVisible().catch(() => false))) {
        await page.reload({ waitUntil: 'domcontentloaded' })
      }
      await expect(nameField).toBeVisible({ timeout: 20_000 })
    }).toPass({ timeout: 120_000 })
    await nameField.fill(renamed)

    await expectMutationOk(page, 'UpdateOrganization', async () => {
      await page.getByRole('button', { name: /^Save/ }).first().click()
    })

    await expect(async () => {
      await page.reload({ waitUntil: 'domcontentloaded' })
      await expect(nameField).toHaveValue(renamed, { timeout: 20_000 })
    }).toPass({ timeout: 120_000 })
  })
})
