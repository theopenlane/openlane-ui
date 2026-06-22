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

/**
 * Security / default-org panels on the profile page — render-only. The 2FA and
 * passkeys panels are asserted to be present but NEVER actuated (no Configure /
 * Enable / Remove click), since enrolling or disabling would change the seeded
 * Owner's auth and break future logins for every spec.
 */
test.describe('user-settings — security & default-org panels (owner)', () => {
  test('Default Organization panel renders a selector and Save button', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    // default-org-form.tsx PanelHeader heading + FormLabel.
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

    // profile-page.tsx Panel "Two Factor Authentication" → "Mobile App Authentication".
    await expect(page.getByText('Two Factor Authentication', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Mobile App Authentication' })).toBeVisible()

    // twoFAConfig always renders at least one action button; for an unverified
    // setup it's Configure, otherwise Enable/Disable/Remove. Assert at least one
    // is present without clicking any (clicking would change the Owner's 2FA).
    const twoFaActions = page.getByRole('button', { name: /^(Configure|Enable|Disable|Remove)$/ })
    await expect(twoFaActions.first()).toBeVisible()
  })

  test('Passkeys panel renders its heading and Add passkey action', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    // passkeys-section.tsx PanelHeader "Passkeys and security keys" + the
    // primary button (label varies: "Add passkey" vs "Add another Passkey").
    await expect(page.getByText('Passkeys and security keys', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Add (passkey|another Passkey)$/ })).toBeVisible()
  })
})

/**
 * Profile name-form client-side validation. Editing two characters out of a
 * field to drive the Zod min(2) error, then asserting the inline message WITHOUT
 * saving — never submits a real mutation that would rename the shared Owner.
 */
test.describe('user-settings — profile validation (owner)', () => {
  test('clearing First name to a single character surfaces the min-length error on Save', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    // profile-name-form.tsx: firstName is z.string().min(2). The first text
    // input in the "Your Profile" panel is First name. Type a single char and
    // submit — the resolver rejects it and renders the FormMessage; the
    // updateUser mutation never fires (so the Owner is never renamed).
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

/**
 * Default-Organization dropdown. The Select trigger is opened and asserted to
 * list at least one organization option — but NEVER picked-and-saved. The form's
 * onSubmit only fires updateUserSetting when the chosen org differs from the
 * current default, so leaving the dropdown open (or escaping it) never mutates
 * the shared Owner's default org.
 */
test.describe('user-settings — default org dropdown (owner)', () => {
  test('the Default Organization selector opens and lists at least one organization', async ({ page }) => {
    await page.goto('/user-settings/profile', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^My profile$/ })).toBeVisible({ timeout: 20_000 })

    // default-org-form.tsx renders a Radix Select (role=combobox) populated from
    // useGetAllOrganizations (non-personal orgs). Open it and confirm options
    // render, then Escape without choosing — no save, no mutation.
    await expect(page.getByText('Default Organization', { exact: true }).first()).toBeVisible({ timeout: 15_000 })
    const trigger = page.getByRole('main').getByRole('combobox').first()
    await trigger.click()

    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 10_000 })
    await page.keyboard.press('Escape')
  })
})
