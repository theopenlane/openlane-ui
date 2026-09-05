import type { Locator, Page } from '@playwright/test'

import { test, expect, readManifest } from '../fixtures/auth'
import { confirmDestructiveDialog } from '../utils/menu'
import { RUN_ID } from '../utils/constants'
import { loginViaApi, createGroup, getSelf, addOrgMember, memberSeesOrg, roleOf, type ApiSession, getOwnerApi } from '../utils/api'
import { expectMutationOk } from '../utils/mutations'
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
  ownerApi = await getOwnerApi()
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
      .getByRole('button', { name: /^Filter( \d+)?$/ })
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

  // Nesting a toPass inside another starves the outer budget: the inner loop can
  // burn it on a single attempt. Keep one retry level and cap every step, so the
  // outer budget buys whole attempts rather than fractions of one.
  const openRowMenuItem = async (row: Locator, item: Locator) => {
    if (!(await item.isVisible().catch(() => false))) {
      await row.getByTestId('member-actions-trigger').click({ timeout: 5_000 })
    }
    await expect(item).toBeVisible({ timeout: 5_000 })
  }

  test('owner changes a throwaway member’s role via the Change Role dialog', async ({ page }) => {
    const { sharedOrgId, ownerEmail } = readManifest()
    const { email, displayName } = await seedThrowawayMember(sharedOrgId, ownerEmail.split('@')[1])

    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(displayName)
    const row = memberRow(page, email)
    await expect(row).toBeVisible({ timeout: 20_000 })

    const changeRoleItem = page.getByRole('menuitem', { name: /Change Base Role/ })

    await expect(async () => {
      await openRowMenuItem(row, changeRoleItem)
      await changeRoleItem.click({ timeout: 5_000 })
      await expect(page.getByText('New role')).toBeVisible({ timeout: 5_000 })
    }).toPass({ timeout: 45_000 })

    const dialog = page.getByRole('alertdialog')
    await dialog.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Admin', exact: true }).click()

    await expectMutationOk(page, 'UpdateUserRoleInOrg', async () => {
      await dialog.getByRole('button', { name: /^Change Role$/ }).click()
    })

    await expect(page.getByText('Role changed successfully')).toBeVisible({ timeout: 30_000 })
    await expect.poll(async () => roleOf(ownerApi, sharedOrgId, email), { timeout: 60_000 }).toBe('ADMIN')
  })

  test('owner removes a throwaway member from the org', async ({ page }) => {
    const { sharedOrgId, ownerEmail } = readManifest()
    const { email, displayName } = await seedThrowawayMember(sharedOrgId, ownerEmail.split('@')[1])

    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await page.getByPlaceholder('Search').fill(displayName)
    const row = memberRow(page, email)
    await expect(row).toBeVisible({ timeout: 20_000 })

    // Confirming has to sit inside the retry cycle: a refetch that lands between
    // the dialog opening and the confirm click unmounts the dialog, which used to
    // fail hard. Re-entering is safe because the row check short-circuits once the
    // member is actually gone.
    const removeItem = page.getByText('Remove Member', { exact: true })
    await expect(async () => {
      if ((await row.count()) === 0) return
      await openRowMenuItem(row, removeItem)
      await removeItem.dispatchEvent('click')
      await expect(page.getByRole('alertdialog')).toBeVisible({ timeout: 5_000 })
      await confirmDestructiveDialog(page)
      await expect(row).toHaveCount(0, { timeout: 10_000 })
    }).toPass({ timeout: 60_000 })

    await expect(page.getByText(email)).toHaveCount(0, { timeout: 30_000 })
  })
})

/**
 * ISS-2428 — pressing Tab in the invite email field committed a second chip for
 * an address already in the list. Both call sites now share isDuplicateEmail /
 * dedupeEmails (unit-tested in lib/validators.test.ts), the input surfaces a
 * "This email is already added." message, and members-invite-sheet.tsx disables
 * Invite while the input is in an invalid state.
 *
 * Dialog-only: no invite is ever submitted, so the shared org gains no members.
 */
