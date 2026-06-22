import { test, expect } from '../fixtures/auth'
import { test as freshTest, type Page } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'

const programName = (slug: string) => `E2E Program ${slug} ${RUN_ID} ${Date.now().toString(36)}`

test.describe('programs — create wizard entry', () => {
  test('/programs/create shows all 5 template cards (Quickstart + Custom)', async ({ page }) => {
    await page.goto('/programs/create')

    // Quickstart cards (each is a Card wrapped in a Link with a known href).
    await expect(page.getByRole('link', { name: /SOC 2/ })).toHaveAttribute('href', '/programs/create/soc2')
    await expect(page.getByRole('link', { name: /Risk Assessment/ })).toHaveAttribute('href', '/programs/create/risk-assessment')
    await expect(page.getByRole('link', { name: /Framework Based/ })).toHaveAttribute('href', '/programs/create/framework-based')

    // Custom cards.
    await expect(page.getByRole('link', { name: /Generic Program/ })).toHaveAttribute('href', '/programs/create/generic-program')
    await expect(page.getByRole('link', { name: /Advanced Setup/ })).toHaveAttribute('href', '/programs/create/advanced-setup')
  })
})

test.describe('programs — generic program create', () => {
  // Smoke per template — page renders without crashing and the wizard
  // exposes the standard Back + Continue/Create buttons.
  for (const path of ['/programs/create/framework-based', '/programs/create/soc2', '/programs/create/risk-assessment', '/programs/create/advanced-setup']) {
    test(`${path} renders the wizard with Back + Continue buttons`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible({ timeout: 15_000 })
      // SOC2/Risk-Assessment/Framework-Based use "Continue"; Advanced
      // Setup also uses "Continue" on its first step. Match either to
      // be robust against per-wizard label drift.
      await expect(page.getByRole('button', { name: /^(continue|next)$/i }).first()).toBeVisible()
    })
  }

  test('Back from generic-program → confirm Exit → returns to /programs/create', async ({ page }) => {
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
    await page.goto('/programs/create/generic-program')

    await page.getByRole('button', { name: /^create program$/i }).click()

    // register('name', { required: 'Program name is required' }) → RHF
    // surfaces the message under the Program Name input.
    await expect(page).toHaveURL(/\/programs\/create\/generic-program(\?|$)/)
    await expect(page.getByText(/^Program name is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — fill name + program type, submit, land on the program detail page', async ({ page }) => {
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

test.describe('programs — SOC 2 wizard', () => {
  test('step 0 — deselecting all categories surfaces the no-controls warning, re-selecting clears it', async ({ page }) => {
    await page.goto('/programs/create/soc2')
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 15_000 })

    const warning = page.getByText(/No categories selected/i)
    await expect(warning).toBeHidden()

    await page.getByRole('button', { name: 'Security', exact: true }).click()
    await expect(warning).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Security', exact: true }).click()
    await expect(warning).toBeHidden({ timeout: 10_000 })
  })

  test('Back from step 0 opens the Exit confirmation and returns to /programs/create', async ({ page }) => {
    await page.goto('/programs/create/soc2')
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^back$/i }).click()
    const dialog = page.getByRole('alertdialog', { name: /exit program creation/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^exit$/i }).click()

    await page.waitForURL(/\/programs\/create(\?|$)/, { timeout: 10_000 })
    await expect(page.getByRole('link', { name: /SOC 2/ })).toBeVisible()
  })

  test('wizard advances Categories → Team setup → Access control via Continue', async ({ page }) => {
    await page.goto('/programs/create/soc2')
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('button', { name: /add teammates now/i })).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByText(/how do you want to get started/i)).toBeVisible({ timeout: 10_000 })
  })

  test('step 1 — "Add teammates now" reveals the member and group selectors', async ({ page }) => {
    await page.goto('/programs/create/soc2')
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await page.getByRole('button', { name: /add teammates now/i }).click()
    await expect(page.getByText('Program Admins', { exact: true })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Groups with Edit Access', { exact: true })).toBeVisible()
  })

  test('step 2 — access control offers Ready to Start and Gap Analysis First', async ({ page }) => {
    await page.goto('/programs/create/soc2')
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByText(/how do you want to get started/i)).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText('Ready to Start')).toBeVisible()
    await expect(page.getByText('Gap Analysis First')).toBeVisible()
  })

  test('happy path — completing all 3 steps creates a SOC 2 program and lands on its detail page', async ({ page }) => {
    await page.goto('/programs/create/soc2')
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('button', { name: /add teammates now/i })).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByText(/how do you want to get started/i)).toBeVisible({ timeout: 10_000 })

    await page.getByText('Ready to Start').click()
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 45_000 })
    await expect(page.getByText(/Basic information/i).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('programs — framework-based wizard', () => {
  const pickFramework = async (page: Page, name: string) => {
    await page.getByText('Select a framework', { exact: true }).click()
    await page.getByPlaceholder('Search...').fill(name)
    await page
      .getByRole('option', { name: new RegExp(name) })
      .first()
      .click()
  }

  test('framework step — Continue without a framework shows the required error', async ({ page }) => {
    await page.goto('/programs/create/framework-based')
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByText(/^Framework is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('selecting the SOC 2 framework advances to the Trust Service Categories step', async ({ page }) => {
    await page.goto('/programs/create/framework-based')
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 15_000 })

    await pickFramework(page, 'SOC 2')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — framework-based with SOC 2 creates a program and lands on its detail page', async ({ page }) => {
    await page.goto('/programs/create/framework-based')
    await expect(page.getByRole('heading', { name: 'Select a Framework' })).toBeVisible({ timeout: 15_000 })

    await pickFramework(page, 'SOC 2')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('button', { name: /add teammates now/i })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByText(/how do you want to get started/i)).toBeVisible({ timeout: 10_000 })
    await page.getByText('Ready to Start').click()
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 45_000 })
    await expect(page.getByText(/Basic information/i).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('programs — risk-assessment wizard', () => {
  test('the Associate Existing Risks step renders with its optional risk selector', async ({ page }) => {
    await page.goto('/programs/create/risk-assessment')
    await expect(page.getByText('Select a framework')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('button', { name: /add teammates now/i })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Associate Existing Risks' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder('Select risks from the list')).toBeVisible()
  })

  test('happy path — risk-assessment with no framework or risks creates a program and lands on detail', async ({ page }) => {
    await page.goto('/programs/create/risk-assessment')
    await expect(page.getByText('Select a framework')).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('button', { name: /add teammates now/i })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Associate Existing Risks' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 45_000 })
    await expect(page.getByText(/Basic information/i).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('programs — advanced-setup wizard', () => {
  test('step 0 — Continue without selecting a program type stays on the type step', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })

    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible()
  })

  test('step 1 — General Information requires a Program Name', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })
    await page.getByText('Other', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('main').getByText(/^Program name is required$/i)).toBeVisible({ timeout: 10_000 })
  })

  test('step 1 — the Framework program type requires a framework selection', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })
    await page.getByText('Framework', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv-fw'))
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('main').getByText(/^Framework is required when program type is Framework$/)).toBeVisible({ timeout: 10_000 })
  })

  test('selecting a non-SOC 2 program type skips the categories step', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })
    await page.getByText('Other', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await page.getByPlaceholder('Program Test').fill(programName('adv-skip'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeHidden()
  })

  test('happy path — Advanced Setup with the "Other" type creates a program and lands on detail', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })

    await page.getByText('Other', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Add Team Members' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Associate Existing Objects' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^create$/i }).click()

    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 45_000 })
    await expect(page.getByText(/Basic information/i).first()).toBeVisible({ timeout: 20_000 })
  })
})

