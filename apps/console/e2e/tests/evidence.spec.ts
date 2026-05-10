import { expect, test } from '@playwright/test'

import { RUN_ID } from '../utils/constants'
import { seedLoggedInUser } from '../utils/seedUser'

const evidenceName = (slug: string) => `E2E Evidence ${slug} ${RUN_ID} ${Date.now().toString(36)}`

test.describe('evidence — list page', () => {
  test('/evidence renders the Evidence Center heading and Submit Evidence CTA for an owner', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-list')

    await page.goto('/evidence')

    // Owners (which is what seedLoggedInUser creates — they own the org
    // they just registered) have CanCreateEvidence, so the Submit
    // Evidence button is visible.
    await expect(page.getByRole('heading', { name: /^Evidence Center$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^submit evidence$/i })).toBeVisible()
  })

  test('empty state — fresh org has zero evidence rows on /evidence', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-empty')

    await page.goto('/evidence')

    await expect(page.getByRole('heading', { name: /^Evidence Center$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: /^E2E Evidence/ })).toHaveCount(0, { timeout: 5_000 })
  })

  test('clicking Submit Evidence opens the create sheet', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-sheet')

    await page.goto('/evidence')

    await page.getByRole('button', { name: /^submit evidence$/i }).click()

    // Sheet opens with a form. The exact title varies, but the file
    // upload field's label is stable. Look for any of the standard
    // create-evidence sheet markers.
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
  })

  test('required validation — submitting the create sheet without a name shows the inline error', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-required')

    await page.goto('/evidence')
    await page.getByRole('button', { name: /^submit evidence$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    // Schema in evidence/hooks/use-form-schema.ts:
    // name.min(2, 'Name must be at least 2 characters'). The FormItem
    // surfaces the message under the input.
    await expect(dialog.getByText(/^Name must be at least 2 characters$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — fill name only, submit for review, lands on /evidence?id=<id>', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-create')

    await page.goto('/evidence')
    await page.getByRole('button', { name: /^submit evidence$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Name (zod min 2 chars) is the only required field — creationDate
    // defaults to today via CalendarPopover, renewalDate defaults to
    // +365d, no file is required. The Input is wired through
    // react-hook-form's `{...field}` spread, so the DOM `name` attr is
    // "name" and the FormLabel ("Evidence name") is not htmlFor-linked.
    const name = evidenceName('create')
    await dialog.locator('input[name="name"]').fill(name)

    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    // Default success path (no defaultSelectedObject) calls
    // router.push(`/evidence?id=<id>`) — see evidence-create-sheet.tsx.
    await page.waitForURL(/\/evidence\?id=/, { timeout: 30_000 })
  })

  test('search by name filters server-side — second evidence disappears when first name is typed', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-search')

    const a = evidenceName('search-a')
    const b = evidenceName('search-b')
    for (const name of [a, b]) {
      await page.goto('/evidence')
      await page.getByRole('button', { name: /^submit evidence$/i }).click()
      const dialog = page.getByRole('dialog')
      await expect(dialog).toBeVisible({ timeout: 10_000 })
      await dialog.locator('input[name="name"]').fill(name)
      await dialog.getByRole('button', { name: /^submit for review$/i }).click()
      await page.waitForURL(/\/evidence\?id=/, { timeout: 30_000 })
    }

    await page.goto('/evidence')

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b }).first()).toBeVisible({ timeout: 15_000 })

    // Toolbar search input has placeholder "Search". Routes to backend
    // OR filter on nameContainsFold/descriptionContainsFold via the
    // useDebounce(300ms) → where clause.
    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible()
  })

  test('newly created evidence appears in the list on /evidence', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-listed')

    await page.goto('/evidence')
    await page.getByRole('button', { name: /^submit evidence$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const name = evidenceName('listed')
    await dialog.locator('input[name="name"]').fill(name)
    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    await page.waitForURL(/\/evidence\?id=/, { timeout: 30_000 })

    // Drop the ?id query so the detail sheet doesn't cover the list,
    // then confirm the just-created name shows up. The Name column
    // renders the evidence name inside an EvidenceFileChip <p>.
    await page.goto('/evidence')
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })
})
