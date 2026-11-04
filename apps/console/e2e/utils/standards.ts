import { expect, type Page } from '@playwright/test'

const NAVIGATION_TIMEOUT_MS = 180_000 // 3min
const CATALOG_TIMEOUT_MS = 60_000 // 1min

export const openFirstOpenlaneStandard = async (page: Page): Promise<void> => {
  await page.goto('/standards?source=supported', { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
  const details = page.getByRole('link', { name: 'Details', exact: true }).first()
  await expect(details).toBeVisible({ timeout: CATALOG_TIMEOUT_MS })
  const href = await details.getAttribute('href')
  expect(href, 'the catalog rendered no Openlane standard to open').toBeTruthy()
  await page.goto(`${href}`, { waitUntil: 'domcontentloaded', timeout: NAVIGATION_TIMEOUT_MS })
}