test.describe('programs — advanced-setup date validation', () => {
  // advanced-setup-wizard.tsx seeds startDate=today / endDate=+1yr by default
  // (both valid). To exercise step2Schema.superRefine we drive the End Date
  // CalendarPopover into the previous month, which is unambiguously in the
  // past → "End date must be in the future". The popover trigger reads
  // "Select a date:" before selection but shows the formatted default here;
  // there are two date triggers (Start + End) on the General Information
  // step, so we anchor on the End Date field's column.
  const advanceToGeneralInfo = async (page: Page) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await page.getByText('Other', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
  }

  test('a past End Date surfaces the "must be in the future" validation', async ({ page }) => {
    test.slow()
    await advanceToGeneralInfo(page)
    await page.getByPlaceholder('Program Test').fill(programName('adv-date'))

    // The Start + End calendars are the two date-popover triggers. The End Date
    // defaults to today + 1 year, so its calendar opens on next year's month.
    // Step back 15 months (covers the +1yr default with buffer) so day 15 lands
    // unambiguously in the past → triggers step2Schema's future-date refine.
    const endDateTrigger = page.getByRole('button', { name: /select a date|\d{4}/i }).nth(1)
    await endDateTrigger.click()
    for (let i = 0; i < 15; i++) {
      await page.getByRole('button', { name: /go to the previous month/i }).click()
    }
    await page
      .getByRole('button', { name: /(^|\s)15(th|st|nd|rd)?(,|$|\s)/i })
      .first()
      .click()

    await page.getByRole('button', { name: /^continue$/i }).click()

    // Validation surfaces both inline (<span> in main) and via the wizard's
    // errorNotification toast → scope to main and take the first match.
    await expect(page.getByRole('main').getByText('End date must be in the future').first()).toBeVisible({ timeout: 10_000 })
    // Step did not advance (still on General Information).
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible()
  })
})

