import { test, expect, readManifest } from '../fixtures/auth'
import { uniqueName } from '../utils/unique'
import { SAMPLE_PDF, SAMPLE_PNG, uploadFiles } from '../utils/files'
import { expectMutationOk } from '../utils/mutations'
import { createStandard, deleteStandard, createSubprocessor, createSubscriber, createTrustCenterSubprocessor, getDemoApi, getTrustCenterId, readTrustCenterSecurityContact } from '../utils/api'
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
    await expect(sheet.getByRole('heading', { name: 'Create Subprocessor' })).toBeVisible({ timeout: 30_000 })

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

test.describe('trust-center — customer logos (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  const addCustomer = async (page: Page, name: string) => {
    await page.getByPlaceholder('Enter company name...').fill(name)
    await uploadFiles(page, SAMPLE_PNG, page.locator('input[type="file"]').first())
    await page.getByRole('button', { name: 'Add Customer' }).click()
    await expect(toast(page, 'Customer added')).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: `Delete ${name}` })).toBeVisible({ timeout: 30_000 })
  }

  const removeCustomer = async (page: Page, name: string) => {
    await page.getByRole('button', { name: `Delete ${name}` }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Delete Customer')).toBeVisible({ timeout: 15_000 })
    await dialog.getByRole('button', { name: /^Delete$/ }).click()
    await expect(toast(page, 'Customer removed')).toBeVisible({ timeout: 30_000 })
  }

  test('a customer logo can be added and removed again', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/customer-logos')

    const name = uniqueName('E2E Customer')
    await addCustomer(page, name)
    await removeCustomer(page, name)

    await expect(page.getByRole('button', { name: `Delete ${name}` })).toBeHidden({ timeout: 30_000 })
  })

  test('adding a customer without a name surfaces the required-field error', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/customer-logos')

    await expect(page.getByPlaceholder('Enter company name...')).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Add Customer' }).click()

    await expect(page.getByText('Customer name is required')).toBeVisible({ timeout: 15_000 })
    await expect(toast(page, 'Customer added')).toBeHidden()
  })

  test('the customer link can be edited after the logo is added', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/customer-logos')

    const name = uniqueName('E2E Customer Link')
    await addCustomer(page, name)

    await page.getByRole('button', { name: `Edit URL for ${name}` }).click()
    await expect(page.getByText(`Edit ${name}`, { exact: true })).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder('https://example.com').last().fill('https://e2e.example.com')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(toast(page, 'Customer updated')).toBeVisible({ timeout: 30_000 })

    await removeCustomer(page, name)
  })
})

