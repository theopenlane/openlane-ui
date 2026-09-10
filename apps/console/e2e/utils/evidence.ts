import { expect, type Locator, type Page } from '@playwright/test'

export const openSubmitEvidenceSheet = async (page: Page): Promise<Locator> => {
  await page.getByRole('button', { name: /^submit evidence$/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  return dialog
}

const expectCreationToast = async (page: Page): Promise<void> => {
  await expect(page.getByText(/Evidence has been successfully created/i).first()).toBeVisible({ timeout: 30_000 })
}

/** requireLinkedControls gates "Submit for review" on a linked control; saving as draft skips that gate. */
export const saveEvidenceAsDraft = async (page: Page, dialog: Locator): Promise<void> => {
  await dialog.getByRole('button', { name: /^save as draft$/i }).click()
  await expectCreationToast(page)
}

export const submitEvidenceForReview = async (page: Page, dialog: Locator): Promise<void> => {
  await dialog.getByRole('button', { name: /^submit for review$/i }).click()
  await expectCreationToast(page)
}