test.describe('user-management — duplicate invite emails (ISS-2428)', () => {
  const openInviteSheet = async (page: Page) => {
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })
    return dialog
  }

  test('Tab does not add a second chip for an address already in the list', async ({ page }) => {
    test.slow()
    const dialog = await openInviteSheet(page)
    const email = `dupe-${Date.now().toString(36)}@e2e.invalid`

    const input = dialog.getByRole('textbox').first()
    await input.fill(email)
    await input.press('Enter')
    await expect(dialog.getByText(email)).toHaveCount(1, { timeout: 10_000 })

    // The reported bug: Tab re-committed the same address as a new chip.
    await input.fill(email)
    await input.press('Tab')

    await expect(dialog.getByText(email)).toHaveCount(1)
    await expect(dialog.getByText('This email is already added.')).toBeVisible({ timeout: 10_000 })
  })

  test('a case-differing duplicate is rejected too', async ({ page }) => {
    test.slow()
    const dialog = await openInviteSheet(page)
    const email = `case-${Date.now().toString(36)}@e2e.invalid`

    const input = dialog.getByRole('textbox').first()
    await input.fill(email)
    await input.press('Enter')
    await expect(dialog.getByText(email)).toHaveCount(1, { timeout: 10_000 })

    await input.fill(email.toUpperCase())
    await input.press('Enter')

    await expect(dialog.getByText('This email is already added.')).toBeVisible({ timeout: 10_000 })
  })

  test('the Invite button is disabled while the email input is invalid', async ({ page }) => {
    test.slow()
    const dialog = await openInviteSheet(page)

    const input = dialog.getByRole('textbox').first()
    await input.fill('not-an-email')
    await input.press('Enter')

    await expect(dialog.getByText('Your email is invalid.')).toBeVisible({ timeout: 10_000 })
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeDisabled()
  })
})

/**
 * #2132 — AUDITOR became assignable from the members table. It had been filtered
 * out of ASSIGNABLE_BASE_ROLES alongside OWNER, so audit access could not be
 * granted through the UI at all. The same commit narrowed SSO_EXEMPT_ROLES to
 * OWNER only, so auditors are no longer SSO-exempt.
 *
 * Menu-OPEN only: no member's role is changed.
 */
test.describe('user-management — auditor is assignable (#2132)', () => {
  test('the invite role picker offers Auditor', async ({ page }) => {
    test.slow()
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 15_000 })

    // members-invite-sheet.tsx renders a role select; Auditor must be offered.
    const roleSelect = dialog.getByRole('combobox').first()
    await expect(roleSelect).toBeVisible({ timeout: 15_000 })
    await roleSelect.click()

    await expect(page.getByRole('option', { name: /Auditor/i })).toBeVisible({ timeout: 15_000 })
  })
})

/**
 * #2081 — 2FA can now be enforced PER USER, independently of the org-wide
 * setting. The member row menu offers "Mark as 2FA Enforced" (which opens a
 * dialog asking for a reason) or "Remove 2FA Enforcement" when already set.
 *
 * Menu-OPEN only: enforcing 2FA on a seeded member would force an MFA
 * enrolment and break that fixture's logins.
 */
test.describe('user-management — per-user 2FA enforcement (#2081)', () => {
  test('the member actions menu offers per-user 2FA enforcement', async ({ page }) => {
    test.slow()
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 30_000 })

    // member-actions.tsx hangs the row actions off an icon-only DropdownMenu
    // trigger with no accessible name, and the icon is not wrapped in a
    // <button> — click the icon itself and let the event reach the trigger.
    //
    // Not every row offers the 2FA entry (the signed-in owner cannot enforce it
    // on themselves), so walk the rows until one does.
    const triggers = page.locator('tbody .lucide-ellipsis')
    await expect(triggers.first()).toBeVisible({ timeout: 30_000 })

    const entry = page.getByText(/(Mark as 2FA Enforced|Remove 2FA Enforcement)/)
    const rowCount = await triggers.count()
    let found = false

    for (let i = 0; i < rowCount && !found; i++) {
      await triggers.nth(i).click()
      found = await entry.isVisible({ timeout: 5_000 }).catch(() => false)
      if (!found) await page.keyboard.press('Escape')
    }

    expect(found).toBe(true)
  })

  test('marking a member 2FA-enforced asks for a reason before applying', async ({ page }) => {
    test.slow()
    await page.goto('/user-management/members', { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 30_000 })

    const triggers = page.locator('tbody .lucide-ellipsis')
    await expect(triggers.first()).toBeVisible({ timeout: 30_000 })

    const mark = page.getByText(/Mark as 2FA Enforced/).first()
    const dialog = page.getByRole('dialog').or(page.getByRole('alertdialog')).first()
    const reason = dialog.getByText(/will be required to configure multi-factor authentication/)
    let offered = false

    await expect(async () => {
      if (await reason.isVisible().catch(() => false)) return
      await page.keyboard.press('Escape')

      const rowCount = await triggers.count()
      expect(rowCount, 'the members table rendered no row menus').toBeGreaterThan(0)

      for (let i = 0; i < rowCount; i++) {
        await triggers.nth(i).click({ timeout: 5_000 })
        if (!(await mark.isVisible({ timeout: 2_000 }).catch(() => false))) {
          await page.keyboard.press('Escape')
          continue
        }
        offered = true
        await mark.click({ timeout: 5_000 })
        await expect(reason).toBeVisible({ timeout: 10_000 })
        return
      }
    }).toPass({ timeout: 90_000 })

    test.skip(!offered, 'no member offers the Mark as 2FA Enforced action')
    await expect(reason).toBeVisible({ timeout: 10_000 })
  })
})
