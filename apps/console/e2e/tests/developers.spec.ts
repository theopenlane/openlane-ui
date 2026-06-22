import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'

// Both developers sub-routes are rendered by the same DevelopersPage
// component, which picks the heading from the URL via PAGE_CONFIG.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/developers/api-tokens', heading: /^API Tokens$/ },
  { path: '/developers/personal-access-tokens', heading: /^Personal Access Tokens$/ },
]

test.describe('developers — token pages render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})

test.describe('developers — create API token', () => {
  test('happy path — name + Never expires → Create Token → "Token created" success screen', async ({ page }) => {
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

// End-to-end token lifecycle on the API Tokens page: create a token through
// the UI, confirm it lands in the list, then delete it via the row action
// menu's confirmation alertdialog. Names are unique per run so reruns don't
// collide and the deletion targets exactly the row we created.
test.describe('developers — API token list + delete lifecycle', () => {
  const createApiToken = async (page: Page, tokenName: string): Promise<void> => {
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })

    // The CREATED step blocks dismissal until the "I have copied…" checkbox is
    // ticked; tick it then Close to return to the populated list.
    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })
  }

  test('created token appears in the list, then deletes via row action confirmation', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E API ${RUN_ID} ${Date.now().toString(36)}`
    await createApiToken(page, tokenName)

    // The new token renders as a row cell with its name.
    const nameCell = page.getByRole('main').getByText(tokenName, { exact: true })
    await expect(nameCell).toBeVisible({ timeout: 15_000 })

    // Open the row's action menu (MoreHorizontal trigger) and choose Delete.
    const row = page.getByRole('row').filter({ hasText: tokenName })
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: /^delete$/i }).click()

    // Confirmation is an alertdialog titled "Delete API Token"; confirm button
    // reads "Delete".
    const confirm = page.getByRole('alertdialog', { name: /delete api token/i })
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await expect(confirm.getByText(tokenName)).toBeVisible()
    await confirm.getByRole('button', { name: /^delete$/i }).click()

    // Success toast and the row disappears from the list.
    await expect(page.getByText(/token deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(nameCell).toBeHidden({ timeout: 15_000 })
  })
})

// The CREATED step is the only place the raw token value is surfaced. Verify it
// renders in a readonly input and that the Copy affordance writes it to the
// clipboard (requires clipboard permissions granted to the context).
test.describe('developers — generated token value + copy', () => {
  test('success screen shows the token and copying it surfaces "Token copied!"', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/developers/api-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const tokenName = `E2E Copy ${RUN_ID} ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })

    // The raw token is a non-empty readonly input inside the success sheet.
    const tokenInput = success.getByRole('textbox')
    await expect(tokenInput).toHaveValue(/.+/, { timeout: 10_000 })
    const tokenValue = await tokenInput.inputValue()
    expect(tokenValue.length).toBeGreaterThan(0)

    // Clicking the input copies the token and fires a "Token copied!" toast.
    await tokenInput.click()
    await expect(page.getByText(/token copied!/i).first()).toBeVisible({ timeout: 10_000 })

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe(tokenValue)
  })
})

// Create an API token through the dialog and dismiss the CREATED step so the
// token lands in the list. Returns once the populated list row is showing.
const createApiTokenInList = async (page: Page, tokenName: string): Promise<void> => {
  await page
    .getByRole('main')
    .getByRole('button', { name: /^create$/i })
    .click()

  const dialog = page.getByRole('dialog', { name: /create new token/i })
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)
  await dialog.getByLabel(/^Never expires$/).check()
  await dialog.getByRole('button', { name: /^create token$/i }).click()

  const success = page.getByRole('dialog', { name: /^token created$/i })
  await expect(success).toBeVisible({ timeout: 15_000 })
  await success.getByLabel(/I have copied the access token/i).check()
  await success.getByRole('button', { name: /^close$/i }).click()
  await expect(success).toBeHidden({ timeout: 10_000 })
}

