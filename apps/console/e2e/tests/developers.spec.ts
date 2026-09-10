import type { Page } from '@playwright/test'
import { test, expect } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'

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

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const tokenName = `E2E Token ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)

    // Tick "Never expires" so we don't have to fill the date input
    await dialog.getByLabel(/^Never expires$/).check()

    await dialog.getByRole('button', { name: /^create token$/i }).click()

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

    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    await expect(dialog.getByText(/^Token name is required$/)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeHidden()
  })
})

test.describe('developers — create personal access token', () => {
  test('happy path — name + org select + Never expires → Create Token → "Token created" success screen', async ({ page }) => {
    await page.goto('/developers/personal-access-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const tokenName = `E2E PAT ${Date.now().toString(36)}`
    await dialog.getByPlaceholder(/^Enter token name$/).fill(tokenName)

    await dialog.getByRole('button', { name: /^Select organization\(s\)$/ }).click()
    await page.getByRole('menuitemcheckbox').first().click()
    await page.keyboard.press('Escape')

    await dialog.getByLabel(/^Never expires$/).check()

    await dialog.getByRole('button', { name: /^create token$/i }).click()

    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeVisible({ timeout: 15_000 })
  })
})

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

    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })
  }

  test('created token appears in the list, then deletes via row action confirmation', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E API ${RUN_ID} ${Date.now().toString(36)}`
    await createApiToken(page, tokenName)

    const nameCell = page.getByRole('main').getByText(tokenName, { exact: true })
    await expect(nameCell).toBeVisible({ timeout: 15_000 })

    const row = page.getByRole('row').filter({ hasText: tokenName })
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: /^delete$/i }).click()

    const confirm = page.getByRole('alertdialog', { name: /delete api token/i })
    await expect(confirm).toBeVisible({ timeout: 10_000 })
    await expect(confirm.getByText(tokenName)).toBeVisible()
    await confirm.getByRole('button', { name: /^delete$/i }).click()

    await expect(page.getByText(/token deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
    await expect(nameCell).toBeHidden({ timeout: 15_000 })
  })
})

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

    const tokenInput = success.getByRole('textbox')
    await expect(tokenInput).toHaveValue(/.+/, { timeout: 10_000 })
    const tokenValue = await tokenInput.inputValue()
    expect(tokenValue.length).toBeGreaterThan(0)

    await tokenInput.click()
    await expect(page.getByText(/token copied!/i).first()).toBeVisible({ timeout: 10_000 })

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toBe(tokenValue)
  })
})

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

