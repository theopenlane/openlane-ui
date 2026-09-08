import { expect, type Locator, type Page } from '@playwright/test'

/** Open a row's action menu and activate an item. Radix portals the content and the table re-renders on refetch, so this retries. */
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

/** Click a target that resolves but never settles. */
export const clickResilient = async (target: Locator, timeout = 10_000): Promise<void> => {
  try {
    await target.click({ timeout })
  } catch {
    await target.dispatchEvent('click')
  }
}

/** Confirm a destructive action. */
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