test.describe('trust-center — branding (seeded demo org)', () => {
  test.use({ authProfile: 'demo' })

  test('the Published branding tab renders the settings read-only', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/branding')

    const securityContact = page.getByPlaceholder('security@company.com')
    await expect(securityContact).toBeVisible({ timeout: 30_000 })

    await page.getByRole('tab', { name: 'Published' }).click()

    await expect(securityContact).toBeHidden({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: 'Published' })).toHaveAttribute('aria-selected', 'true')
  })

  test('switching back to Preview restores the editable branding fields', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/branding')

    await page.getByRole('tab', { name: 'Published' }).click()
    await expect(page.getByPlaceholder('security@company.com')).toBeHidden({ timeout: 15_000 })

    await page.getByRole('tab', { name: 'Preview' }).click()
    await expect(page.getByPlaceholder('security@company.com')).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('trust-center — subprocessors submit', () => {
  test.use({ authProfile: 'demo' })

  const openCreateMenu = async (page: Page) => {
    await page.getByRole('button', { name: /^Create$/ }).click()
    await expect(page.getByRole('menuitem', { name: 'Custom subprocessor' })).toBeVisible({ timeout: 15_000 })
  }

  test('a custom subprocessor is created from the sheet', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const name = uniqueName('E2E Subprocessor Create')
    await openTrustCenterPage(page, '/trust-center/subprocessors')

    await openCreateMenu(page)
    await page.getByRole('menuitem', { name: 'Custom subprocessor' }).click()

    const sheet = page.getByRole('dialog')
    await expect(sheet.getByRole('heading', { name: 'Create Subprocessor' })).toBeVisible({ timeout: 30_000 })

    await sheet.getByPlaceholder('Subprocessor name').fill(name)
    await sheet.getByText('Enter URL', { exact: true }).click()
    await sheet.getByPlaceholder('https://example.com/logo.png').fill('https://example.com/logo.png')

    const create = sheet.getByRole('button', { name: /^Create$/ })
    await expect(create).toBeEnabled({ timeout: 15_000 })

    await expectMutationOk(page, 'CreateSubprocessor', async () => {
      await create.click()
    })

    await expect(toast(page, 'Subprocessor Created')).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('trust-center — document bulk actions and watermark', () => {
  test.use({ authProfile: 'demo' })

  const CATEGORY = 'E2E Category'

  const createDocumentViaUi = async (page: Page, title: string) => {
    await page.getByRole('button', { name: 'New Document' }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet.getByPlaceholder('Document title')).toBeVisible({ timeout: 30_000 })

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

    await uploadFiles(page, SAMPLE_PDF, sheet.locator('input[type="file"]').first())
    await sheet.getByRole('button', { name: /^Create$/ }).click()
    await expect(toast(page, 'Document Uploaded')).toBeVisible({ timeout: 60_000 })
  }

  test('bulk editing selected documents saves the change', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const title = uniqueName('E2E Doc BulkEdit')
    await openTrustCenterPage(page, '/trust-center/documents')
    await createDocumentViaUi(page, title)

    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(title)
    const row = page.getByRole('row').filter({ hasText: title }).first()
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Edit/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText('Bulk Edit Documents')).toBeVisible({ timeout: 30_000 })

    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option').first().click()
    await dialog
      .getByRole('combobox')
      .filter({ hasText: /^Select/ })
      .last()
      .click()
    await page.getByRole('option').first().click()

    await expectMutationOk(page, 'BulkUpdateTrustCenterDoc', async () => {
      await dialog.getByRole('button', { name: /^Save/ }).click()
    })

    await expect(toast(page, 'Successfully updated selected documents.')).toBeVisible({ timeout: 30_000 })
  })

  test('bulk deleting selected documents removes them', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const title = uniqueName('E2E Doc BulkDelete')
    await openTrustCenterPage(page, '/trust-center/documents')
    await createDocumentViaUi(page, title)

    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(title)
    const row = page.getByRole('row').filter({ hasText: title }).first()
    await expect(row).toBeVisible({ timeout: 30_000 })
    await row.getByRole('checkbox').first().check()

    await page.getByRole('button', { name: /^Bulk Delete/ }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'BulkDeleteTrustCenterDoc', async () => {
      await confirm.getByRole('button', { name: /^Delete$/ }).click()
    })

    await expect(page.getByRole('row').filter({ hasText: title })).toHaveCount(0, { timeout: 60_000 })
  })

  test('the watermark sheet saves its configuration', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/documents')

    await page.getByRole('button', { name: /^Watermark$/ }).click()
    await expect(page.getByText('Watermark Document')).toBeVisible({ timeout: 30_000 })

    await page.getByPlaceholder('Enter watermark text…').fill(`E2E ${Date.now().toString(36)}`)

    await expectMutationOk(page, 'UpdateTrustCenterWatermarkConfig', async () => {
      await page.getByRole('button', { name: /^(Save|Apply watermark)$/ }).click()
    })

    await expect(toast(page, 'Watermark updated')).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('trust-center — NDA template', () => {
  test.use({ authProfile: 'demo' })

  test('an NDA is uploaded and then replaced', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/NDAs')

    const upload = page.getByRole('button', { name: /^Upload$/ })
    const replace = page.getByRole('button', { name: /^Replace$/ })

    if (await upload.isVisible().catch(() => false)) {
      await upload.click()
      const dialog = page.getByRole('dialog')
      await expect(dialog.getByText('Upload NDA Document')).toBeVisible({ timeout: 30_000 })
      await uploadFiles(page, SAMPLE_PDF, dialog.locator('input[type="file"]').first())

      await expectMutationOk(page, 'CreateTrustCenterNDA', async () => {
        await dialog.getByRole('button', { name: /^Save NDA$/ }).click()
      })
      await expect(toast(page, 'NDA Uploaded')).toBeVisible({ timeout: 60_000 })
    }

    await expect(replace).toBeVisible({ timeout: 30_000 })
    await replace.click()
    const replaceDialog = page.getByRole('dialog')
    await expect(replaceDialog.getByText('Replace NDA Document')).toBeVisible({ timeout: 30_000 })
    await uploadFiles(page, SAMPLE_PDF, replaceDialog.locator('input[type="file"]').first())

    await expectMutationOk(page, 'UpdateTrustCenterNDA', async () => {
      await replaceDialog.getByRole('button', { name: /^Update NDA$/ }).click()
    })
    await expect(toast(page, 'NDA Updated')).toBeVisible({ timeout: 60_000 })
  })
})

test.describe('trust-center — branding publish', () => {
  test.use({ authProfile: 'demo' })

  test('publishing branding persists the security contact on the live setting', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/branding')

    const securityContact = page.getByPlaceholder('security@company.com')
    await expect(securityContact).toBeVisible({ timeout: 30_000 })

    const email = `security-${Date.now().toString(36)}@example.com`
    await securityContact.fill(email)

    await page
      .getByRole('button', { name: /^Publish$/ })
      .first()
      .click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'UpdateTrustCenterSetting', async () => {
      await dialog.getByRole('button', { name: /^Publish$/ }).click()
    })

    await expect.poll(async () => readTrustCenterSecurityContact(await getDemoApi()), { timeout: 60_000 }).toBe(email)
  })
})

test.describe('trust-center — subscribers', () => {
  test.use({ authProfile: 'demo' })

  test('unsubscribing a trust-center subscriber updates their status', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const demoApi = await getDemoApi()
    const email = `e2e-sub-${Date.now().toString(36)}@example.com`
    await createSubscriber(demoApi, email, await getTrustCenterId(demoApi))

    await openTrustCenterPage(page, '/trust-center/subscribers')
    await page
      .getByPlaceholder(/Search/i)
      .first()
      .fill(email)

    const row = page.getByRole('row').filter({ hasText: email }).first()
    await expect(row).toBeVisible({ timeout: 60_000 })

    await row.getByRole('button').last().click()
    await expectMutationOk(page, 'UpdateSubscriber', async () => {
      await page.getByRole('menuitem', { name: 'Unsubscribe' }).click()
    })

    await expect(toast(page, 'Subscriber unsubscribed')).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('trust-center — subprocessor edit and delete', () => {
  test.use({ authProfile: 'demo' })

  const seedAttached = async (label: string): Promise<{ name: string; tcSubprocessorId: string }> => {
    const demoApi = await getDemoApi()
    const name = uniqueName(label)
    const subprocessorID = await createSubprocessor(demoApi, name)
    const tcSubprocessorId = await createTrustCenterSubprocessor(demoApi, await getTrustCenterId(demoApi), subprocessorID, 'Hosting', ['US'])
    return { name, tcSubprocessorId }
  }

  test('editing a trust center subprocessor persists the description', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const { tcSubprocessorId } = await seedAttached('E2E SubEdit')

    await openTrustCenterPage(page, `/trust-center/subprocessors?id=${tcSubprocessorId}`)

    const sheet = page.getByRole('dialog')
    const save = sheet.getByRole('button', { name: /^Save Changes$/ })
    await expect(save).toBeVisible({ timeout: 30_000 })
    await expect(sheet.getByText('Hosting').first()).toBeVisible({ timeout: 30_000 })

    const description = `edited by e2e ${Date.now().toString(36)}`
    const descriptionBox = sheet.getByRole('textbox').last()
    if (await descriptionBox.isVisible().catch(() => false)) await descriptionBox.fill(description)

    await expectMutationOk(page, 'UpdateTrustCenterSubprocessor', async () => {
      await save.click()
    })
    await expect(toast(page, 'Subprocessor Updated')).toBeVisible({ timeout: 30_000 })
  })

  test('deleting a trust center subprocessor removes it from the table', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const { name } = await seedAttached('E2E SubDelete')

    await openTrustCenterPage(page, '/trust-center/subprocessors')

    const search = page.getByPlaceholder('Search subprocessors...')
    const row = page.getByRole('row').filter({ hasText: name }).first()
    const rowActions = row.getByRole('button', { name: 'Row actions' })

    await expect(async () => {
      await search.fill('')
      await search.fill(name)
      await expect(rowActions).toBeVisible({ timeout: 10_000 })
    }).toPass({ timeout: 60_000 })

    await rowActions.click()
    await page.getByRole('menuitem', { name: /Delete/ }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'DeleteTrustCenterSubprocessor', async () => {
      await confirm.getByRole('button', { name: /^Delete$/ }).click()
    })
    await expect(page.getByRole('row').filter({ hasText: name })).toHaveCount(0, { timeout: 60_000 })
  })
})

test.describe('trust-center — custom domain lifecycle', () => {
  test.use({ authProfile: 'demo' })

  test('a vanity domain is set and deleted', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    await openTrustCenterPage(page, '/trust-center/domain')

    const setButton = page.getByRole('button', { name: /^Set$/ })
    const existing = page.getByRole('button', { name: 'Delete custom domain' })
    await expect(setButton.or(existing).first()).toBeVisible({ timeout: 60_000 })

    if (await existing.isVisible().catch(() => false)) {
      await expectMutationOk(page, 'DeleteCustomDomain', async () => {
        await existing.click()
      })
      await page.reload({ waitUntil: 'domcontentloaded' })
    }

    const domain = `trust-${Date.now().toString(36)}.e2e-openlane.dev`
    const input = page.getByPlaceholder('trust.yourcompany.com')
    await expect(input).toBeEnabled({ timeout: 30_000 })
    await input.fill(domain)

    await expectMutationOk(page, 'CreateCustomDomain', async () => {
      await page.getByRole('button', { name: /^Set$/ }).click()
    })
    await expect(toast(page, 'Custom domain set!')).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'DeleteCustomDomain', async () => {
      await page.getByRole('button', { name: 'Delete custom domain' }).click()
    })
    await expect(toast(page, 'Deleted!')).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('trust-center — frameworks', () => {
  test.use({ authProfile: 'demo' })

  const sortsFirst = (label: string) => `0-${uniqueName(label)}`

  test('toggling a framework on and publishing associates it, toggling off removes it', async ({ page }) => {
    test.slow()
    requireDemoOrg()
    const frameworkName = sortsFirst('E2E ToggleFw')
    const demoApi = await getDemoApi()
    const standardId = await createStandard(demoApi, frameworkName, 'E2E Framework')

    try {
      await openTrustCenterPage(page, '/trust-center/frameworks')

      const card = page
        .locator('div')
        .filter({ has: page.getByText(frameworkName, { exact: true }) })
        .filter({ has: page.getByRole('switch') })
        .last()
      const toggle = card.getByRole('switch').first()
      await expect(toggle).toBeVisible({ timeout: 60_000 })
      await expect(toggle).toBeEnabled({ timeout: 60_000 })

      const publish = page.getByRole('button', { name: /^Publish$/ })
      await expect(publish).toBeDisabled()

      await toggle.click()
      await expect(publish).toBeEnabled({ timeout: 30_000 })
      await expectMutationOk(page, 'CreateBulkTrustCenterCompliance', async () => {
        await publish.click()
      })
      await expect(toast(page, 'Published')).toBeVisible({ timeout: 30_000 })
      await expect(publish).toBeDisabled({ timeout: 30_000 })

      await toggle.click()
      await expect(publish).toBeEnabled({ timeout: 30_000 })
      await expectMutationOk(page, 'DeleteBulkTrustCenterCompliance', async () => {
        await publish.click()
      })
      await expect(toast(page, 'Published')).toBeVisible({ timeout: 30_000 })
    } finally {
      await deleteStandard(demoApi, standardId)
    }
  })
})