const deleteTokenRow = async (page: Page, tokenName: string, confirmTitle: RegExp): Promise<void> => {
  const row = page.getByRole('row').filter({ hasText: tokenName })
  await row.getByRole('button').last().click()
  await page.getByRole('menuitem', { name: /^delete$/i }).click()

  const confirm = page.getByRole('alertdialog', { name: confirmTitle })
  await expect(confirm).toBeVisible({ timeout: 10_000 })
  await confirm.getByRole('button', { name: /^delete$/i }).click()
  await expect(page.getByText(/token deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
}

test.describe('developers — API token table columns + no-expiration cell', () => {
  test('table renders Name/Description/Scopes/Expires/Last used headers and a row for a created never-expiring token', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E Cols ${RUN_ID} ${Date.now().toString(36)}`
    await createApiTokenInList(page, tokenName)

    const main = page.getByRole('main')
    await expect(main.getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    await expect(main.getByRole('columnheader', { name: /^Name\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Description\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Scopes\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Expires\b/ })).toBeVisible()
    await expect(main.getByRole('columnheader', { name: /^Last used\b/ })).toBeVisible()

    const row = main.getByRole('row').filter({ hasText: tokenName })
    await expect(row.getByText(/No Expiration/i)).toBeVisible()
    await expect(row.getByText(/Never used/i)).toBeVisible()

    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

test.describe('developers — API token scope selection', () => {
  test('selecting a write scope auto-includes read and updates the selected counter', async ({ page }) => {
    await page.goto('/developers/api-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder(/Filter permissions/i).fill('task')

    await dialog.getByRole('button', { name: /^Task/ }).first().click()

    const writeScope = dialog.getByLabel('task:write', { exact: true })
    await writeScope.check()

    await expect(writeScope).toBeChecked()
    await expect(dialog.getByLabel('task:read', { exact: true })).toBeChecked()

    await expect(dialog.getByText(/\(\d+ selected\)/)).toBeVisible()
  })
})

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

    const future = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const dateInput = dialog.locator('input[type="date"]')
    await expect(dateInput).toBeVisible({ timeout: 10_000 })
    await dateInput.fill(future)

    await dialog.getByRole('button', { name: /^create token$/i }).click()

    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })

    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })

    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

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
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    await expect(dialog.getByText(/Please specify an expiry date or select the Never expires/i)).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeHidden()
  })
})

test.describe('developers — API token filter panel', () => {
  test('Filter panel exposes Name and Expires At fields', async ({ page }) => {
    await page.goto('/developers/api-tokens')

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByText('Name', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Expires At', { exact: true }).first()).toBeVisible()
  })

  test('filtering by name narrows the list to a created token', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const tokenName = `E2E Filter ${RUN_ID} ${Date.now().toString(36)}`
    await createApiTokenInList(page, tokenName)
    await expect(page.getByRole('main').getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await page
      .getByRole('button', { name: /^Name$/ })
      .first()
      .click()
    await page.getByPlaceholder(/^Enter Name$/).fill(tokenName)
    await page.getByRole('button', { name: /^View Results$/ }).click()

    await expect(page.getByRole('main').getByRole('row').filter({ hasText: tokenName })).toBeVisible({ timeout: 15_000 })

    await deleteTokenRow(page, tokenName, /delete api token/i)
    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await page.getByRole('button', { name: /^Reset filters$/ }).click()
    await page.keyboard.press('Escape')
  })
})

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

    await expect(dialog.getByPlaceholder(/^Enter token name$/)).toBeDisabled()

    await dialog.getByPlaceholder(/Enter a description/i).fill(`updated ${Date.now().toString(36)}`)
    await dialog.getByRole('button', { name: /^Save Changes$/ }).click()

    await expect(page.getByText(/token updated successfully/i).first()).toBeVisible({ timeout: 15_000 })

    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

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

test.describe('developers — personal access token validation', () => {
  test('submitting with no organization selected is blocked — form stays on the Create step', async ({ page }) => {
    await page.goto('/developers/personal-access-tokens')

    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByPlaceholder(/^Enter token name$/).fill(`E2E PAT NoOrg ${Date.now().toString(36)}`)
    await dialog.getByLabel(/^Never expires$/).check()
    await dialog.getByRole('button', { name: /^create token$/i }).click()

    await expect(page.getByRole('dialog', { name: /^token created$/i })).toBeHidden()
    await expect(dialog.getByRole('button', { name: /^create token$/i })).toBeVisible()
    await expect(dialog.getByText(/Authorized organization/i)).toBeVisible()
  })
})

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

    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
  })
})

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

    await dialog.getByLabel(/^Select all scopes$/).check()

    await dialog.getByRole('button', { name: /^create token$/i }).click()
    const success = page.getByRole('dialog', { name: /^token created$/i })
    await expect(success).toBeVisible({ timeout: 15_000 })
    await success.getByLabel(/I have copied the access token/i).check()
    await success.getByRole('button', { name: /^close$/i }).click()
    await expect(success).toBeHidden({ timeout: 10_000 })

    const row = page.getByRole('main').getByRole('row').filter({ hasText: tokenName })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByRole('button', { name: /\+\d+ more/ }).click()
    await expect(page.getByRole('dialog', { name: /^Scopes \(\d+\)$/ })).toBeVisible({ timeout: 10_000 })

    await page.keyboard.press('Escape')
    await deleteTokenRow(page, tokenName, /delete api token/i)
  })
})

const presetButton = (page: Page, label: 'Read only' | 'Read & write' | 'Full access') => page.getByRole('button').filter({ hasText: new RegExp(`^${label}$`) })

test.describe('developers — scope presets (#2077)', () => {
  test('the create-token dialog offers all three scope presets', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    const dialog = page.getByRole('dialog', { name: /create new token/i })
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    await expect(presetButton(page, 'Read only')).toBeVisible({ timeout: 15_000 })
    await expect(presetButton(page, 'Read & write')).toBeVisible()
    await expect(presetButton(page, 'Full access')).toBeVisible()
  })

  test('choosing the Read only preset selects scopes without creating a token', async ({ page }) => {
    test.slow()
    await page.goto('/developers/api-tokens')
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .click()

    await expect(page.getByRole('dialog', { name: /create new token/i })).toBeVisible({ timeout: 15_000 })
    const readOnly = presetButton(page, 'Read only')
    await expect(readOnly).toBeVisible({ timeout: 15_000 })
    await readOnly.click()

    await expect(readOnly).toHaveClass(/(^|\s)is-active(\s|$)/, { timeout: 15_000 })
  })
})
