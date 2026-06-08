import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createGroup, type ApiSession } from '../utils/api'

/**
 * Deep user-management flows beyond user-management.spec.ts (invite/pending/group
 * create on fresh users): members table columns, and group edit/delete on
 * groups seeded via the Owner API.
 *
 * IMPORTANT: these run against the SHARED org, so they must NOT mutate the
 * seeded Owner/Admin/Member/ReadOnly memberships — the permission specs depend
 * on those exact roles. Change-role / remove-member are therefore NOT tested
 * here (they'd need a throwaway active member). Only new groups are mutated.
 *
 * ⏳ Written without running (servers were off). Selectors grounded in
 * user-management.spec.ts + a component selector map; verify on first run.
 */

let ownerApi: ApiSession
let counter = 0
const uniqueGroupName = () => `E2E GrpCRUD ${RUN_ID} ${Date.now().toString(36)}-${counter++}`

test.beforeAll(async () => {
  const { ownerEmail, password } = readManifest()
  ownerApi = await loginViaApi(ownerEmail, password)
})

test.describe('user-management — members table', () => {
  test('members list renders the seeded members (owner row present)', async ({ page }) => {
    const { ownerEmail } = readManifest()
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 20_000 })

    // The table doesn't expose ARIA columnheader roles, so assert the data
    // renders: the seeded Owner appears in the member list.
    await expect(page.getByText(ownerEmail).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('user-management — groups (seeded)', () => {
  test('edit a group description from its details sheet', async ({ page }) => {
    const id = await createGroup(ownerApi, uniqueGroupName())

    // Navigating with ?id= opens the group details sheet.
    await page.goto(`/user-management/groups?id=${id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^Edit Group$/i }).click()

    const description = `Updated by e2e ${Date.now().toString(36)}`
    await page.locator('textarea[placeholder="Add a description"]').fill(description)
    // SaveButton default title is "Save Changes".
    await page.getByRole('button', { name: /^Save Changes$/i }).click()

    await expect(page.getByText(/group updated successfully/i).first()).toBeVisible({ timeout: 15_000 })
  })

  test('delete a group via the confirmation dialog', async ({ page }) => {
    const id = await createGroup(ownerApi, uniqueGroupName())

    await page.goto(`/user-management/groups?id=${id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^Delete$/i }).click()

    // "Delete group" confirmation → destructive "Delete this group".
    await page.getByRole('button', { name: /^Delete this group$/i }).click()

    // Toast text appears in both the visible div and an aria-live span — take first.
    await expect(page.getByText(/deleted successfully/i).first()).toBeVisible({ timeout: 15_000 })
  })
})
