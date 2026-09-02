import type { Page } from '@playwright/test'

const armed = new WeakSet<Page>()

/**
 * Arm a handler that dismisses the shared DraftRestoreModal.
 *
 * draft-restore-modal.tsx renders "Resume unsaved <entity>?" once a create page
 * has read a stored draft, which happens after mount — so a one-shot check
 * straight after goto races it. The modal covers the form, so the save button
 * never becomes clickable and the spec reads as a create-page timeout.
 * addLocatorHandler runs whenever the modal actually blocks an action, which is
 * the only moment it matters. Arming is idempotent per page.
 */
export const dismissDraftRestore = async (page: Page): Promise<void> => {
  if (armed.has(page)) return
  armed.add(page)

  await page.addLocatorHandler(
    page.getByRole('heading', { name: /^Resume unsaved / }),
    async () => {
      await page
        .getByRole('button', { name: /^Discard$/ })
        .click()
        .catch(() => {})
    },
    { noWaitAfter: true },
  )
}
