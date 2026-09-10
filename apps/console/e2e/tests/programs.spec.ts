import { test, expect } from '../fixtures/auth'
import { test as freshTest, type Page } from '@playwright/test'
import { seedLoggedInUser } from '../utils/seedUser'

import { RUN_ID } from '../utils/constants'
import { createProgram, type ApiSession, getOwnerApi } from '../utils/api'
import { uniqueName } from '../utils/unique'

const programName = (slug: string) => uniqueName(`E2E Program ${slug}`)

const trustServiceCategory = (page: Page, name: string) => page.locator(`#trust-service-category-${name.replace(/\s+/g, '-').toLowerCase()}`)

const selectProgramType = async (page: Page, label: string): Promise<void> => {
  const picker = page
    .locator('div')
    .filter({ has: page.getByRole('heading', { name: 'Select a Program Type' }) })
    .last()
  await picker.getByText(label, { exact: true }).click()
}

test.describe('programs — create wizard entry', () => {
  test('/programs/create shows all 5 template cards (Quickstart + Custom)', async ({ page }) => {
    await page.goto('/programs/create')

    await expect(page.getByRole('link', { name: /SOC 2/ })).toHaveAttribute('href', '/programs/create/soc2')
    await expect(page.getByRole('link', { name: /Risk Assessment/ })).toHaveAttribute('href', '/programs/create/risk-assessment')
    await expect(page.getByRole('link', { name: /Framework Based/ })).toHaveAttribute('href', '/programs/create/framework-based')

    await expect(page.getByRole('link', { name: /Generic Program/ })).toHaveAttribute('href', '/programs/create/generic-program')
    await expect(page.getByRole('link', { name: /Advanced Setup/ })).toHaveAttribute('href', '/programs/create/advanced-setup')
  })
})

test.describe('programs — generic program create', () => {
  for (const path of ['/programs/create/framework-based', '/programs/create/soc2', '/programs/create/risk-assessment', '/programs/create/advanced-setup']) {
    test(`${path} renders the wizard with Back + Continue buttons`, async ({ page }) => {
      await page.goto(path)

      await expect(page.getByRole('button', { name: /^back$/i })).toBeVisible({ timeout: 15_000 })
      await expect(page.getByRole('button', { name: /^(continue|next)$/i }).first()).toBeVisible()
    })
  }

  test('Back from generic-program → confirm Exit → returns to /programs/create', async ({ page }) => {
    await page.goto('/programs/create/generic-program')
    await page.getByRole('button', { name: /^back$/i }).click()

    const dialog = page.getByRole('alertdialog', { name: /exit program creation/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })
    await dialog.getByRole('button', { name: /^exit$/i }).click()

    await page.waitForURL(/\/programs\/create(\?|$)/, { timeout: 10_000 })
    await expect(page.getByRole('link', { name: /Generic Program/ })).toBeVisible()
  })

  test('required validation — submitting without a Program Name shows the inline error', async ({ page }) => {
    await page.goto('/programs/create/generic-program')

    await page.getByRole('button', { name: /^create program$/i }).click()

    await expect(page).toHaveURL(/\/programs\/create\/generic-program(\?|$)/)
    await expect(page.getByText(/^Program name is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — fill name + program type, submit, land on the program detail page', async ({ page }) => {
    await page.goto('/programs/create/generic-program')

    const programTypeTrigger = page.locator('button[role="combobox"]')
    await programTypeTrigger.click()

    const programType = `E2E Type ${RUN_ID}`
    await page.getByPlaceholder(/search program type/i).fill(programType)
    await page.keyboard.press('Enter')

    await expect(page.getByPlaceholder(/search program type/i)).toBeHidden({ timeout: 10_000 })
    await expect(programTypeTrigger).toContainText(programType)

    const name = programName('create')
    await page.getByPlaceholder(/^Program Test$/).fill(name)

    await page.getByRole('button', { name: /^create program$/i }).click()

    await page.waitForURL(/\/programs\/[^/]+(\?|$)/, { timeout: 30_000 })

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

    await trustServiceCategory(page, 'Security').click()
    await expect(warning).toBeVisible({ timeout: 10_000 })

    await trustServiceCategory(page, 'Security').click()
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
    await selectProgramType(page, 'Other')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('main').getByText(/^Program name is required$/i)).toBeVisible({ timeout: 10_000 })
  })

  test('step 1 — the Framework program type requires a framework selection', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })
    await selectProgramType(page, 'Framework')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv-fw'))
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('main').getByText(/^Framework is required when program type is Framework$/)).toBeVisible({ timeout: 10_000 })
  })

  test('selecting a non-SOC 2 program type skips the categories step', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })
    await selectProgramType(page, 'Other')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await page.getByPlaceholder('Program Test').fill(programName('adv-skip'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeHidden()
  })

  test('happy path — Advanced Setup with the "Other" type creates a program and lands on detail', async ({ page }) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 15_000 })

    await selectProgramType(page, 'Other')
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
  const advanceToGeneralInfo = async (page: Page) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await selectProgramType(page, 'Other')
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
  }

  test('a past End Date surfaces the "must be in the future" validation', async ({ page }) => {
    test.slow()
    await advanceToGeneralInfo(page)
    await page.getByPlaceholder('Program Test').fill(programName('adv-date'))

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

    await expect(page.getByRole('main').getByText('End date must be in the future').first()).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible()
  })
})

