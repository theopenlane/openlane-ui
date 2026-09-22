import { test, expect } from '../fixtures/auth'

test.describe('automation — integrations marketplace (owner)', () => {
  test('the marketplace renders both tabs and every browse status filter', async ({ page }) => {
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('tab', { name: /^Browse Integrations$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('tab', { name: /^Installed \(\d+\)$/ })).toBeVisible()

    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Not Installed \(\d+\)$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Coming Soon \(\d+\)$/ })).toBeVisible()
  })

  test('switching to the Installed tab puts the tab in the URL and swaps the filter row', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    const installedTab = page.getByRole('tab', { name: /^Installed \(\d+\)$/ })
    await expect(installedTab).toBeVisible({ timeout: 15_000 })
    await installedTab.click()

    await expect(page).toHaveURL(/[?&]tab=installed(&|$)/, { timeout: 10_000 })
    await expect(installedTab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('button', { name: /^Coming Soon \(\d+\)$/ })).toHaveCount(0)

    await page.getByRole('tab', { name: /^Browse Integrations$/ }).click()
    await expect(page).not.toHaveURL(/[?&]tab=installed(&|$)/, { timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^Coming Soon \(\d+\)$/ })).toBeVisible({ timeout: 10_000 })
  })

  test('selecting the Coming Soon status filter marks it active', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    const comingSoon = page.getByRole('button', { name: /^Coming Soon \(\d+\)$/ })
    await expect(comingSoon).toBeVisible({ timeout: 15_000 })
    await comingSoon.click()

    await expect(comingSoon).toHaveClass(/(^|\s)is-active(\s|$)/, { timeout: 10_000 })
    await expect(page.getByPlaceholder('Search integrations...')).toBeVisible()
  })

  test('a search with no match shows the empty-state message', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder('Search integrations...').fill('zzz-nonexistent-provider-zzz')
    await expect(page.getByText('No integrations match your filters')).toBeVisible({ timeout: 10_000 })
  })

  test('navigating an integration card opens its definition detail page (read-only)', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    const viewButton = page.getByRole('button', { name: /^(View|Manage)$/ }).first()
    await expect(viewButton).toBeVisible({ timeout: 15_000 })
    await viewButton.click()

    await expect(page).toHaveURL(/\/automation\/integrations\/[^/]+$/, { timeout: 15_000 })

    await expect(page.getByRole('button', { name: /^Integrations$/ })).toBeVisible({ timeout: 15_000 })
  })

  test('the detail page back button returns to the marketplace', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    await page
      .getByRole('button', { name: /^(View|Manage)$/ })
      .first()
      .click()
    await expect(page).toHaveURL(/\/automation\/integrations\/[^/]+$/, { timeout: 15_000 })

    await page.getByRole('button', { name: /^Integrations$/ }).click()
    await expect(page).toHaveURL(/\/automation\/integrations(\?|$)/, { timeout: 15_000 })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('automation — integrations tag filter expansion (ISS-2483)', () => {
  test('selecting a tag hides the per-section "See all" truncation toggle', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    const tagsRow = page.getByText('Tags:', { exact: true })
    test.skip(!(await tagsRow.isVisible().catch(() => false)), 'no integration tags available in this deployment')

    const firstTag = tagsRow.locator('xpath=following-sibling::button[1]')
    await expect(firstTag).toBeVisible({ timeout: 10_000 })
    await firstTag.click()

    await expect(page.getByRole('button', { name: /^See all$/ })).toHaveCount(0, { timeout: 15_000 })
    await expect(firstTag).toHaveClass(/(^|\s)is-active(\s|$)/)

    await page.getByRole('button', { name: /^Clear$/ }).click()
    await expect(firstTag).not.toHaveClass(/(^|\s)is-active(\s|$)/, { timeout: 10_000 })
  })
})
