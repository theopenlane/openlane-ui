import { expect, type Locator, type Page } from '@playwright/test'

const MORE_ACTIONS = 'More actions'

const header = (scope: Locator): Locator => scope.locator('[data-slot="sheet-header"]').first()

export const slideoutEdit = (scope: Locator): Locator => header(scope).getByRole('button', { name: 'Edit', exact: true })

export const slideoutClose = (scope: Locator): Locator => header(scope).getByRole('button', { name: 'Close', exact: true })

export const slideoutMore = (scope: Locator): Locator => header(scope).getByRole('button', { name: MORE_ACTIONS }).first()

export const slideoutReady = async (scope: Locator, timeout = 60_000): Promise<void> => {
  await expect(slideoutEdit(scope).or(slideoutMore(scope)).first()).toBeVisible({ timeout })
}

const menuItem = (page: Page, label: string | RegExp): Locator => page.getByRole('menuitem').filter({ hasText: label }).first()

export const slideoutMenuAction = async (page: Page, scope: Locator, label: string | RegExp): Promise<void> => {
  const more = slideoutMore(scope)
  const direct = header(scope).getByRole('button', { name: label }).first()
  await expect(more.or(direct).first()).toBeVisible({ timeout: 30_000 })

  if (await more.isVisible().catch(() => false)) {
    await more.click()
    const item = menuItem(page, label)
    await expect(item).toBeVisible({ timeout: 30_000 })
    await item.click()
    return
  }

  await direct.click()
}

export const expectSlideoutMenuAction = async (page: Page, scope: Locator, label: string | RegExp): Promise<void> => {
  const more = slideoutMore(scope)
  const direct = header(scope).getByRole('button', { name: label }).first()
  await expect(more.or(direct).first()).toBeVisible({ timeout: 30_000 })

  if (await more.isVisible().catch(() => false)) {
    await more.click()
    await expect(menuItem(page, label)).toBeVisible({ timeout: 30_000 })
    await page.keyboard.press('Escape')
    return
  }

  await expect(direct).toBeVisible({ timeout: 30_000 })
}
