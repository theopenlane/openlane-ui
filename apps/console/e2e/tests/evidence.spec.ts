import { test, expect } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { openSubmitEvidenceSheet, saveEvidenceAsDraft } from '../utils/evidence'
import { uniqueName } from '../utils/unique'

const evidenceName = (slug: string) => uniqueName(`E2E Evidence ${slug}`)

test.describe('evidence — list page', () => {
  test('/evidence renders the Evidence Center heading and Submit Evidence CTA for an owner', async ({ page }) => {
    await page.goto('/evidence')

    await expect(page.getByRole('heading', { name: /^Evidence Center$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^submit evidence$/i })).toBeVisible()
  })

  test('clicking Submit Evidence opens the create sheet', async ({ page }) => {
    await page.goto('/evidence')

    await page.getByRole('button', { name: /^submit evidence$/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
  })

  test('required validation — submitting the create sheet without a name shows the inline error', async ({ page }) => {
    await page.goto('/evidence')
    await page.getByRole('button', { name: /^submit evidence$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    await expect(dialog.getByText(/^Name must be at least 2 characters$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — fill name only, save as draft, opens the detail slideout in place', async ({ page }) => {
    await page.goto('/evidence')
    const dialog = await openSubmitEvidenceSheet(page)

    const name = evidenceName('create')
    await dialog.locator('input[name="name"]').fill(name)

    await saveEvidenceAsDraft(page, dialog)

    await expect(page.getByRole('dialog').getByText(name).first()).toBeVisible({ timeout: 20_000 })
  })

  test('Submit for review is gated on linking at least one control', async ({ page }) => {
    await page.goto('/evidence')
    const dialog = await openSubmitEvidenceSheet(page)

    await dialog.locator('input[name="name"]').fill(evidenceName('needs-control'))
    await dialog.getByRole('button', { name: /^submit for review$/i }).click()

    await expect(dialog.getByText(/Link at least one control before submitting for review/i)).toBeVisible({ timeout: 10_000 })
    await expect(dialog).toBeVisible()
  })

  test('search by name filters server-side — second evidence disappears when first name is typed', async ({ page }) => {
    const a = evidenceName('search-a')
    const b = evidenceName('search-b')
    for (const name of [a, b]) {
      await page.goto('/evidence')
      const dialog = await openSubmitEvidenceSheet(page)
      await dialog.locator('input[name="name"]').fill(name)
      await saveEvidenceAsDraft(page, dialog)
    }

    await page.goto('/evidence')

    await page.getByPlaceholder(/^Search$/).fill(a)

    await expect(page.getByRole('cell').filter({ hasText: a }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: b })).toHaveCount(0, { timeout: 15_000 })
  })

  test('newly created evidence appears in the list on /evidence', async ({ page }) => {
    await page.goto('/evidence')
    const dialog = await openSubmitEvidenceSheet(page)

    const name = evidenceName('listed')
    await dialog.locator('input[name="name"]').fill(name)
    await saveEvidenceAsDraft(page, dialog)

    await page.goto('/evidence')
    await page.getByPlaceholder('Search').fill(name)
    await expect(page.getByRole('cell').filter({ hasText: name }).first()).toBeVisible({ timeout: 15_000 })
  })
})

freshTest.describe('evidence — fresh org', () => {
  freshTest('empty state — fresh org has zero evidence rows on /evidence', async ({ page }) => {
    await seedLoggedInUser(page, 'evd-empty')

    await page.goto('/evidence')

    await expect(page.getByRole('heading', { name: /^Evidence Center$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: /^E2E Evidence/ })).toHaveCount(0, { timeout: 5_000 })
  })
})
