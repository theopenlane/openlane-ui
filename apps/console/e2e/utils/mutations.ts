import { expect, type Locator, type Page, type Response } from '@playwright/test'

import { inlineCsv } from './files'

const MUTATION_TIMEOUT = 60_000

export interface MutationResult {
  ok: boolean
  errors: string[]
}

const bodyOf = (response: Response): string => {
  const request = response.request()
  return request.postData() ?? request.postDataBuffer()?.toString('utf8') ?? ''
}

const isFileUpload = (response: Response): boolean => {
  const request = response.request()
  return request.method() === 'POST' && (request.headers()['content-type'] ?? '').startsWith('multipart/form-data')
}

const matchesOperation = (response: Response, operationName: string): boolean => {
  const body = bodyOf(response)
  if (body) return body.toLowerCase().includes(`"operationname":"${operationName.toLowerCase()}"`) || new RegExp(`\\b(mutation\\s+)?${operationName}\\b`, 'i').test(body)
  return isFileUpload(response)
}

export const waitForMutation = (page: Page, operationName: string, timeout = MUTATION_TIMEOUT): Promise<Response> =>
  page.waitForResponse((response) => matchesOperation(response, operationName), { timeout })

export const readMutation = async (response: Response): Promise<MutationResult> => {
  if (!response.ok()) return { ok: false, errors: [`HTTP ${response.status()}`] }
  const payload = (await response.json().catch(() => null)) as { errors?: Array<{ message: string }> } | null
  const errors = (payload?.errors ?? []).map((e) => e.message)
  return { ok: errors.length === 0, errors }
}

export const expectMutationOk = async (page: Page, operationName: string, act: () => Promise<void>, timeout = MUTATION_TIMEOUT): Promise<void> => {
  const pending = waitForMutation(page, operationName, timeout)
  await act()
  const result = await readMutation(await pending)
  expect(result.errors, `${operationName} returned GraphQL errors`).toEqual([])
  expect(result.ok, `${operationName} did not succeed`).toBe(true)
}

export const toast = (page: Page, text: string | RegExp): Locator => (typeof text === 'string' ? page.getByText(text, { exact: true }).first() : page.getByText(text).first())

export const openActionMenu = async (page: Page, item: string | RegExp): Promise<Locator> => {
  await page.getByRole('button', { name: 'Action' }).click()
  await page.getByRole('button', { name: item }).click({ timeout: 30_000 })
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 30_000 })
  return dialog
}

export interface UploadCsvArgs {
  page: Page
  dialog: Locator
  fileName: string
  rows: string
  operationName: string
  expectToast?: string | RegExp
}

export const uploadCsvAndAssert = async ({ page, dialog, fileName, rows, operationName, expectToast }: UploadCsvArgs): Promise<void> => {
  const upload = dialog.getByRole('button', { name: /^Upload$/ })
  await expect(upload).toBeDisabled()

  await dialog.locator('input[type="file"]').first().setInputFiles(inlineCsv(fileName, rows))
  await expect(upload).toBeEnabled({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await upload.click()
  })

  if (expectToast) await expect(toast(page, expectToast)).toBeVisible({ timeout: 30_000 })
}

export const selectFirstMatchingRow = async (page: Page, name: string): Promise<Locator> => {
  const search = page.getByPlaceholder(/Search/i).first()
  const row = page.getByRole('row').filter({ hasText: name }).first()

  await expect(async () => {
    if (await search.isVisible().catch(() => false)) {
      await search.fill('')
      await search.fill(name)
    }
    await expect(row).toBeVisible({ timeout: 10_000 })
  }).toPass({ timeout: 60_000 })

  await row.getByRole('checkbox').first().check()
  return row
}

export interface BulkEditArgs {
  page: Page
  field?: string
  operationName: string
  chooseValue?: (dialog: Locator) => Promise<string>
  expectToast?: string | RegExp
}

const chooseValueForField = async (page: Page, dialog: Locator): Promise<string | null> => {
  const valueSelect = dialog
    .getByRole('combobox')
    .filter({ hasText: /^Select/ })
    .last()

  if (await valueSelect.isVisible().catch(() => false)) {
    await valueSelect.click()
    const options = page.getByRole('option')
    if (
      !(await options
        .first()
        .isVisible({ timeout: 5_000 })
        .catch(() => false))
    ) {
      await page.keyboard.press('Escape')
      return null
    }
    const option = options.last()
    const label = (await option.innerText()).trim()
    await option.click()
    return label
  }

  const textbox = dialog.getByRole('textbox').last()
  if (!(await textbox.isVisible().catch(() => false))) return null
  const textValue = `e2e-bulk-${Date.now().toString(36)}`
  await textbox.fill(textValue)
  return textValue
}

export const bulkEditAndSave = async ({ page, field, operationName, chooseValue, expectToast }: BulkEditArgs): Promise<string> => {
  await page.getByRole('button', { name: /^Bulk Edit/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 30_000 })

  const fieldPicker = dialog.getByRole('combobox').first()
  let chosen: string | null = null

  if (chooseValue) {
    await fieldPicker.click()
    if (field) await page.getByRole('option', { name: field, exact: true }).click()
    else await page.getByRole('option').first().click()
    chosen = await chooseValue(dialog)
  } else if (field) {
    await fieldPicker.click()
    await page.getByRole('option', { name: field, exact: true }).click()
    chosen = await chooseValueForField(page, dialog)
  } else {
    await fieldPicker.click()
    const fieldOptions = page.getByRole('option')
    await expect(fieldOptions.first()).toBeVisible({ timeout: 30_000 })
    const labels = (await fieldOptions.allInnerTexts()).map((t) => t.trim()).filter(Boolean)
    await page.keyboard.press('Escape')

    for (const label of labels.slice(0, 12)) {
      await fieldPicker.click()
      await page.getByRole('option', { name: label, exact: true }).first().click()
      chosen = await chooseValueForField(page, dialog)
      if (chosen !== null) break
    }
  }

  expect(chosen, 'no bulk-edit field offered a settable value').not.toBeNull()

  const save = dialog.getByRole('button', { name: /^Save Changes$/ })
  await expect(save).toBeEnabled({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await save.click()
  })

  if (expectToast) await expect(toast(page, expectToast)).toBeVisible({ timeout: 30_000 })
  return chosen as string
}

export const fillDialogText = async (dialog: Locator, value: string): Promise<string> => {
  const input = dialog.getByRole('textbox').last()
  await input.fill(value)
  return value
}

export const confirmDestructive = async (page: Page, operationName: string, buttonName: RegExp = /^Delete$/): Promise<void> => {
  const confirmation = page.getByRole('alertdialog')
  await expect(confirmation).toBeVisible({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await confirmation.getByRole('button').filter({ hasText: buttonName }).first().dispatchEvent('click')
  })
}

export const submitAndAssertToast = async (page: Page, operationName: string, submit: Locator, expectToast: string | RegExp): Promise<void> => {
  await expect(submit).toBeEnabled({ timeout: 30_000 })
  await expectMutationOk(page, operationName, async () => {
    await submit.click()
  })
  await expect(toast(page, expectToast)).toBeVisible({ timeout: 30_000 })
}

export const scrollUntilVisible = async (page: Page, target: Locator, timeout = 60_000): Promise<void> => {
  await expect(async () => {
    if (await target.isVisible().catch(() => false)) return
    await page.mouse.wheel(0, 2000)
    await expect(target).toBeVisible({ timeout: 2_000 })
  }).toPass({ timeout })
}