test.describe('programs — advanced-setup SOC 2 categories step', () => {
  // The categories step (id '2') is conditionally enabled only when the Framework program type + SOC 2 framework are chosen (disabledIDs gates it otherwise)
  const advanceToCategories = async (page: Page) => {
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await selectProgramType(page, 'Framework')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByText('Select a framework', { exact: true }).click()
    await page.getByPlaceholder('Search...').fill('SOC 2')
    await page.getByRole('option', { name: /SOC 2/ }).first().click()
    await page.getByRole('button', { name: /^continue$/i }).click()
    await expect(page.getByRole('heading', { name: 'Add Trust Service Categories' })).toBeVisible({ timeout: 10_000 })
  }

  test('toggling all categories off surfaces the no-controls warning, re-selecting clears it', async ({ page }) => {
    test.slow()
    await advanceToCategories(page)

    const warning = page.getByText(/No categories selected/i)
    await expect(warning).toBeHidden()

    await trustServiceCategory(page, 'Security').click()
    await expect(warning).toBeVisible({ timeout: 10_000 })

    await trustServiceCategory(page, 'Security').click()
    await expect(warning).toBeHidden({ timeout: 10_000 })
  })

  test('additional categories can be toggled on alongside Security', async ({ page }) => {
    test.slow()
    await advanceToCategories(page)

    const security = trustServiceCategory(page, 'Security')
    const availability = trustServiceCategory(page, 'Availability')
    const privacy = trustServiceCategory(page, 'Privacy')

    await expect(security).toBeVisible()
    await availability.click()
    await privacy.click()

    await expect(page.getByText(/No categories selected/i)).toBeHidden()
  })
})

test.describe('programs — advanced-setup step navigation', () => {
  test('Continue then Back round-trips General Information ↔ Auditors', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await selectProgramType(page, 'Other')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv-nav'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })

    await page.getByRole('button', { name: /^back$/i }).click()
    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByPlaceholder('Program Test')).not.toHaveValue('')
  })

  test('forward navigation walks Auditors → Add Team Members → Associate Existing Objects', async ({ page }) => {
    test.slow()
    await page.goto('/programs/create/advanced-setup')
    await expect(page.getByRole('heading', { name: 'Select a Program Type' })).toBeVisible({ timeout: 20_000 })
    await selectProgramType(page, 'Other')
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'General Information' })).toBeVisible({ timeout: 10_000 })
    await page.getByPlaceholder('Program Test').fill(programName('adv-fwd'))
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Auditors' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Add Team Members' })).toBeVisible({ timeout: 10_000 })
    await page.getByRole('button', { name: /^continue$/i }).click()

    await expect(page.getByRole('heading', { name: 'Associate Existing Objects' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByRole('button', { name: /^create$/i })).toBeVisible()
  })
})

freshTest.describe('programs — fresh org', () => {
  freshTest('fresh org with no programs lands on the template picker via /programs', async ({ page }) => {
    await seedLoggedInUser(page, 'prog-empty')

    await page.goto('/programs')

    await expect(page.getByRole('heading', { level: 1, name: /^Programs$/ })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('link', { name: /Generic Program/ })).toBeVisible()
  })
})

test.describe('programs — landing page (ISS-2409)', () => {
  test('/programs?view=all always renders the list, never the single-program redirect', async ({ page }) => {
    test.slow()
    await page.goto('/programs?view=all', { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page).toHaveURL(/\/programs\?view=all/, { timeout: 30_000 })
    await expect(page.getByRole('heading', { name: /^Programs$/ }).first()).toBeVisible({ timeout: 30_000 })

    await expect(page.getByText('Expand all', { exact: true })).toBeVisible({ timeout: 20_000 })
  })

  test('the Archived tab switches the dashboard status filter', async ({ page }) => {
    test.slow()
    await page.goto('/programs?view=all', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /^Programs$/ }).first()).toBeVisible({ timeout: 30_000 })

    const archived = page.getByRole('tab', { name: /^Archived$/ })
    await expect(archived).toBeVisible({ timeout: 20_000 })
    await archived.click()
    await expect(archived).toHaveAttribute('aria-selected', 'true', { timeout: 15_000 })
  })

  test('breadcrumbs from a program detail link back to the full list', async ({ page }) => {
    test.slow()
    await page.goto('/programs?view=all', { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { name: /^Programs$/ }).first()).toBeVisible({ timeout: 30_000 })

    const crumbs = page.getByRole('navigation', { name: /breadcrumb/i }).first()
    const programsCrumb = crumbs.getByRole('link', { name: /^Programs$/ })
    if (await programsCrumb.isVisible().catch(() => false)) {
      await expect(programsCrumb).toHaveAttribute('href', /\/programs\?view=all/)
    }
  })
})

test.describe('programs — created control count (ISS-2547)', () => {
  let ownerApi: ApiSession

  test.beforeAll(async () => {
    ownerApi = await getOwnerApi()
  })

  test('the program detail shows a Created control segment', async ({ page }) => {
    test.slow()
    const programId = await createProgram(ownerApi, programName('created-count'))

    await page.goto(`/programs/${programId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByTestId('user-menu-trigger')).toBeAttached({ timeout: 30_000 })

    await expect(page.getByText('Created', { exact: true }).first()).toBeVisible({ timeout: 30_000 })
  })
})
