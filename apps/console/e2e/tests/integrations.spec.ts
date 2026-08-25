import { test, expect } from '../fixtures/auth'

/**
 * Integrations marketplace, moved from /organization-settings/integrations to
 * /automation/integrations. The status filter is no longer Radix tabs — it is a
 * row of `variant="tag"` buttons labelled "<Status> (N)", now including a
 * "Not Installed" bucket, plus an optional Tags filter row.
 *
 * Selectors grounded in integrations-page.tsx + integrations-toolbar.tsx +
 * integrations-grid.tsx + available-integration-card.tsx +
 * integration-definition-page.tsx. All flows are read-only.
 */
test.describe('automation — integrations marketplace (owner)', () => {
  test('the marketplace renders every status filter button', async ({ page }) => {
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('button', { name: /^Installed \(\d+\)$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Not Installed \(\d+\)$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Coming Soon \(\d+\)$/ })).toBeVisible()
  })

  test('selecting the Coming Soon status filter marks it active', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    const comingSoon = page.getByRole('button', { name: /^Coming Soon \(\d+\)$/ })
    await expect(comingSoon).toBeVisible({ timeout: 15_000 })
    await comingSoon.click()

    // integrations-toolbar.tsx marks the selected status with an `is-active` class.
    await expect(comingSoon).toHaveClass(/(^|\s)is-active(\s|$)/, { timeout: 10_000 })
    await expect(page.getByPlaceholder('Search integrations...')).toBeVisible()
  })

  test('a search with no match shows the empty-state message', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })

    // Wait for the providers to render so the grid is populated before filtering.
    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    // integrations-grid.tsx filters client-side; a nonsense query yields the
    // "No integrations match your search." empty state. No mutation.
    await page.getByPlaceholder('Search integrations...').fill('zzz-nonexistent-provider-zzz')
    await expect(page.getByText('No integrations match your search.')).toBeVisible({ timeout: 10_000 })
  })

  test('navigating an integration card opens its definition detail page (read-only)', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    // available-integration-card.tsx renders a footer "View" / "Manage" button per
    // active provider that router.push-es to /automation/integrations/[id].
    // "Coming Soon" providers render a disabled button of that label instead.
    const viewButton = page.getByRole('button', { name: /^(View|Manage)$/ }).first()
    await expect(viewButton).toBeVisible({ timeout: 15_000 })
    await viewButton.click()

    await expect(page).toHaveURL(/\/automation\/integrations\/[^/]+$/, { timeout: 15_000 })

    // integration-definition-page.tsx renders an "Integrations" back button.
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

/**
 * ISS-2483 — two integration marketplace refinements:
 *
 *  - the definition page swaps a bare spinner for IntegrationDefinitionSkeleton
 *    and now also waits on the permissions query before rendering
 *  - selecting a Tag filter force-expands every category section
 *    (forceExpanded={selectedTags.length > 0}) and hides the per-section
 *    "See all" toggle, so a filtered result is never truncated to the first
 *    three cards
 */
test.describe('automation — integrations tag filter expansion (ISS-2483)', () => {
  test('selecting a tag hides the per-section "See all" truncation toggle', async ({ page }) => {
    test.slow()
    await page.goto('/automation/integrations', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Integrations$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^All \(\d+\)$/ })).toBeVisible({ timeout: 15_000 })

    // integrations-toolbar.tsx renders a "Tags:" row only when the providers
    // carry tags; skip cleanly when this deployment has none.
    const tagsRow = page.getByText('Tags:', { exact: true })
    test.skip(!(await tagsRow.isVisible().catch(() => false)), 'no integration tags available in this deployment')

    const firstTag = tagsRow.locator('xpath=following-sibling::button[1]')
    await expect(firstTag).toBeVisible({ timeout: 10_000 })
    await firstTag.click()

    // With a tag active every section is force-expanded, so no section may still
    // offer "See all".
    await expect(page.getByRole('button', { name: /^See all$/ })).toHaveCount(0, { timeout: 15_000 })
    await expect(firstTag).toHaveClass(/(^|\s)is-active(\s|$)/)

    // Clearing restores the collapsed behaviour.
    await page.getByRole('button', { name: /^Clear$/ }).click()
    await expect(firstTag).not.toHaveClass(/(^|\s)is-active(\s|$)/, { timeout: 10_000 })
  })
})
