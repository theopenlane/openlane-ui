import type { Page } from '@playwright/test'

import { test, expect, readManifest, type Role } from '../fixtures/auth'
import { createProgram, getOwnerApi, type ApiSession } from '../utils/api'
import { uniqueName } from '../utils/unique'
import { PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON } from '../utils/permission-gating'

test.skip(!PERMISSION_GATES_ENABLED, PERMISSION_GATES_SKIP_REASON)

const PROTECTED = /protected area/i

let ownerApi: ApiSession
let sharedControlId: string
let programId: string

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
  sharedControlId = readManifest().sharedControlId
  programId = await createProgram(ownerApi, uniqueName('E2E Program gating'))
})

const openSettings = async (page: Page) => {
  await page.goto(`/programs/${programId}/settings`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
}

test.describe('permissions — owner can manage a program', () => {
  test('the owner sees the Assign control and member row actions', async ({ page }) => {
    test.slow()
    await openSettings(page)

    await expect(page.getByText('Program Settings').first()).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('button', { name: /^Assign$/ }).first()).toBeVisible({ timeout: 30_000 })
  })

  test('the owner can reach the clone-control form', async ({ page }) => {
    test.slow()
    await page.goto(`/controls/${sharedControlId}/clone-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

    await expect(page.getByLabel(/^Ref Code/)).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(PROTECTED)).toHaveCount(0)
  })
})

for (const role of ['member', 'readonly'] as Role[]) {
  test.describe(`permissions — ${role} cannot manage a program or clone a control`, () => {
    test.use({ authProfile: role })

    test(`${role} sees no Assign control or member row actions on program settings`, async ({ page }) => {
      test.slow()
      await openSettings(page)

      await expect(page.getByText('Program Settings').first().or(page.getByText(PROTECTED))).toBeVisible({ timeout: 60_000 })
      await expect(page.getByRole('button', { name: 'Program member actions' })).toHaveCount(0)
      await expect(page.getByRole('button', { name: /^Assign$/ })).toHaveCount(0)
    })

    test(`${role} is blocked from the clone-control form`, async ({ page }) => {
      test.slow()
      await page.goto(`/controls/${sharedControlId}/clone-control`, { waitUntil: 'domcontentloaded', timeout: 180_000 })

      await expect(page.getByText(PROTECTED)).toBeVisible({ timeout: 60_000 })
      await expect(page.getByLabel(/^Ref Code/)).toHaveCount(0)
    })
  })
}
