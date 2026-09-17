import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'

const toast = (page: Page, title: string) => page.getByText(title, { exact: true })

const gotoFirstStandard = async (page: Page) => {
  await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 30_000 })
  const href = await page.locator('a[href^="standards/"]').first().getAttribute('href')
  expect(href, 'the catalog rendered no standard to open').toBeTruthy()
  await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('button', { name: /^Add Controls/ })).toBeVisible({ timeout: 60_000 })
}

const selectFirstControl = async (page: Page) => {
  const rowCheckbox = page.getByRole('checkbox').nth(1)
  await expect(rowCheckbox).toBeVisible({ timeout: 30_000 })
  await rowCheckbox.click()
}

test.describe('standards — adopting controls into the organization', () => {
  test('the Add Controls button counts the controls picked in the accordion', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)

    await expect(page.getByRole('button', { name: 'Add Controls', exact: true })).toBeVisible({ timeout: 30_000 })
    await selectFirstControl(page)

    await expect(page.getByRole('button', { name: /^Add Controls \(\d+\)$/ })).toBeVisible({ timeout: 30_000 })
  })

  test('the add dialog offers a program to file the controls under', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)
    await selectFirstControl(page)

    await page.getByRole('button', { name: /^Add Controls/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(/^Selected controls \(\d+\)$/)).toBeVisible({ timeout: 30_000 })
    await expect(dialog.getByText('No program (add later)', { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(dialog.getByRole('button', { name: /^Add$/ })).toBeEnabled()
  })

  test('cancelling the add dialog adopts nothing', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)
    await selectFirstControl(page)

    await page.getByRole('button', { name: /^Add Controls/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: /^Add$/ })).toBeVisible({ timeout: 30_000 })

    await dialog.getByRole('button', { name: /^Cancel$/ }).click()

    await expect(dialog).toBeHidden({ timeout: 15_000 })
    await expect(toast(page, 'Controls added to organization successfully!')).toBeHidden()
  })

  test('adopting a control from a standard reports success', async ({ page }) => {
    test.slow()
    await gotoFirstStandard(page)
    await selectFirstControl(page)

    await page.getByRole('button', { name: /^Add Controls/ }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: /^Add$/ })).toBeVisible({ timeout: 30_000 })
    await dialog.getByRole('button', { name: /^Add$/ }).click()

    await expect(toast(page, 'Controls added to organization successfully!')).toBeVisible({ timeout: 60_000 })
    await expect(dialog).toBeHidden({ timeout: 30_000 })
  })
})
