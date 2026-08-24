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

/**
 * EVIDENCE_CREATE_MODE.requireLinkedControls is true, so "Submit for review" is
 * gated on linking a control. Draft creation skips that gate and still runs the
 * same success path — toast + openObjectSheet — so it's the cheapest way for a
 * spec to get a real evidence record on screen.
 *
 * ISS-2593 also moved creation off the router: evidence-create-sheet.tsx opens
 * the detail slideout through SheetNavigationProvider React state, so the URL
 * never gains `?id=`.
 */
export const saveEvidenceAsDraft = async (page: Page, dialog: Locator): Promise<void> => {
  await dialog.getByRole('button', { name: /^save as draft$/i }).click()
  await expectCreationToast(page)
}

export const submitEvidenceForReview = async (page: Page, dialog: Locator): Promise<void> => {
  await dialog.getByRole('button', { name: /^submit for review$/i }).click()
  await expectCreationToast(page)
}
