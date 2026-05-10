import { expect, test } from '@playwright/test'

import { RUN_ID } from '../utils/constants'
import { seedLoggedInUser } from '../utils/seedUser'

const programName = (slug: string) => `E2E Program ${slug} ${RUN_ID} ${Date.now().toString(36)}`

test.describe('programs — create wizard entry', () => {
  test('/programs/create shows all 5 template cards (Quickstart + Custom)', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-tpl')

    await page.goto('/programs/create')

    // Quickstart cards (each is a Card wrapped in a Link with a known href).
    await expect(page.getByRole('link', { name: /SOC 2/ })).toHaveAttribute('href', '/programs/create/soc2')
    await expect(page.getByRole('link', { name: /Risk Assessment/ })).toHaveAttribute('href', '/programs/create/risk-assessment')
    await expect(page.getByRole('link', { name: /Framework Based/ })).toHaveAttribute('href', '/programs/create/framework-based')

    // Custom cards.
    await expect(page.getByRole('link', { name: /Generic Program/ })).toHaveAttribute('href', '/programs/create/generic-program')
    await expect(page.getByRole('link', { name: /Advanced Setup/ })).toHaveAttribute('href', '/programs/create/advanced-setup')
  })

  test('fresh org with no programs lands on the template picker via /programs', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-empty')

    await page.goto('/programs')

    // ProgramsDashboardPage renders ProgramsCreate(noPrograms=true) when
    // there are zero programs. The "No programs found" copy is what the
    // user sees in that state.
    await expect(page.getByText(/no programs found/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Generic Program/ })).toBeVisible()
  })
})

test.describe('programs — generic program create', () => {
  // Smoke per template — page renders without crashing and the wizard
  // exposes the standard Back + Continue/Create buttons.
  for (const path of ['/programs/create/framework-based', '/programs/create/soc2', '/programs/create/risk-assessment', '/programs/create/advanced-setup']) {
    test(`${path} renders the wizard with Back + Continue buttons`, async ({ page }) => {
      await seedLoggedInUser(page, `prog-tpl-${path.split('/').pop()}`)

      await page.goto(path)

      await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible({ timeout: 15_000 })
      // SOC2/Risk-Assessment/Framework-Based use "Continue"; Advanced
      // Setup also uses "Continue" on its first step. Match either to
      // be robust against per-wizard label drift.
      await expect(page.getByRole('button', { name: /^(continue|next)$/i }).first()).toBeVisible()
    })
  }

  test('Back from generic-program → confirm Exit → returns to /programs/create', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-back')

    await page.goto('/programs/create/generic-program')
    await page.getByRole('button', { name: /^back$/i }).click()

    // ConfirmationDialog renders as a Radix AlertDialog. Title "Exit
    // Program Creation" + confirmation action "Exit".
    const dialog = page.getByRole('alertdialog', { name: /exit program creation/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^exit$/i }).click()

    await page.waitForURL(/\/programs\/create(\?|$)/, { timeout: 10_000 })
    // Template picker is reachable again.
    await expect(page.getByRole('link', { name: /Generic Program/ })).toBeVisible()
  })

  test('required validation — submitting without a Program Name shows the inline error', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-required')

    await page.goto('/programs/create/generic-program')

    await page.getByRole('button', { name: /^create program$/i }).click()

    // register('name', { required: 'Program name is required' }) → RHF
    // surfaces the message under the Program Name input.
    await expect(page).toHaveURL(/\/programs\/create\/generic-program(\?|$)/)
    await expect(page.getByText(/^Program name is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — fill name + program type, submit, land on the program detail page', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-create')

    await page.goto('/programs/create/generic-program')

    // Open the Program Type combobox. There's exactly one role=combobox
    // on this page; getByRole's name filter has been finicky here
    // (FormLabel htmlFor + button text both contribute to the
    // accessibility tree), so locate by attribute directly.
    const programTypeTrigger = page.locator('button[role="combobox"]')
    await programTypeTrigger.click()

    // Type a unique value that won't collide with any pre-seeded option,
    // then press Enter to invoke the "Create '<value>'" branch (cmdk's
    // CommandEmpty surfaces it when nothing matches). The component's
    // onKeyDown handler on Enter calls handleCreateValue.
    const programType = `E2E Type ${RUN_ID}`
    await page.getByPlaceholder(/search program type/i).fill(programType)
    await page.keyboard.press('Enter')

    // Wait for the popover to dismiss (search input goes away) and the
    // trigger to display the selected value.
    await expect(page.getByPlaceholder(/search program type/i)).toBeHidden({ timeout: 10_000 })
    await expect(programTypeTrigger).toContainText(programType)

    const name = programName('create')
    await page.getByPlaceholder(/^Program Test$/).fill(name)

    await page.getByRole('button', { name: /^create program$/i }).click()

    // Form redirects to /programs/{id} on success.
    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 30_000 })

    // Detail page renders the program name in the Basic Information block.
    await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 })
  })

  test('program detail breadcrumb includes the program name', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-bc')

    await page.goto('/programs/create/generic-program')

    const programTypeTrigger = page.locator('button[role="combobox"]')
    await programTypeTrigger.click()
    const programType = `E2E Type ${RUN_ID}`
    await page.getByPlaceholder(/search program type/i).fill(programType)
    await page.keyboard.press('Enter')
    await expect(page.getByPlaceholder(/search program type/i)).toBeHidden({ timeout: 10_000 })

    const name = programName('bc')
    await page.getByPlaceholder(/^Program Test$/).fill(name)
    await page.getByRole('button', { name: /^create program$/i }).click()
    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 30_000 })

    const navigation = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    await expect(navigation.getByText(name)).toBeVisible({ timeout: 15_000 })
  })

  test('newly created program registers under the "Other" framework group on /programs', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-listed')

    // Reuse the create-flow steps from the happy-path test.
    await page.goto('/programs/create/generic-program')

    const programTypeTrigger = page.locator('button[role="combobox"]')
    await programTypeTrigger.click()
    const programType = `E2E Type ${RUN_ID}`
    await page.getByPlaceholder(/search program type/i).fill(programType)
    await page.keyboard.press('Enter')
    await expect(page.getByPlaceholder(/search program type/i)).toBeHidden({ timeout: 10_000 })

    const name = programName('listed')
    await page.getByPlaceholder(/^Program Test$/).fill(name)
    await page.getByRole('button', { name: /^create program$/i }).click()
    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 30_000 })

    // /programs renders the framework-grouped accordion. The "Other"
    // group key is only emitted when at least one program has no
    // frameworkName — which is exactly what a generic program produces.
    // We verify registration via the group's presence; the accordion's
    // controlled-mode behavior is owned by Radix and not worth racing.
    await page.goto('/programs')
    await expect(page.getByRole('button', { name: /^Other$/ })).toBeVisible({ timeout: 15_000 })
  })
})
