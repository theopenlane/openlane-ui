import { expect, type Page } from '@playwright/test'

/**
 * Dismiss the shared DraftRestoreModal if a create form restores a draft.
 *
 * draft-restore-modal.tsx renders "Resume unsaved <entity>?" whenever a create
 * page finds a stored draft. It covers the form, so the save button never
 * becomes clickable. A spec that creates several records in a row can trip it
 * on the second navigation, which reads as a create-page timeout.
 */
export const dismissDraftRestore = async (page: Page): Promise<void> => {
  const discard = page.getByRole('button', { name: /^Discard$/ })
  if (!(await discard.isVisible({ timeout: 2_000 }).catch(() => false))) return

  await discard.click().catch(() => {})
  await expect(discard)
    .toBeHidden({ timeout: 10_000 })
    .catch(() => {})
}
