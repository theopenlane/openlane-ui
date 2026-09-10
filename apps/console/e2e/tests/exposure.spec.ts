import { test, expect } from '../fixtures/auth'

import { uniqueName } from '../utils/unique'

const riskName = (slug: string) => uniqueName(`E2E Risk ${slug}`)

const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
  { path: '/exposure/overview', heading: /^Exposure Overview$/ },
  { path: '/exposure/risks', heading: /^Risks$/ },
  { path: '/exposure/findings', heading: /^Findings$/ },
  { path: '/exposure/vulnerabilities', heading: /^Vulnerabilities$/ },
  { path: '/exposure/remediations', heading: /^Remediations$/ },
  { path: '/exposure/scans', heading: /^Scans$/ },
  { path: '/exposure/reviews', heading: /^Reviews$/ },
]

test.describe('exposure — list pages render', () => {
  for (const { path, heading } of SUBROUTES) {
    test(`${path} renders the heading for an owner`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }

  test('/exposure/scans/domain-scan renders the Domain Discovery Results heading', async ({ page }) => {
    await page.goto('/exposure/scans/domain-scan')

    await expect(page.getByRole('heading', { level: 2, name: /^Domain Discovery Results$/ })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('exposure — risk create', () => {
  test('happy path — fill name, submit, lands on /exposure/risks/[id] with the name visible', async ({ page }) => {
    await page.goto('/exposure/risks/create')

    const name = riskName('create')
    await page.getByLabel(/^Title$/).fill(name)

    await page.getByRole('button', { name: /^create risk$/i }).click()

    await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  })

  test('search by name filters risks server-side', async ({ page }) => {
    const a = riskName('search-a')
    const b = riskName('search-b')
    for (const name of [a, b]) {
      await page.goto('/exposure/risks/create')
      await page.getByLabel(/^Title$/).fill(name)
      await page.getByRole('button', { name: /^create risk$/i }).click()
      // Detail route is /exposure/risks/<id>; the regex must exclude "create" so we don't false-match the form route on submit failure
      await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })
    }

    await page.goto('/exposure/risks')

    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('newly created risk appears on /exposure/risks', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    const name = riskName('listed')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^create risk$/i }).click()
    // Detail route is /exposure/risks/<id>; the regex must exclude "create" so we don't false-match the form route on submit failure
    await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    await page.goto('/exposure/risks')
    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('required validation — submitting without a name shows the inline error', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await page.getByRole('button', { name: /^create risk$/i }).click()

    await expect(page).toHaveURL(/\/exposure\/risks\/create(\?|$)/)
    await expect(page.getByText(/^Name is required$/)).toBeVisible()
  })
})

test.describe('exposure — risk create properties', () => {
  test('Details and Impact property cards render with editable Status/Likelihood pickers', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('heading', { name: /^Details$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /^Impact$/ })).toBeVisible()

    await expect(page.getByText('Select status', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Select likelihood', { exact: true })).toBeVisible()
  })

  test('selecting a Status option updates the Status field display', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    await page.getByText('Select status', { exact: true }).click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await listbox.getByRole('option', { name: 'Mitigated' }).click()

    await expect(page.getByText('Select status', { exact: true })).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByText('Mitigated', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('selecting a Likelihood option updates the Likelihood field display', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    await page.getByText('Select likelihood', { exact: true }).click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await listbox.getByRole('option', { name: 'Unlikely' }).click()

    await expect(page.getByText('Select likelihood', { exact: true })).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByText('Unlikely', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the Authority card exposes Stakeholder and Delegate fields', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    await expect(page.getByRole('heading', { name: /^Authority$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Stakeholder', { exact: true })).toBeVisible()
    await expect(page.getByText('Delegate', { exact: true })).toBeVisible()
  })

  test('creating a risk with a chosen Status lands on the detail page', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    const name = riskName('with-status')
    await page.getByLabel(/^Title$/).fill(name)

    await page.getByText('Select status', { exact: true }).click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await listbox.getByRole('option', { name: 'Mitigated' }).click()

    await page.getByRole('button', { name: /^create risk$/i }).click()
    await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  })
})
