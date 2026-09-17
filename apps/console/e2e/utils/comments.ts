import { expect, type Locator, type Page } from '@playwright/test'

import { expectMutationOk } from './mutations'

export const commentEditor = async (scope: Page | Locator): Promise<Locator> => {
  const named = scope.getByRole('textbox', { name: 'Add a comment' }).last()
  if (await named.isVisible().catch(() => false)) return named
  return scope.locator('[contenteditable="true"]').last()
}

export const postComment = async (page: Page, scope: Page | Locator, operationName: string, text: string): Promise<void> => {
  const editor = await commentEditor(scope)
  await expect(editor).toBeVisible({ timeout: 30_000 })
  const send = scope.getByRole('button', { name: /^Send$/ }).last()

  await expect(async () => {
    await editor.click()
    await editor.fill(text)
    await expect(send).toBeEnabled({ timeout: 5_000 })
  }).toPass({ timeout: 45_000 })

  await expectMutationOk(page, operationName, async () => {
    await send.click()
  })

  await expect(page.getByText(text).first()).toBeVisible({ timeout: 30_000 })
}

export const editFirstComment = async (page: Page, operationName: string, text: string): Promise<void> => {
  await page.getByRole('button', { name: 'Edit comment' }).first().click()

  const editor = page.locator('[contenteditable="true"]').first()
  await expect(editor).toBeVisible({ timeout: 30_000 })
  await editor.click()
  await editor.fill(text)

  await expectMutationOk(page, operationName, async () => {
    await page.getByRole('button', { name: 'Save comment' }).first().click()
  })

  await expect(page.getByText(text).first()).toBeVisible({ timeout: 30_000 })
}

export const deleteFirstComment = async (page: Page, operationName: string, text: string): Promise<void> => {
  await page.getByRole('button', { name: 'Delete comment' }).first().click()

  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByText('Delete Comment')).toBeVisible({ timeout: 30_000 })

  await expectMutationOk(page, operationName, async () => {
    await dialog
      .getByRole('button')
      .filter({ hasText: /^Delete$/ })
      .first()
      .dispatchEvent('click')
  })

  await expect(page.getByText(text)).toHaveCount(0, { timeout: 30_000 })
}
