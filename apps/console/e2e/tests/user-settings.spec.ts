import { test, expect, readManifest } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup). Pure render checks.
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

    // user-menu.tsx renders data.user.email under the displayName when the
    // trigger is clicked.
    await page.getByTestId('user-menu-trigger').click()
    await expect(page.getByText(ownerEmail)).toBeVisible({ timeout: 10_000 })
  })
})

/**
 * Profile-form sub-flows. The name form is read-only-asserted (a real save would
 * rename the shared Owner — harmless but non-idempotent). The delete-account test
 * only OPENS the typed-confirm gate and CANCELS — confirming would delete the
 * Owner and destroy every permission fixture, so it must never be confirmed.
 *
 * ⏳ Written without running; selectors grounded in profile-name-form.tsx +
 * delete-user-section.tsx. Verify on first run.
 */
test.describe('user-settings — profile forms (owner)', () => {
  test('profile name form renders the editable name fields', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    // profile-name-form.tsx FormLabels.
    await expect(page.getByText('First name', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Last name', { exact: true })).toBeVisible()
    await expect(page.getByText('Display name', { exact: true })).toBeVisible()
  })

  test('delete-account dialog enforces the typed DELETE gate (cancel-only)', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    // delete-user-section.tsx: "Delete User Account" button → ConfirmationDialog
    // (showInput → must type DELETE). We assert the gate and CANCEL — never
    // confirm (that would delete the seeded Owner and break all fixtures).
    await page.getByRole('button', { name: /^Delete User Account$/ }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    const confirm = dialog.getByRole('button', { name: /^Delete$/ })
    await expect(confirm).toBeDisabled()

    // Typing the wrong text keeps it disabled; we never enable+confirm it.
    await dialog.getByRole('textbox').fill('nope')
    await expect(confirm).toBeDisabled()

    await dialog.getByRole('button', { name: /^Cancel$/ }).click()
    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })
})
