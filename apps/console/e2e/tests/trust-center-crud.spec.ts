import { test, expect, readManifest } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'
import { SAMPLE_PDF, uploadFiles } from '../utils/files'
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

test.describe('trust-center — documents (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  const openCreateSheet = async (page: Page) => {
    await page.getByRole('button', { name: 'New Document' }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByPlaceholder('Document title')).toBeVisible({ timeout: 30_000 })
    return sheet
  }

  const CATEGORY = 'E2E Category'

  const fillDocumentForm = async (page: Page, sheet: Locator, title: string) => {
    await sheet.getByPlaceholder('Document title').fill(title)

    await sheet.getByRole('combobox').first().click()
    await page.getByPlaceholder('Search category...').fill(CATEGORY)
    await page
      .getByRole('option', { name: CATEGORY })
      .or(page.getByText(`Create "${CATEGORY}"`))
      .first()
      .click()

    await sheet
      .getByRole('combobox')
      .filter({ hasText: /^(Not visible|Publicly visible|Protected)$/ })
      .first()
      .click()
    await page.getByRole('option', { name: /publicly visible/i }).click()
  }

  test('the New Document sheet keeps Create disabled until a file is attached', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/documents')

    const sheet = await openCreateSheet(page)
    await fillDocumentForm(page, sheet, uniqueName('E2E Doc Gating'))

    const create = sheet.getByRole('button', { name: /^Create$/ })
    await expect(create).toBeDisabled()

    await uploadFiles(page, SAMPLE_PDF, sheet.locator('input[type="file"]').first())
    await expect(create).toBeEnabled({ timeout: 30_000 })
  })

  test('a document can be uploaded, found by search, opened and deleted', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/documents')

    const title = uniqueName('E2E Doc')
    const sheet = await openCreateSheet(page)
    await fillDocumentForm(page, sheet, title)
    await uploadFiles(page, SAMPLE_PDF, sheet.locator('input[type="file"]').first())

    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(toast(page, 'Document Uploaded')).toBeVisible({ timeout: 60_000 })

    await page.getByPlaceholder('Search documents...').fill(title)
    const row = page.getByRole('row', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
    await expect(row).toBeVisible({ timeout: 30_000 })

    await row.click()
    const detail = page.getByRole('dialog')
    await expect(detail.getByRole('button', { name: 'Delete document' })).toBeVisible({ timeout: 30_000 })

    await detail.getByRole('button', { name: 'Delete document' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Delete Document')).toBeVisible({ timeout: 15_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()

    await expect(row).toBeHidden({ timeout: 30_000 })
  })

  test('the Columns menu lists toggleable document columns', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/documents')

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 15_000 })
  })

  test('the filter menu exposes the document filter fields', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/documents')

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()

    const menu = page.getByRole('menu', { name: 'Filter' })
    for (const field of ['Category', 'Visibility', 'Standard Name']) {
      await expect(menu.getByRole('button', { name: field })).toBeVisible({ timeout: 15_000 })
    }
  })
})

test.describe('trust-center — subprocessors (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  const openCreateMenu = async (page: Page) => {
    await page.getByRole('button', { name: /^Create$/ }).click()
    await expect(page.getByRole('menuitem', { name: 'Custom subprocessor' })).toBeVisible({ timeout: 15_000 })
  }

  test('the Create menu offers both adding an existing subprocessor and a custom one', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/subprocessors')

    await openCreateMenu(page)
    await expect(page.getByRole('menuitem', { name: 'Add subprocessor' })).toBeVisible()
  })

  test('the custom subprocessor sheet keeps Create disabled until a logo is supplied', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/subprocessors')

    await openCreateMenu(page)
    await page.getByRole('menuitem', { name: 'Custom subprocessor' }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByText('Create Subprocessor', { exact: true })).toBeVisible({ timeout: 30_000 })

    await sheet.getByPlaceholder('Subprocessor name').fill(uniqueName('E2E Subprocessor'))

    const create = sheet.getByRole('button', { name: /^Create$/ })
    await expect(create).toBeDisabled()

    await sheet.getByText('Enter URL', { exact: true }).click()
    await sheet.getByPlaceholder('https://example.com/logo.png').fill('https://example.com/logo.png')
    await expect(create).toBeEnabled({ timeout: 15_000 })
  })

  test('a logo URL that is not a URL is rejected', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/subprocessors')

    await openCreateMenu(page)
    await page.getByRole('menuitem', { name: 'Custom subprocessor' }).click()

    const sheet = page.getByRole('dialog')
    await sheet.getByPlaceholder('Subprocessor name').fill(uniqueName('E2E Subprocessor Invalid'))
    await sheet.getByText('Enter URL', { exact: true }).click()
    await sheet.getByPlaceholder('https://example.com/logo.png').fill('not-a-url')
    await sheet.getByRole('button', { name: /^Create$/ }).click()

    await expect(page.getByText('Please enter a valid URL')).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, 'Subprocessor Created')).toBeHidden()
  })

  test('the Add to Trust Center dialog opens from the Create menu', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/subprocessors')

    await openCreateMenu(page)
    await page.getByRole('menuitem', { name: 'Add subprocessor' }).click()

    await expect(page.getByRole('heading', { name: 'Add to Trust Center' })).toBeVisible({ timeout: 30_000 })
  })

  test('the subprocessors toolbar exposes search, columns and filters', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/subprocessors')

    await expect(page.getByPlaceholder('Search subprocessors...')).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: /^Columns$/ }).click()
    await expect(page.getByRole('checkbox').first()).toBeVisible({ timeout: 15_000 })
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: /^Filter( \d+)?$/ }).click()
    await expect(page.getByRole('menu', { name: 'Filter' }).getByRole('button', { name: 'Reset filters' })).toBeVisible({ timeout: 15_000 })
  })
})
