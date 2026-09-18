import { expect, type Locator, type Page } from '@playwright/test'

export const openCreateTaskDialog = async (page: Page): Promise<Locator> => {
  const trigger = page
    .getByRole('main')
    .getByRole('button', { name: /^create$/i })
    .first()
  await expect(trigger).toBeVisible({ timeout: 30_000 })
  await trigger.click()

  await page.getByRole('menuitem', { name: /^From Scratch$/i }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10_000 })
  return dialog
}
