import { test, expect, readManifest } from '../fixtures/auth'

test.describe('user-settings — pages render', () => {
  test('/user-settings renders the User settings heading', async ({ page }) => {
    await page.goto('/user-settings', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 2, name: /^User settings$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('/user-settings/profile renders the My profile heading', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })

    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })
  })

  test('user menu shows the logged-in user email', async ({ page }) => {
    const { ownerEmail } = readManifest()
    await page.goto('/dashboard')

    await page.getByTestId('user-menu-trigger').click()
    await expect(page.getByText(ownerEmail)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('user-settings — profile forms (owner)', () => {
  test('profile name form renders the editable name fields', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('First name', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Last name', { exact: true })).toBeVisible()
    await expect(page.getByText('Display name', { exact: true })).toBeVisible()
  })

  test('delete-account is blocked for an org owner', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Delete Your Account', { exact: true })).toBeVisible({ timeout: 15_000 })

    const deleteButton = page.getByRole('button', { name: /^Delete account$/ })
    await expect(deleteButton).toBeVisible({ timeout: 15_000 })
    await expect(deleteButton).toBeDisabled()

    await page.locator('span.cursor-not-allowed').filter({ has: deleteButton }).hover()
    await expect(page.getByText(/You must transfer ownership or delete all organizations you own/)).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('user-settings — security & default-org panels (owner)', () => {
  test('Default Organization panel renders a selector and Save button', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Default Organization', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    await expect(
      page
        .getByRole('main')
        .getByRole('button', { name: /^Save$/ })
        .first(),
    ).toBeVisible()
  })

  test('Two Factor Authentication panel renders with a status badge and action', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Two Factor Authentication', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Mobile App Authentication' })).toBeVisible()

    const twoFaActions = page.getByRole('button', { name: /^(Configure|Enable|Disable|Remove)$/ })
    await expect(twoFaActions.first()).toBeVisible()
  })

  test('Passkeys panel renders its heading and Add passkey action', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Passkeys and Security Keys', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Add (passkey|another Passkey)$/ })).toBeVisible()
  })
})

test.describe('user-settings — profile validation (owner)', () => {
  test('clearing First name to a single character surfaces the min-length error on Save', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    const firstName = page.getByRole('main').getByRole('textbox').first()
    await firstName.fill('a')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^Save$/ })
      .first()
      .click()

    await expect(page.getByText('First name must be at least 2 characters').first()).toBeVisible({ timeout: 10_000 })
  })
})

test.describe('user-settings — default org dropdown (owner)', () => {
  test('the Default Organization selector opens and lists at least one organization', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByText('Default Organization', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    const trigger = page.getByRole('main').getByRole('combobox').first()
    await trigger.click()

    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10_000 })
    await page.keyboard.press('Escape')
  })
})
