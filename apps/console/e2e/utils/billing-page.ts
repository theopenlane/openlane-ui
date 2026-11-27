import { expect, type Locator, type Page } from '@playwright/test'

import type { CatalogProduct } from './billing-catalog'

export const BILLING_PATH = '/organization-settings/billing'

export const openBilling = async (page: Page): Promise<void> => {
  await page.goto(BILLING_PATH, { waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('heading', { name: 'Summary', exact: true })).toBeVisible({ timeout: 60_000 }) // 1min
}

export const confirmDialog = async (page: Page, title: string, action = 'Confirm'): Promise<void> => {
  const dialog = page.getByRole('alertdialog', { name: title })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: action, exact: true }).click()
}

export const productAction = (page: Page, { display_name }: CatalogProduct, action: 'Subscribe' | 'Unsubscribe' | 'Renew'): Locator =>
  page
    .getByRole('paragraph')
    .and(page.getByText(display_name, { exact: true }))
    .locator('xpath=ancestor::div[.//button[normalize-space()]][1]')
    .getByRole('button', { name: action, exact: true })

export const intervalButton = (page: Page, name: string): Locator => page.getByRole('group', { name: 'Billing interval' }).getByRole('button', { name })
