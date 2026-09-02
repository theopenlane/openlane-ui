import { expect, type Locator, type Page } from '@playwright/test'

/**
 * Open a row's action menu and activate one of its items.
 *
 * Radix portals the menu content and the table re-renders whenever a background
 * refetch lands, so the trigger click can be swallowed and the item can detach
 * mid-click. Retry the whole open-then-activate cycle rather than either half.
 */
export const openRowAction = async (page: Page, trigger: Locator, item: Locator, attempts = 4): Promise<void> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (!(await item.isVisible().catch(() => false))) {
      await trigger.click().catch(() => {})
    }

    try {
      await item.click({ timeout: 5_000 })
      return
    } catch {
      continue
    }
  }

  await expect(item).toBeVisible({ timeout: 15_000 })
  await item.click()
}

/**
 * Click a target that resolves but never settles. Radix menus, cmdk lists and
 * tables re-render on every background refetch, so Playwright's actionability
 * wait can time out on an element that is perfectly clickable. Fall back to a
 * dispatched click rather than widening the timeout.
 */
export const clickResilient = async (target: Locator, timeout = 10_000): Promise<void> => {
  try {
    await target.click({ timeout })
  } catch {
    await target.dispatchEvent('click')
  }
}

/**
 * Confirm a destructive action. The confirmation button is matched on its
 * visible text so it cannot resolve to an icon-only button that merely carries
 * the same aria-label, and dispatched rather than clicked because the dialog
 * re-renders while the underlying list refetches.
 */
export const confirmDestructiveDialog = async (page: Page, label: RegExp = /^Delete$/): Promise<void> => {
  const dialog = page.getByRole('alertdialog')
  await expect(dialog).toBeVisible({ timeout: 20_000 })

  const confirm = dialog.getByRole('button').filter({ hasText: label }).first()
  try {
    await confirm.click({ timeout: 10_000 })
  } catch {
    await confirm.dispatchEvent('click')
  }

  await expect(dialog).toBeHidden({ timeout: 30_000 })
}
