import type { Page } from '@playwright/test'

const armed = new WeakSet<Page>()

/** Arm a handler that dismisses the shared DraftRestoreModal. */
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