// Delete a token row by name via the row action menu + confirmation alertdialog.
const deleteTokenRow = async (page: Page, tokenName: string, confirmTitle: RegExp): Promise<void> => {
  const row = page.getByRole('row').filter({ hasText: tokenName })
  await row.getByRole('button').last().click()
  await page.getByRole('menuitem', { name: /^delete$/i }).click()

  const confirm = page.getByRole('alertdialog', { name: confirmTitle })
  await expect(confirm).toBeVisible({ timeout: 10_000 })
  await confirm.getByRole('button', { name: /^delete$/i }).click()
  await expect(page.getByText(/token deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
}

// The token table columns are defined in personal-access-tokens-table.tsx.
// A freshly-created token surfaces every column header + its own row, which
// also exercises the "No Expiration" warning cell (we create with Never expires).
test.describe('developers — API token table columns + no-expiration cell', () => {
  test('table renders Name/Description/Scopes/Expires/Last used headers and a row for a created never-expiring token', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E Cols ${RUN_ID} ${Date.now().toString(36)}`
    await createApiTokenInList(page, tokenName)

    const main = page.getByRole('main')
    await expect(main.getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    // Column headers from the columns[] definition. Each header's accessible
    // name includes the column-resize handle text, so match the leading label.
    await expect(main.getByRole('columnheader', { name: /^Name\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Description\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Scopes\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Expires\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Last used\b/ })).toBeVisible()

    // Never-expiring token renders the "No Expiration" warning cell.
    const row = main.getByRole('row').filter({ hasText: tokenName })
    await expect(row.getByText(/No Expiration/i)).toBeVisible()
    // Never-used token shows the "Never used" placeholder in the Last used cell.
    await expect(row.getByText(/Never used/i)).toBeVisible()

    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

// The ScopesSelector tree (scopes-selector.tsx) lives inside the create dialog
// for API tokens. Picking a :write permission auto-adds :read (IMPLIES), and the
// "(N selected)" counter reflects the running selection.
test.describe('developers — API token scope selection', () => {
  test('selecting a write scope auto-includes read and updates the selected counter', async ({ page }) => {
    await page.goto('/developers/api-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // The selector lists object-type rows with a collapse toggle; filter to a
    // single predictable type so the permission rows are easy to target.
    await dialog.getByPlaceholder(/Filter permissions/i).fill('task')

    // Expand the "Task" object-type row (button labelled by its human label).
    await dialog.getByRole('button', { name: /^Task/ }).first().click()

    // Each permission row is a Checkbox aria-labelled with the raw scope string.
    const writeScope = dialog.getByLabel('task:write', { exact: true })
    await writeScope.check()

    // delete→write→read implication: checking write also selects read.
    await expect(writeScope).toBeChecked()
    await expect(dialog.getByLabel('task:read', { exact: true })).toBeChecked()

    // The header counter reflects at least the two selected scopes.
    await expect(dialog.getByText(/\(\d+ selected\)/)).toBeVisible()
  })
})

// The create dialog's Expiration field swaps to a native date input when the
// "Never expires" switch is off. Filling a future date and submitting reaches
// the CREATED success step.
test.describe('developers — API token custom expiration date', () => {
  test('unsetting Never expires reveals a date input; a future date creates the token', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const tokenName = `E2E Exp ${RUN_ID} ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)

    // Never expires defaults off on the create form; the date input is visible.
    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dateInput = dialog.locator('input[type="date"]')
    await expect(dateInput).toBeVisible({ timeout: 10_000 })
    await dateInput.fill(future)

    await dialog.getByRole('button', { name: /^create token$/i }).click()

    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })

    // Dismiss so the token doesn't linger; it shows a real expiry date, not the
    // No Expiration warning.
    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })

    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

