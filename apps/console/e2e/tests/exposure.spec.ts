import { test, expect } from '../fixtures/auth'

import { RUN_ID } from '../utils/constants'

const riskName = (slug: string) => `E2E Risk ${slug} ${RUN_ID} ${Date.now().toString(36)}`

// Each exposure subroute uses the same PageHeading pattern (heading
// rendered as <h2> by @repo/ui/page-heading). One smoke test per
// subroute confirms the route loads and the heading renders, which
// catches breakage in routing/data fetch without prescribing layout.
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

    // domain-discovery-import-page.tsx renders <PageHeading eyebrow="Discovery" heading="Domain Discovery Results" />
    await expect(page.getByRole('heading', { level: 2, name: /^Domain Discovery Results$/ })).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('exposure — risk create', () => {
  test('happy path — fill name, submit, lands on /exposure/risks/[id] with the name visible', async ({ page }) => {
    await page.goto('/exposure/risks/create')

    // PageHeading "Create a new risk" is the page header. The TitleField
    // <Input> is htmlFor-linked from FormLabel "Title", so getByLabel
    // resolves directly.
    const name = riskName('create')
    await page.getByLabel(/^Title$/).fill(name)

    // Submit button reads "Create risk" (becomes "Creating risk" while
    // pending). Other form sections may have their own buttons, so anchor
    // by exact text.
    await page.getByRole('button', { name: /^create risk$/i }).click()

    // onSubmit success → router.push(`/exposure/risks/${id}`).
    // Detail route is /exposure/risks/<id>; the regex must exclude
    // "create" so we don't false-match the form route on submit failure.
    await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    // Detail page renders the risk name as an h1 (TitleField → PageHeading
    // for risks uses h1 in the detail view).
    await expect(page.getByRole('heading', { level: 1, name })).toBeVisible({ timeout: 15_000 })
  })

  test('search by name filters risks server-side', async ({ page }) => {
    const a = riskName('search-a')
    const b = riskName('search-b')
    for (const name of [a, b]) {
      await page.goto('/exposure/risks/create')
      await page.getByLabel(/^Title$/).fill(name)
      await page.getByRole('button', { name: /^create risk$/i }).click()
      // Detail route is /exposure/risks/<id>; the regex must exclude
      // "create" so we don't false-match the form route on submit failure.
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
    // Detail route is /exposure/risks/<id>; the regex must exclude
    // "create" so we don't false-match the form route on submit failure.
    await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    await page.goto('/exposure/risks')
    await page.getByPlaceholder(/^Search$/).fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('required validation — submitting without a name shows the inline error', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await page.getByRole('button', { name: /^create risk$/i }).click()

    // Zod schema in risks/view/hooks/use-form-schema.ts:
    // name.min(1, 'Name is required'). The TitleField FormItem renders
    // the message under the input.
    await expect(page).toHaveURL(/\/exposure\/risks\/create(\?|$)/)
    await expect(page.getByText(/^Name is required$/)).toBeVisible()
  })
})
