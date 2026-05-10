import { expect, test } from '@playwright/test'

import { RUN_ID } from '../utils/constants'
import { seedLoggedInUser } from '../utils/seedUser'

const riskName = (slug: string) => `E2E Risk ${slug} ${RUN_ID} ${Date.now().toString(36)}`

// Each exposure subroute uses the same PageHeading pattern (heading
// rendered as <h2> by @repo/ui/page-heading). One smoke test per
// subroute confirms the route loads and the heading renders, which
// catches breakage in routing/data fetch without prescribing layout.
const SUBROUTES: Array<{ path: string; heading: RegExp }> = [
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
      await seedLoggedInUser(page, `expo-${path.split('/').pop()}`)

      await page.goto(path)

      await expect(page.getByRole('heading', { level: 2, name: heading })).toBeVisible()
    })
  }
})

test.describe('exposure — risk create', () => {
  test('happy path — fill name, submit, lands on /exposure/risks/[id] with the name visible', async ({ page }) => {
    await seedLoggedInUser(page, 'risk-create')

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
    await seedLoggedInUser(page, 'risk-search')

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

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })

    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible()
  })

  test('newly created risk appears on /exposure/risks', async ({ page }) => {
    await seedLoggedInUser(page, 'risk-listed')

    await page.goto('/exposure/risks/create')
    const name = riskName('listed')
    await page.getByLabel(/^Title$/).fill(name)
    await page.getByRole('button', { name: /^create risk$/i }).click()
    // Detail route is /exposure/risks/<id>; the regex must exclude
    // "create" so we don't false-match the form route on submit failure.
    await page.waitForURL(/\/exposure\/risks\/(?!create)[^/]+(\?|$)/, { timeout: 30_000 })

    await page.goto('/exposure/risks')
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })

  test('required validation — submitting without a name shows the inline error', async ({ page }) => {
    await seedLoggedInUser(page, 'risk-required')

    await page.goto('/exposure/risks/create')
    await page.getByRole('button', { name: /^create risk$/i }).click()

    // Zod schema in risks/view/hooks/use-form-schema.ts:
    // name.min(1, 'Name is required'). The TitleField FormItem renders
    // the message under the input.
    await expect(page).toHaveURL(/\/exposure\/risks\/create(\?|$)/)
    await expect(page.getByText(/^Name is required$/)).toBeVisible()
  })
})