test.describe('programs — advanced-setup SOC 2 categories step', () => {
  // The categories step (id '2') is conditionally enabled only when the
  // Framework program type + SOC 2 framework are chosen (disabledIDs gates
  // it otherwise). Drive type=Framework, framework=SOC 2 to reach it.
  const advanceToCategories = async (page: Page) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await page.getByText('Framework', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByText('Select a framework', { exact: true }).click()
    await page.getByPlaceholder('Search...').fill('SOC 2')
    await page.getByRole('option', { name: /SOC 2/ }).first().click()
    // Selecting SOC 2 auto-populates the program name; Continue advances to
    // the categories step.
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 10_000 })
  }

  test('toggling all categories off surfaces the no-controls warning, re-selecting clears it', async ({ page }) => {
    test.slow()
    await advanceToCategories(page)

    // select-category-step.tsx defaults to ['Security']; the warning only
    // renders when nothing is selected.
    const warning = page.getByText(/No categories selected/i)
    await expect(warning).toBeHidden()

    await page.getByRole('button', { name: 'Security', exact: true }).click()
    await expect(warning).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: 'Security', exact: true }).click()
    await expect(warning).toBeHidden({ timeout: 10_000 })
  })

  test('additional categories can be toggled on alongside Security', async ({ page }) => {
    test.slow()
    await advanceToCategories(page)

    const security = page.getByRole('button', { name: 'Security', exact: true })
    const availability = page.getByRole('button', { name: 'Availability', exact: true })
    const privacy = page.getByRole('button', { name: 'Privacy', exact: true })

    await expect(security).toBeVisible()
    await availability.click()
    await privacy.click()

    // No warning while at least one category remains selected.
    await expect(page.getByText(/No categories selected/i)).toBeHidden()
  })
})

test.describe('programs — advanced-setup step navigation', () => {
  test('Continue then Back round-trips General Information ↔ Auditors', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await page.getByText('Other', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv-nav'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    // Non-SOC 2 type skips the categories step → next is Auditors.
    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })

    // Back returns to General Information with the entered name preserved.
    await page.getByRole('button', { name: /^back$/i }).click()
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder('Program Test')).not.toHaveValue('')
  })

  test('forward navigation walks Auditors → Add Team Members → Associate Existing Objects', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await page.getByText('Other', { exact: true }).click()
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv-fwd'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Add Team Members' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Associate Existing Objects' })).toBeVisible({ timeout: 10_000 })
    // Final step swaps Continue for Create.
    await expect(page.getByRole('button', { name: /^create$/i })).toBeVisible()
  })
})

freshTest.describe('programs — fresh org', () => {
  freshTest('fresh org with no programs lands on the template picker via /programs', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-empty')

    await page.goto('/programs')

    await expect(page.getByText(/no programs found/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /Generic Program/ })).toBeVisible()
  })
})
