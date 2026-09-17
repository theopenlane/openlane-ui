import type { Page } from '@playwright/test'

import { test, expect } from '../fixtures/auth'
import { deleteProgram, getOwnerApi, type ApiSession } from '../utils/api'

const openWizard = async (page: Page, path: string, heading: RegExp) => {
  await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 180_000 })
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 60_000 })
}

const pickFirstFramework = async (page: Page) => {
  await page.getByText('Select a framework', { exact: true }).click()
  await expect(page.getByPlaceholder('Search...')).toBeVisible({ timeout: 20_000 })
  const option = page.getByRole('option').first()
  await expect(option).toBeVisible({ timeout: 20_000 })
  await option.click()
}

const advanceToProgramType = async (page: Page) => {
  const readyToStart = page.getByText('Ready to Start', { exact: true })
  for (let step = 0; step < 3; step += 1) {
    if (await readyToStart.isVisible()) return
    await page.getByRole('button', { name: /^Continue$/ }).click()
    await expect(page.getByRole('button', { name: /^Continue$|^Create$/ })).toBeVisible({ timeout: 30_000 })
  }
  await expect(readyToStart).toBeVisible({ timeout: 30_000 })
}

const advanceToTeamSetup = async (page: Page) => {
  const inviteNow = page.getByRole('button', { name: /^Add teammates now$/ })
  for (let step = 0; step < 3; step += 1) {
    if (await inviteNow.isVisible().catch(() => false)) return
    await page.getByRole('button', { name: /^Continue$/ }).click()
    await expect(inviteNow.or(page.getByRole('button', { name: /^Continue$/ })).first()).toBeVisible({ timeout: 60_000 })
  }
  await expect(inviteNow).toBeVisible({ timeout: 60_000 })
}

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

test.describe('programs — framework-based wizard', () => {
  test('continuing without a framework keeps the wizard on the framework step', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/framework-based', /^Select a Framework$/)

    await page.getByRole('button', { name: /^Continue$/ }).click()

    await expect(page.getByText('Framework is required')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('heading', { name: /^Select a Framework$/ })).toBeVisible()
  })

  test('Back returns to the framework step with the chosen framework kept', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/framework-based', /^Select a Framework$/)
    await pickFirstFramework(page)

    await page.getByRole('button', { name: /^Continue$/ }).click()
    await expect(page.getByRole('heading', { name: /^Select a Framework$/ })).toHaveCount(0, { timeout: 30_000 })

    await page.getByRole('button', { name: /^Back$/ }).click()
    await expect(page.getByRole('heading', { name: /^Select a Framework$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Select a framework', { exact: true })).toHaveCount(0)
  })

  test('a non-SOC 2 framework skips the categories step and lands on Team Setup', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/framework-based', /^Select a Framework$/)
    await pickFirstFramework(page)

    await page.getByRole('button', { name: /^Continue$/ }).click()

    await expect(page.getByRole('button', { name: /^Add teammates now$/ }).or(page.getByRole('heading', { name: /Categories/ }))).toBeVisible({ timeout: 60_000 })
  })

  test('Team Setup toggles between inviting now and deferring', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/framework-based', /^Select a Framework$/)
    await pickFirstFramework(page)
    await advanceToTeamSetup(page)

    await page.getByRole('button', { name: /^Add teammates now$/ }).click()

    await expect(page.getByText('Program Admins', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Program Members', { exact: true })).toBeVisible()
    await expect(page.getByText('Groups with Edit Access', { exact: true })).toBeVisible()
    await expect(page.getByText('Groups with Read Only Access', { exact: true })).toBeVisible()
  })

  test("choosing 'I'll do this later' advances past Team Setup", async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/framework-based', /^Select a Framework$/)
    await pickFirstFramework(page)
    await advanceToTeamSetup(page)

    await page.getByRole('button', { name: /I'll do this later/ }).click()

    await expect(page.getByText('Ready to Start', { exact: true })).toBeVisible({ timeout: 60_000 })
  })

  test('the wizard creates a program and redirects to its detail page', async ({ page }) => {
    test.slow()
    let programId = ''

    try {
      await openWizard(page, '/programs/create/framework-based', /^Select a Framework$/)
      await pickFirstFramework(page)
      await advanceToProgramType(page)

      await page.getByText('Ready to Start', { exact: true }).click()
      await page.getByRole('button', { name: /^Create$/ }).click()

      await expect(page.getByText('Program Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page).toHaveURL(/\/programs\/[^/]+$/, { timeout: 60_000 })

      programId = page.url().split('/').pop() ?? ''
      expect(programId).not.toBe('')
      expect(programId).not.toBe('create')
    } finally {
      if (programId) await deleteProgram(ownerApi, programId)
    }
  })
})

test.describe('programs — risk-assessment wizard', () => {
  test('the framework step is optional and the wizard advances without one', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/risk-assessment', /^Select an Optional Framework$/)

    await page.getByRole('button', { name: /^Continue$/ }).click()

    await expect(page.getByRole('heading', { name: /^Select an Optional Framework$/ })).toHaveCount(0, { timeout: 30_000 })
    await expect(page.getByRole('button', { name: /^Back$/ })).toBeVisible({ timeout: 30_000 })
  })

  test('picking an optional framework keeps it selected across the step', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/risk-assessment', /^Select an Optional Framework$/)
    await pickFirstFramework(page)

    await expect(page.getByText('Select a framework', { exact: true })).toHaveCount(0, { timeout: 30_000 })

    await page.getByRole('button', { name: /^Continue$/ }).click()
    await page.getByRole('button', { name: /^Back$/ }).click()

    await expect(page.getByRole('heading', { name: /^Select an Optional Framework$/ })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Select a framework', { exact: true })).toHaveCount(0)
  })

  test('Team Setup exposes both paths and the multiselects behind Add teammates now', async ({ page }) => {
    test.slow()
    await openWizard(page, '/programs/create/risk-assessment', /^Select an Optional Framework$/)
    await page.getByRole('button', { name: /^Continue$/ }).click()

    const inviteNow = page.getByRole('button', { name: /^Add teammates now$/ })
    await expect(inviteNow).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: /I'll do this later/ })).toBeVisible()
    await inviteNow.click()

    await expect(page.getByText('Program Admins', { exact: true })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Program Members', { exact: true })).toBeVisible()
    await expect(page.getByText('Groups with Edit Access', { exact: true })).toBeVisible()
    await expect(page.getByText('Groups with Read Only Access', { exact: true })).toBeVisible()
  })

  test('the wizard steps through all three stages and creates the program', async ({ page }) => {
    test.slow()
    let programId = ''

    try {
      await openWizard(page, '/programs/create/risk-assessment', /^Select an Optional Framework$/)
      await page.getByRole('button', { name: /^Continue$/ }).click()

      await page.getByRole('button', { name: /I'll do this later/ }).click()

      await expect(page.getByRole('heading', { name: /^Associate Existing Risks$/ })).toBeVisible({ timeout: 60_000 })
      await page.getByRole('button', { name: /^Create$/ }).click()

      await expect(page.getByText('Program Created', { exact: true }).first()).toBeVisible({ timeout: 60_000 })
      await expect(page).toHaveURL(/\/programs\/[^/]+$/, { timeout: 60_000 })

      programId = page.url().split('/').pop() ?? ''
      expect(programId).not.toBe('')
      expect(programId).not.toBe('create')
    } finally {
      if (programId) await deleteProgram(ownerApi, programId)
    }
  })
})
