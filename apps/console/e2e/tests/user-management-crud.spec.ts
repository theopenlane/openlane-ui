import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createGroup, getSelf, addOrgMember, memberSeesOrg, type ApiSession } from '../utils/api'
import { registerAndVerify } from '../utils/registerUser'

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

/**
 * Seed a THROWAWAY active member into the shared org so change-role / remove
 * specs never mutate the seeded Owner/Admin/Member/ReadOnly memberships the
 * permission specs depend on.
 *
 * The throwaway uses the shared org's allowed email domain (the owner's, from
 * the manifest) — the org rejects createOrgMembership for any other domain, and
 * that domain has autojoin, so verifying the user lands them as MEMBER. Its
 * displayName is the email local-part (firstName/lastName are blank at register
 * time), which is what the members table search matches and is returned so the
 * spec can isolate the row.
 */
const seedThrowawayMember = async (sharedOrgId: string, allowedDomain: string): Promise<{ email: string; displayName: string }> => {
  const localPart = `e2e-throwaway-${RUN_ID}-${Date.now().toString(36)}-${counter++}`
  const email = `${localPart}@${allowedDomain}`
  const displayName = localPart
  await registerAndVerify({ email })
  const memberApi = await loginViaApi(email)
  const { id: userId } = await getSelf(memberApi)
  await addOrgMember(ownerApi, sharedOrgId, userId, 'MEMBER')
  await memberSeesOrg(memberApi, sharedOrgId)
  return { email, displayName }
}

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

/**
 * Group details-sheet sub-flows: the Members/Permissions toggle and the
 * Add-members / Assign-permissions dialogs. These OPEN the dialogs (and assert
 * their structure) but do not save — actually adding a member to a group is
 * safe (groups are throwaway-seeded), but the multi-select interaction is
 * brittle to drive blind, so the open-and-structure assertion is the stable
 * coverage here.
 *
 * ⏳ Written without running; selectors grounded in group-details-sheet.tsx +
 * add-members-dialog.tsx + assign-permissions-dialog.tsx. Verify on first run.
 */
test.describe('user-management — group details sheet (seeded)', () => {
  test('group sheet exposes the Members/Permissions toggle and member actions', async ({ page }) => {
    const id = await createGroup(ownerApi, uniqueGroupName())

    await page.goto(`/user-management/groups?id=${id}`, { waitUntil: 'domcontentloaded' })

    // group-details-sheet.tsx header actions (canEdit → owner sees both).
    await expect(page.getByRole('button', { name: /^Add members$/ })).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('button', { name: /^Assign permissions to group$/ })).toBeVisible()

    await expect(page.getByText('Members', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Roles and Permissions', { exact: true }).first()).toBeVisible()
  })

  test('Add members dialog opens with the member selector', async ({ page }) => {
    const id = await createGroup(ownerApi, uniqueGroupName())

    await page.goto(`/user-management/groups?id=${id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^Add members$/ }).click()

    // DialogTitle "Add members" (an <h2>, distinct from the trigger button) +
    // the "Group member(s)" label above the MultipleSelector.
    await expect(page.getByRole('heading', { name: 'Add members' })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText(/Group member\(s\)/)).toBeVisible()
  })

  test('Assign permissions dialog opens', async ({ page }) => {
    const id = await createGroup(ownerApi, uniqueGroupName())

    await page.goto(`/user-management/groups?id=${id}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^Assign permissions to group$/ }).click()

    await expect(page.getByRole('heading', { name: 'Assign permissions' })).toBeVisible({ timeout: 10_000 })
  })
})

/**
 * Member row actions against a throwaway member — these mutate org membership,
 * so they target a freshly-seeded throwaway (never the permission fixtures). The
 * members table Search isolates the throwaway row so its actions trigger
 * (data-testid="member-actions-trigger") is unique.
 *
 * ⏳ Written without running; verify on first run.
 */
/**
 * Groups page toolbar: the Filter dropdown surfaces the All Groups / My Groups /
 * System Managed Groups quick filters (groups-page.tsx quickFilters), and the
 * Columns dropdown lets you toggle visibility. Render/open-only — no data mutated.
 */
test.describe('user-management — groups toolbar', () => {
  test('Filter dropdown exposes the All Groups / My Groups / System Managed quick filters', async ({ page }) => {
    await page.goto('/user-management/groups', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Groups$/ })).toBeVisible({ timeout: 20_000 })

    // groups-page.tsx renders TableFilter (trigger "Filter") with quickFilters.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^Filter$/ })
      .first()
      .click()

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })

    await expect(menu.getByText('Quick Filters', { exact: true })).toBeVisible()
    await expect(menu.getByRole('button', { name: /^All Groups$/ })).toBeVisible()
    await expect(menu.getByRole('button', { name: /^My Groups$/ })).toBeVisible()
    await expect(menu.getByRole('button', { name: /^System Managed Groups$/ })).toBeVisible()
  })

  test('Columns dropdown opens listing toggleable column headers', async ({ page }) => {
    await page.goto('/user-management/groups', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Groups$/ })).toBeVisible({ timeout: 20_000 })

    // column-visibility-menu.tsx trigger reads "Columns".
    await page
      .getByRole('main')
      .getByRole('button', { name: /^Columns$/ })
      .first()
      .click()

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })

    // The Name column header is always present in the visibility list.
    await expect(menu.getByText('Name', { exact: true }).first()).toBeVisible()
  })
})

test.describe('user-management — member row actions (throwaway member)', () => {
  const memberRow = (page: Page, email: string) => page.getByRole('row', { name: new RegExp(email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })

  const openRowMenu = async (row: Locator, item: Locator) => {
    await expect(async () => {
      await row.getByTestId('member-actions-trigger').click()
      await expect(item).toBeVisible({ timeout: 2_000 })
    }).toPass({ timeout: 20_000 })
  }

  test('owner changes a throwaway member’s role via the Change Role dialog', async ({ page }) => {
    const { sharedOrgId, ownerEmail } = readManifest()
    const { email, displayName } = await seedThrowawayMember(sharedOrgId, ownerEmail.split('@')[1])

    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(displayName)
    const row = memberRow(page, email)
    await expect(row).toBeVisible({ timeout: 20_000 })

    const changeRoleItem = page.getByRole('menuitem', { name: /Change Base Role/ })
    await openRowMenu(row, changeRoleItem)
    await changeRoleItem.press('Enter')

    await expect(page.getByText('New role')).toBeVisible({ timeout: 10_000 })
  })

  test('owner removes a throwaway member from the org', async ({ page }) => {
    const { sharedOrgId, ownerEmail } = readManifest()
    const { email, displayName } = await seedThrowawayMember(sharedOrgId, ownerEmail.split('@')[1])

    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(displayName)
    const row = memberRow(page, email)
    await expect(row).toBeVisible({ timeout: 20_000 })

    const removeItem = page.getByText('Remove Member', { exact: true })
    await openRowMenu(row, removeItem)
    await removeItem.dispatchEvent('click')

    const confirmDelete = page.getByRole('alertdialog').getByRole('button', { name: /^Delete$/ })
    await expect(confirmDelete).toBeVisible({ timeout: 10_000 })
    await confirmDelete.dispatchEvent('click')

    await expect(page.getByText('Member deleted successfully').first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(email)).toHaveCount(0, { timeout: 15_000 })
  })
})
