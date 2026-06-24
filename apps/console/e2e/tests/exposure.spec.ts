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

// /exposure/risks/create · select risk properties (status/type/category/score/
// likelihood) + set authority. In create mode PropertiesCard renders each
// RiskLabel field directly as an editable control (isEditing=true): Status,
// Type, Category are Radix Selects/comboboxes (under a "Details" card) and
// Score, Likelihood live under an "Impact" card. AuthorityCard renders the
// Stakeholder/Delegate ResponsibilityFields. The selects render
// data-independently, so this exercises the property pickers without seeding.
test.describe('exposure — risk create properties', () => {
  test('Details and Impact property cards render with editable Status/Likelihood pickers', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    // properties-card.tsx (isCreate) renders two cards titled "Details" and
    // "Impact" with the RiskLabel rows.
    await expect(page.getByRole('heading', { name: /^Details$/ })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: /^Impact$/ })).toBeVisible()

    // The Status RiskLabel renders a Radix Select trigger with placeholder
    // "Select status"; the Likelihood one shows "Select likelihood".
    await expect(page.getByText('Select status', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Select likelihood', { exact: true })).toBeVisible()
  })

  test('selecting a Status option updates the Status field display', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    // The Status select trigger starts on the placeholder; open it and pick
    // "Mitigated" (a RiskRiskStatus enum value rendered via getEnumLabel).
    await page.getByText('Select status', { exact: true }).click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    await listbox.getByRole('option', { name: 'Mitigated' }).click()

    // After selection the trigger shows the chosen label and the placeholder
    // is gone.
    await expect(page.getByText('Select status', { exact: true })).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByText('Mitigated', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('selecting a Likelihood option updates the Likelihood field display', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    await page.getByText('Select likelihood', { exact: true }).click()
    const listbox = page.getByRole('listbox')
    await expect(listbox).toBeVisible({ timeout: 10_000 })
    // RiskRiskLikelihood options: Unlikely / Likely / Highly likely.
    await listbox.getByRole('option', { name: 'Unlikely' }).click()

    await expect(page.getByText('Select likelihood', { exact: true })).toHaveCount(0, { timeout: 10_000 })
    await expect(page.getByText('Unlikely', { exact: true }).first()).toBeVisible({ timeout: 10_000 })
  })

  test('the Authority card exposes Stakeholder and Delegate fields', async ({ page }) => {
    await page.goto('/exposure/risks/create')
    await expect(page.getByRole('heading', { level: 2, name: /Create a new risk/i })).toBeVisible({ timeout: 20_000 })

    // authority-card.tsx renders a card titled "Authority" with Stakeholder +
    // Delegate ResponsibilityFields. Setting a value needs a seeded group
    // (groupOnly), so this asserts the section renders; the value-set path is
    // deferred pending a group seeder.
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
