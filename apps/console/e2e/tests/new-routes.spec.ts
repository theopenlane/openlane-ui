import { test, expect, readManifest } from '../fixtures/auth'

test.describe('auditor dashboard', () => {
  test('/auditor-dashboard renders either the program view or its empty state', async ({ page }) => {
    test.slow()
    await page.goto('/auditor-dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const crumbs = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    await expect(crumbs.getByText(/^Auditor Dashboard$/)).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('exposure — triage queue', () => {
  test('/exposure/triage renders the search rail and its facet chips', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/triage', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const crumbs = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    await expect(crumbs.getByText(/^Triage Queue$/)).toBeVisible({ timeout: 30_000 })

    await expect(page.getByPlaceholder('Search vulnerabilities…')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^All \d+$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Past due \d+$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Critical \d+$/ })).toBeVisible()
  })

  test('the Critical facet chip becomes the active filter when clicked', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/triage', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const critical = page.getByRole('button', { name: /^Critical \d+$/ })
    await expect(critical).toBeVisible({ timeout: 30_000 })
    await critical.click()

    await expect(critical).toHaveClass(/border-brand/, { timeout: 10_000 })
  })
})

test.describe('standards — template controls', () => {
  test('/standards/template-controls renders the baseline standard or its empty state', async ({ page }) => {
    test.slow()
    await page.goto('/standards/template-controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    const crumbs = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    const breadcrumb = crumbs.getByText(/^Template Controls$/)
    const empty = page.getByText('Template controls are not available yet')

    await expect(breadcrumb.or(empty).first()).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('programs — clone-a-program wizard', () => {
  test('/programs/create/from-existing opens on the Select a Program step', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/from-existing', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('heading', { name: /^Copy an existing program$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Select a program')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Continue$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Back$/ })).toBeVisible()
  })

  test('the wizard cannot be submitted before a source program is chosen', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/from-existing', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /^Copy an existing program$/ })).toBeVisible({ timeout: 30_000 })

    await expect(page.getByRole('button', { name: /^Create$/ })).toBeDisabled()
  })
})

test.describe('trust center — subscribers', () => {
  test.use({ authProfile: 'demo' })

  test('/trust-center/subscribers renders the allow-subscribers panel and search', async ({ page }) => {
    test.slow()
    test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')
    await page.goto('/trust-center/subscribers', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('heading', { name: /^Subscribers$/ })).toBeVisible({ timeout: 30_000 })

    await expect(page.getByText('Allow new subscribers')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('switch')).toBeVisible()
    await expect(page.getByPlaceholder('Search')).toBeVisible()
  })
})
