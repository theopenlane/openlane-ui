import { test, expect, readManifest } from '../fixtures/auth'

/**
 * Coverage for routes added to the console after this branch was cut. Each is a
 * render/tooling check as the storage-state Owner — no mutations, so they are
 * safe to run against the shared seeded org.
 *
 *   /auditor-dashboard              — program-scoped auditor view
 *   /exposure/triage                — vulnerability triage queue
 *   /standards/template-controls    — OL-Baseline template controls
 *   /programs/create/from-existing  — clone-a-program wizard
 *   /trust-center/subscribers       — trust center subscriber list
 */

test.describe('auditor dashboard', () => {
  test('/auditor-dashboard renders either the program view or its empty state', async ({ page }) => {
    test.slow()
    await page.goto('/auditor-dashboard', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // auditor-dashboard-page.tsx renders an <h1>Auditor Dashboard</h1> when no
    // program is selectable, and AuditorDashboardHeader (titled with the
    // program name) once one is. The breadcrumb is present either way.
    const crumbs = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    await expect(crumbs.getByText(/^Auditor Dashboard$/)).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('exposure — triage queue', () => {
  test('/exposure/triage renders the search rail and its facet chips', async ({ page }) => {
    test.slow()
    await page.goto('/exposure/triage', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // triage-page.tsx has no PageHeading — it sets a "Triage Queue" breadcrumb
    // and renders TriageListRail with a search box plus All / Past due /
    // Critical count chips.
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

    // triage-list-rail.tsx marks the active facet with the brand border class.
    await expect(critical).toHaveClass(/border-brand/, { timeout: 10_000 })
  })
})

test.describe('standards — template controls', () => {
  test('/standards/template-controls renders the baseline standard or its empty state', async ({ page }) => {
    test.slow()
    await page.goto('/standards/template-controls', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    // The page resolves the OL-Baseline system standard. When it is present the
    // StandardDetailsView takes over the breadcrumbs; when it is not, an
    // EmptyTabState explains why. Accept either — both are valid renders.
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

    // select-source-program-step.tsx renders the step heading and a program
    // picker; the footer exposes Back / Create / Continue.
    await expect(page.getByRole('heading', { name: /^Copy an existing program$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Select a program')).toBeVisible()
    await expect(page.getByRole('button', { name: /^Continue$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Back$/ })).toBeVisible()
  })

  test('the wizard cannot be submitted before a source program is chosen', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/from-existing', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /^Copy an existing program$/ })).toBeVisible({ timeout: 30_000 })

    // from-existing-wizard.tsx disables the shortcut "Create" button until
    // sourceProgramID is set. No mutation is attempted.
    await expect(page.getByRole('button', { name: /^Create$/ })).toBeDisabled()
  })
})

test.describe('trust center — subscribers', () => {
  // The e2e org has no trust center; the harmonize-seeded demo org does.
  test.use({ authProfile: 'demo' })

  test('/trust-center/subscribers renders the allow-subscribers panel and search', async ({ page }) => {
    test.slow()
    test.skip(!readManifest().hasDemoSession, 'no demo-org session — trust center is unprovisioned in the e2e org')
    await page.goto('/trust-center/subscribers', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByRole('heading', { name: /^Subscribers$/ })).toBeVisible({ timeout: 30_000 })

    // subscribers-page.tsx: an "Allow new subscribers" Switch above the table
    // toolbar. Read-only — the switch is never toggled.
    await expect(page.getByText('Allow new subscribers')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('switch')).toBeVisible()
    await expect(page.getByPlaceholder('Search')).toBeVisible()
  })
})
