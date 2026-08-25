import { test, expect, readManifest } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'
import type { Locator, Page } from '@playwright/test'

const requireDemoOrg = () => test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')

const openTrustCenterPage = async (page: Page, route: string) => {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })
}

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const cardFor = (page: Page, text: string, actionName: string): Locator =>
  page
    .locator('div')
    .filter({ has: page.getByText(text, { exact: true }) })
    .filter({ has: page.getByRole('button', { name: actionName }) })
    .last()

const editorPanel = (page: Page): Locator =>
  page
    .locator('div')
    .filter({ has: page.getByRole('button', { name: 'Save Changes' }) })
    .filter({ has: page.getByRole('textbox') })
    .last()

const publishUpdate = async (page: Page, title: string, body: string) => {
  await page.getByPlaceholder('Add a title').fill(title)
  await page.getByPlaceholder('Write an update...').fill(body)
  await page.getByRole('button', { name: 'Publish Update' }).click()
  await expect(toast(page, 'Update published')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(title, { exact: true })).toBeVisible({ timeout: 30_000 })
}

const deleteUpdate = async (page: Page, title: string) => {
  await cardFor(page, title, 'Delete update').getByRole('button', { name: 'Delete update' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByText('Delete Update')).toBeVisible({ timeout: 15_000 })
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(toast(page, 'Update deleted')).toBeVisible({ timeout: 30_000 })
}

const publishFaq = async (page: Page, question: string, answer: string) => {
  await page.getByPlaceholder('Enter a frequently asked question').fill(question)
  await page.getByPlaceholder('Provide the answer...').fill(answer)
  await page.getByRole('button', { name: 'Publish FAQ' }).click()
  await expect(toast(page, 'FAQ published')).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(question, { exact: true })).toBeVisible({ timeout: 30_000 })
}

const deleteFaq = async (page: Page, question: string) => {
  await cardFor(page, question, 'Delete FAQ').getByRole('button', { name: 'Delete FAQ' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByText('Delete FAQ')).toBeVisible({ timeout: 15_000 })
  await dialog.getByRole('button', { name: 'Delete' }).click()
  await expect(toast(page, 'FAQ deleted')).toBeVisible({ timeout: 30_000 })
}

test.describe('trust-center — updates content (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  test('publishing an update adds it to the feed and clears the form', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/updates')

    const title = uniqueName('E2E Update')
    await publishUpdate(page, title, 'Rotated our TLS certificates ahead of expiry.')

    await expect(page.getByPlaceholder('Add a title')).toHaveValue('')
    await expect(page.getByPlaceholder('Write an update...')).toHaveValue('')

    await deleteUpdate(page, title)
  })

  test('publishing without a description surfaces the required-field error', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/updates')

    const title = uniqueName('E2E Update Rejected')
    await page.getByPlaceholder('Add a title').fill(title)
    await page.getByRole('button', { name: 'Publish Update' }).click()

    await expect(page.getByText('Update text is required')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByPlaceholder('Add a title')).toHaveValue(title)
    await expect(page.getByText(title, { exact: true })).toBeHidden()
  })

  test('publishing without a title surfaces the required-field error', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/updates')

    await page.getByPlaceholder('Write an update...').fill('A body with no title.')
    await page.getByRole('button', { name: 'Publish Update' }).click()

    await expect(page.getByText('Title is required')).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, 'Update published')).toBeHidden()
  })

  test('the character counter tracks the description length', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/updates')

    await expect(page.getByText('280 characters remaining')).toBeVisible({ timeout: 30_000 })

    await page.getByPlaceholder('Write an update...').fill('12345')
    await expect(page.getByText('275 characters remaining')).toBeVisible({ timeout: 15_000 })
  })

  test('editing a published update persists the new title', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/updates')

    const title = uniqueName('E2E Update Edit')
    await publishUpdate(page, title, 'Original body text.')

    await cardFor(page, title, 'Edit update').getByRole('button', { name: 'Edit update' }).click()

    const editor = editorPanel(page)
    await expect(editor).toBeVisible({ timeout: 15_000 })

    const edited = `${title} revised`
    await editor.getByRole('textbox').first().fill(edited)
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(toast(page, 'Update saved')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(edited, { exact: true })).toBeVisible({ timeout: 30_000 })

    await deleteUpdate(page, edited)
  })

  test('deleting an update asks for confirmation and removes it from the feed', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/updates')

    const title = uniqueName('E2E Update Delete')
    await publishUpdate(page, title, 'This update exists only to be deleted.')

    await deleteUpdate(page, title)

    await expect(page.getByText(title, { exact: true })).toBeHidden({ timeout: 30_000 })
  })
})

test.describe('trust-center — FAQ content (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  test('publishing a FAQ adds it to the list and clears the form', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/faqs')

    const question = uniqueName('Does E2E encrypt data at rest?')
    await publishFaq(page, question, 'Yes, with AES-256 across every storage tier.')

    await expect(page.getByPlaceholder('Enter a frequently asked question')).toHaveValue('')

    await deleteFaq(page, question)
  })

  test('a reference link that is not a URL blocks publishing', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/faqs')

    await page.getByPlaceholder('Enter a frequently asked question').fill(uniqueName('Invalid link FAQ'))
    await page.getByPlaceholder('Provide the answer...').fill('An answer.')
    await page.getByPlaceholder('https://...').fill('not-a-url')
    await page.getByRole('button', { name: 'Publish FAQ' }).click()

    await expect(page.getByText('Must be a valid URL')).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, 'FAQ published')).toBeHidden()
  })

  test('editing a FAQ persists the new question', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/faqs')

    const question = uniqueName('Where is E2E data stored?')
    await publishFaq(page, question, 'In EU regions only.')

    await cardFor(page, question, 'Edit FAQ').getByRole('button', { name: 'Edit FAQ' }).click()

    const editor = editorPanel(page)
    await expect(editor).toBeVisible({ timeout: 15_000 })

    const edited = `${question} (updated)`
    await editor.getByRole('textbox').first().fill(edited)
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(toast(page, 'FAQ updated')).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(edited, { exact: true })).toBeVisible({ timeout: 30_000 })

    await deleteFaq(page, edited)
  })

  test('deleting a FAQ asks for confirmation and removes it from the list', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/faqs')

    const question = uniqueName('Temporary E2E FAQ?')
    await publishFaq(page, question, 'This FAQ exists only to be deleted.')

    await deleteFaq(page, question)

    await expect(page.getByText(question, { exact: true })).toBeHidden({ timeout: 30_000 })
  })
})
