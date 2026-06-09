import { test, expect } from '../fixtures/auth'

// Logged in as the storage-state Owner (global-setup).
test.describe('standards — list', () => {
  test('/standards renders the Standards Catalog heading for an owner', async ({ page }) => {
    await page.goto('/standards')

    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible()
  })

  test('/standards renders the search input', async ({ page }) => {
    await page.goto('/standards')

    await expect(page.getByPlaceholder(/^Search standards\.\.\.$/)).toBeVisible({ timeout: 15_000 })
  })

  test('the catalog grid renders standard cards (Controls count shown)', async ({ page }) => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Standards Catalog$/ })).toBeVisible({ timeout: 20_000 })

    // standards-page.tsx renders a Card per standard; each shows a "Controls: N"
    // line (the backend seeds a standards catalog, so ≥1 card is present).
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('searching a no-match term clears the catalog grid (server-side shortName filter)', async ({ page }) => {
    await page.goto('/standards', { waitUntil: 'domcontentloaded' })
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search standards\.\.\.$/).fill(`zzz-no-standard-${Date.now().toString(36)}`)

    // shortNameContainsFold where-clause → no matches → no cards render.
    await expect(page.getByText(/Controls:\s*\d+/)).toHaveCount(0, { timeout: 15_000 })
  })

  test('a standard detail → Add Controls opens the add-to-organization dialog', async ({ page }) => {
    test.slow()
    await page.goto('/standards', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByText(/Controls:\s*\d+/).first()).toBeVisible({ timeout: 15_000 })

    // standards-page.tsx cards link to standards/{id}; navigate to the first detail.
    const href = await page.locator('a[href^="standards/"]').first().getAttribute('href')
    await page.goto(`/${href}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // standards/[id]/page.tsx renders an owner-gated "Add Controls" button that
    // opens the AddToOrganizationDialog (DialogTitle "Add Controls").
    await page.getByRole('button', { name: /^Add Controls/ }).click()
    await expect(page.getByRole('dialog').getByText('Add Controls').first()).toBeVisible({ timeout: 10_000 })
  })
})