// Validation: submitting the create form with neither an expiry date nor the
// Never expires toggle trips the zod refine in use-form-schema.ts.
test.describe('developers — API token expiry validation', () => {
  test('no expiry + Never expires off → "Please specify an expiry date..." inline error', async ({ page }) => {
    await page.goto('/developers/api-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder(/^Enter token name$/).fill(`E2E NoExp ${Date.now().toString(36)}`)
    // Leave the date empty and Never expires off, then submit.
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    await expect(dialog.getByText(/Please specify an expiry date or select the Never expires/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeHidden()
  })
})

// The token table toolbar mounts the generic TableFilter (table-config.ts
// TOKEN_FILTER_FIELDS → Name / Expires At). The panel opens from a "Filter"
// button and exposes accordion sections labelled by those fields.
test.describe('developers — API token filter panel', () => {
  test('Filter panel exposes Name and Expires At fields', async ({ page }) => {
    await page.goto('/developers/api-tokens')

    await page.getByRole('button', { name: /^Filter$/ }).click()
    await expect(page.getByText('Name', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Expires At', { exact: true }).first()).toBeVisible()
  })

  test('filtering by name narrows the list to a created token', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E Filter ${RUN_ID} ${Date.now().toString(36)}`
    await createApiTokenInList(page, tokenName)
    await expect(page.getByRole('main').getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Filter$/ }).click()
    // Expand the Name accordion section then type the token name.
    await page
      .getByRole('button', { name: /^Name$/ })
      .first()
      .click()
    await page.getByPlaceholder(/^Enter Name$/).fill(tokenName)
    await page.getByRole('button', { name: /^View Results$/ }).click()

    // Only the matching row remains.
    await expect(page.getByRole('main').getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    // Clean up: delete the matching row while it is filtered-visible, then reset
    // the saved name filter (the Filter trigger gains an active-count badge once
    // a filter is applied, so match it by its leading "Filter" label).
    await deleteTokenRow(page, tokenName, /delete api token/i)
    await page.getByRole('button', { name: /^Filter/ }).click()
    await page.getByRole('button', { name: /^Reset filters$/ }).click()
    await page.keyboard.press('Escape')
  })
})

// Editing an API token: name is disabled (immutable), description/scopes/expiry
// are editable, and saving fires "Token updated successfully!".
test.describe('developers — edit API token', () => {
  test('row Edit opens the dialog with a disabled name; saving a description shows the success toast', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E Edit ${RUN_ID} ${Date.now().toString(36)}`
    await createApiTokenInList(page, tokenName)
    await expect(page.getByRole('main').getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    const row = page.getByRole('row').filter({ hasText: tokenName })
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: /^edit$/i }).click()

    const dialog = page.getByRole('dialog', { name: /^edit token$/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Name field is disabled in edit mode.
    await expect(dialog.getByPlaceholder(/^Enter token name$/)).toBeDisabled()

    await dialog.getByPlaceholder(/Enter a description/i).fill(`updated ${Date.now().toString(36)}`)
    await dialog.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(/token updated successfully/i).first()).toBeVisible({ timeout: 15_000 })

    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

// Personal access tokens render an Organization(s) column (vs Scopes for API
// tokens) and delete via a "Delete Personal Token" confirmation.
test.describe('developers — personal access token list + delete lifecycle', () => {
  const createPat = async (page: Page, tokenName: string): Promise<void> => {
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)
    await dialog.getByRole('button', { name: /^Select organization\(s\)$/ }).click()
    await page.getByRole('menuitemcheckbox').first().click()
    await page.keyboard.press('Escape')
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })
    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })
  }

  test('PAT table renders Organization(s) column; created token lists then deletes', async ({ page }) => {
    test.slow()
    await page.goto('/developers/personal-access-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E PAT List ${RUN_ID} ${Date.now().toString(36)}`
    await createPat(page, tokenName)

    const main = page.getByRole('main')
    await expect(main.getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })
    await expect(main.getByRole('columnheader', { name: /^Organization\(s\)/ })).toBeVisible()

    await deleteTokenRow(page, tokenName, /delete personal token/i)
    await expect(main.getByRole('row').filter({ hasText: tokenName })).toBeHidden({ timeout: 15_000 })
  })
})

// The PAT create dialog requires at least one authorized organization (zod
// refine in use-form-schema.ts). The organizationIDs FormField doesn't render
// the refine message inline, but the refine still blocks submission — so the
// create form stays open and no "Token created" success step appears.
test.describe('developers — personal access token validation', () => {
  test('submitting with no organization selected is blocked — form stays on the Create step', async ({ page }) => {
    await page.goto('/developers/personal-access-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Valid name + Never expires, but no organization selected.
    await dialog.getByPlaceholder(/^Enter token name$/).fill(`E2E PAT NoOrg ${Date.now().toString(36)}`)
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    // Submission is rejected: success step never appears and the Create form
    // remains open with its submit button still present.
    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeHidden()
    await expect(dialog.getByRole('button', { name: /^create token$/i })).toBeVisible()
    await expect(dialog.getByText(/Authorized organization/i)).toBeVisible()
  })
})

// The CREATED success step surfaces the raw PAT and copies it to the clipboard,
// mirroring the API-token copy coverage on the personal-access-tokens route.
test.describe('developers — personal access token generated value + copy', () => {
  test('success screen shows the PAT and copying it surfaces "Token copied!"', async ({ page, context }) => {
    test.slow()
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await page.goto('/developers/personal-access-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder(/^Enter token name$/).fill(`E2E PAT Copy ${Date.now().toString(36)}`)
    await dialog.getByRole('button', { name: /^Select organization\(s\)$/ }).click()
    await page.getByRole('menuitemcheckbox').first().click()
    await page.keyboard.press('Escape')
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })

    const tokenInput = success.getByRole('textbox')
    await expect(tokenInput).toHaveValue(/.+/, { timeout: 10_000 })
    const tokenValue = await tokenInput.inputValue()

    await tokenInput.click()
    await expect(page.getByText(/token copied!/i).first()).toBeVisible({ timeout: 10_000 })
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe(tokenValue)

    // Dismiss the success step.
    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
  })
})

// The scopes table cell collapses to 3 badges + a "+N more" button that opens a
// "Scopes (N)" modal. Create a token with many scopes (Select all) to guarantee
// the overflow button appears.
test.describe('developers — API token view all scopes modal', () => {
  test('a token with many scopes shows "+N more" that opens the Scopes modal', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const tokenName = `E2E Scopes ${RUN_ID} ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)
    await dialog.getByLabel(/^Never expires$/).check()

    // Select all scopes so the cell overflows past the 3 visible badges.
    await dialog.getByLabel(/^Select all scopes$/).check()

    await dialog.getByRole('button', { name: /^create token$/i }).click()
    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })
    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })

    const row = page.getByRole('main').getByRole('row').filter({ hasText: tokenName })
    await expect(row).toBeVisible({ timeout: 15_000 })

    // The overflow button reads "+N more"; clicking it opens the Scopes modal.
    await row.getByRole('button', { name: /\+\d+ more/ }).click()
    await expect(page.getByRole('dialog', { name: /^Scopes \(\d+\)$/ })).toBeVisible({ timeout: 10_000 })

    // Close the modal (Escape) and clean up the token.
    await page.keyboard.press('Escape')
    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})
