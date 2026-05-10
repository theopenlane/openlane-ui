import { expect, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

// Both developers sub-routes are rendered by the same DevelopersPage
// component, which picks the heading from the URL via PAGE_CONFIG.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/developers/api-tokens', heading: /^API Tokens$/ },
  { path: '/developers/personal-access-tokens', heading: /^Personal Access Tokens$/ },
]

test.describe('developers — token pages render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await seedLoggedInUser(page, `dev-${path.split('/').pop()}`)

      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})

test.describe('developers — create API token', () => {
  test('happy path — name + Never expires → Create Token → "Token created" success screen', async ({ page }) => {
    await seedLoggedInUser(page, 'dev-create-token')

    await page.goto('/developers/api-tokens')

    // Toolbar Create trigger renders a Button "Create" (not "Create
    // token") — the only Create button on this page.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Token name min 3 chars (zod) — give a unique value.
    const tokenName = `E2E Token ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)

    // Tick "Never expires" so we don't have to fill the date input.
    await dialog.getByLabel(/^Never expires$/).check()

    await dialog.getByRole('button', { name: /^create token$/i }).click()

    // Success path swaps the dialog content to STEP.CREATED with title
    // "Token created" — surfaces the raw token in a readonly input.
    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeVisible({ timeout: 15_000 })
  })

  test('empty name → "Token name is required" inline error, dialog stays on Create step', async ({ page }) => {
    await seedLoggedInUser(page, 'dev-token-validation')

    await page.goto('/developers/api-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Leave the name empty; tick Never expires so the only outstanding
    // validation is the name field (min 3 chars per zod).
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    // Zod message from personal-access-token-create-dialog.tsx:55.
    await expect(dialog.getByText(/^Token name is required$/)).toBeVisible({ timeout: 5_000 })
    // Success dialog must NOT have appeared.
    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeHidden()
  })
})

test.describe('developers — create personal access token', () => {
  test('happy path — name + org select + Never expires → Create Token → "Token created" success screen', async ({ page }) => {
    await seedLoggedInUser(page, 'dev-create-pat')

    await page.goto('/developers/personal-access-tokens')

    // Same PersonalApiKeyDialog component as /api-tokens; toolbar
    // mounts the dialog with no triggerText prop, so the trigger is
    // the "Create" Button.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const tokenName = `E2E PAT ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)

    // PAT page (isApiKeyPage=false) requires at least one authorized
    // organization — the form has a refinement that rejects an empty
    // organizationIDs array. The fresh user has exactly one org (the
    // one created during register/onboarding), so pick the first item.
    await dialog.getByRole('button', { name: /^Select organization\(s\)$/ }).click()
    await page.getByRole('menuitemcheckbox').first().click()
    // Close the dropdown so the submit button is the next click target.
    await page.keyboard.press('Escape')

    await dialog.getByLabel(/^Never expires$/).check()

    await dialog.getByRole('button', { name: /^create token$/i }).click()

    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeVisible({ timeout: 15_000 })
  })
})
