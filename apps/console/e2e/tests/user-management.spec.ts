import { test, expect, readManifest } from '../fixtures/auth'
import { test as freshTest } from '@playwright/test'
import { type Page } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

const submitInvite = async (page: Page, recipients: string[]): Promise<void> => {
  await page.getByRole('button', { name: /^invite member$/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible({ timeout: 10_000 })

  const emailInput = dialog.getByRole('textbox').first()
  for (const recipient of recipients) {
    await emailInput.fill(recipient)
    await emailInput.press('Enter')
    await expect(dialog.getByText(recipient)).toBeVisible()
  }

  await dialog.getByRole('button', { name: /^invite$/i }).click()
  await expect(dialog).toBeHidden({ timeout: 15_000 })
}

const openInvitesTab = async (page: Page): Promise<void> => {
  await page.getByRole('tab', { name: /awaiting response/i }).click()
}

test.describe('user management — groups page', () => {
  test('/user-management/groups renders the Groups heading and Create button', async ({ page }) => {
    await page.goto('/user-management/groups')

    await expect(page.getByRole('heading', { level: 2, name: /^Groups$/ })).toBeVisible()
    await expect(
      page
        .getByRole('main')
        .getByRole('button', { name: /^create$/i })
        .first(),
    ).toBeVisible()
  })

  test('required validation — submitting Create Group with empty name shows inline error', async ({ page }) => {
    await page.goto('/user-management/groups')
    // CreateGroupDialog renders DialogTrigger > Button
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .first()
      .click()

    const dialog = page.getByRole('dialog', { name: /create a new group/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('button', { name: /^create group$/i }).click()

    await expect(dialog.getByText(/^Group name is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — create a group with name only, group appears in the groups table', async ({ page }) => {
    await page.goto('/user-management/groups')
    // CreateGroupDialog renders DialogTrigger > Button
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .first()
      .click()

    const dialog = page.getByRole('dialog', { name: /create a new group/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const groupName = `E2E Group ${Date.now().toString(36)}`
    await dialog.locator('input[placeholder="Group name"]').fill(groupName)

    await dialog.getByRole('button', { name: /^create group$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await page.getByPlaceholder('Search...').fill(groupName)

    await expect(page.getByRole('cell').filter({ hasText: groupName }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('user management — members page', () => {
  test('/user-management/members renders the Members heading and Invite member CTA', async ({ page }) => {
    await page.goto('/user-management/members')

    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^invite member$/i })).toBeVisible()
  })

  test('the freshly-onboarded owner is listed as a member of their own org', async ({ page }) => {
    const { ownerEmail } = readManifest()

    await page.goto('/user-management/members')

    await expect(page.getByRole('cell', { name: ownerEmail })).toBeVisible({ timeout: 15_000 })
  })

  test('invite sheet — PanelRightClose icon closes the sheet', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByLabel(/close detail sheet/i).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })

  test('invite sheet — Cancel button closes the sheet without inviting', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('button', { name: /^cancel$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })

  test('invite sheet — Invite button is disabled when no email chip is committed', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    await dialog.getByRole('textbox').first().fill('not-yet-committed@invitee.invalid')
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeDisabled()
  })

  test('invite sheet — committing the same email twice shows the duplicate-tag message', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const dupEmail = `e2e-dup-${Date.now().toString(36)}@invitee.invalid`

    const input = dialog.getByRole('textbox').first()
    await input.click()
    await input.pressSequentially(dupEmail)
    await input.press('Enter')

    await expect(dialog.getByText(dupEmail)).toBeVisible()

    // emblor leaves the committed text in the controlled input
    await input.press('ControlOrMeta+a')
    await input.pressSequentially(dupEmail)
    await input.press('Enter')

    await expect(dialog.getByText(/^This email is already added\.$/)).toBeVisible({ timeout: 5_000 })
  })

  test('invite sheet — typing comma after a valid email commits the chip', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteEmail = `e2e-comma-${Date.now().toString(36)}@invitee.invalid`

    const input = dialog.getByRole('textbox').first()
    await input.fill(inviteEmail)
    await input.press(',')

    await expect(dialog.getByText(inviteEmail)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeEnabled()
  })

  test('invite sheet — invalid email is rejected by validateTag and never commits', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.fill('definitely-not-an-email')
    await emailInput.press('Enter')

    await expect(dialog.getByText(/^Your email is invalid\.$/)).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeDisabled()
  })

  test('clicking Invite member opens the invite sheet', async ({ page }) => {
    await page.goto('/user-management/members')

    await page.getByRole('button', { name: /^invite member$/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — invite a single email at the default Member role, sheet closes on success', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteDomain = readManifest().ownerEmail.split('@')[1]
    const inviteEmail = `e2e-invitee-${Date.now().toString(36)}@${inviteDomain}`

    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.click()
    await emailInput.pressSequentially(inviteEmail)
    await emailInput.press('Enter')

    await expect(dialog.getByText(inviteEmail)).toBeVisible()

    await emailInput.press('ControlOrMeta+a')
    await emailInput.press('Delete')

    await dialog.getByRole('button', { name: /^invite$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })

  test('invite success — toast `Invite sent successfully` appears', async ({ page }) => {
    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteDomain = readManifest().ownerEmail.split('@')[1]
    const inviteEmail = `e2e-toast-${Date.now().toString(36)}@${inviteDomain}`
    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.click()
    await emailInput.pressSequentially(inviteEmail)
    await emailInput.press('Enter')

    await emailInput.press('ControlOrMeta+a')
    await emailInput.press('Delete')

    await dialog.getByRole('button', { name: /^invite$/i }).click()

    await expect(page.getByText(/^Invite sent successfully$/).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('user management — members table filter (shared org)', () => {
  test('Filter dropdown opens exposing the Providers and Role filter sections', async ({ page }) => {
    await page.goto('/user-management/members')
    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 15_000 })

    await page
      .getByRole('main')
      .getByRole('button', { name: /^Filter( \d+)?$/ })
      .first()
      .click()

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })

    await expect(menu.getByText('FILTER BY', { exact: true })).toBeVisible()
    await expect(menu.getByText('Providers', { exact: true })).toBeVisible()
    await expect(menu.getByText('Role', { exact: true })).toBeVisible()
  })

  test('Filter dropdown surfaces the Reset filters and View Results actions', async ({ page }) => {
    await page.goto('/user-management/members')
    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible({ timeout: 15_000 })

    await page
      .getByRole('main')
      .getByRole('button', { name: /^Filter( \d+)?$/ })
      .first()
      .click()

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible({ timeout: 10_000 })

    await expect(menu.getByRole('button', { name: /^Reset filters$/ })).toBeVisible()
    await expect(menu.getByRole('button', { name: /^View Results$/ })).toBeVisible()
  })
})

freshTest.describe('user management — fresh org members', () => {
  freshTest('Awaiting Response tab shows zero pending invites for a fresh org', async ({ page }) => {
    await seedLoggedInUser(page, 'um-empty-invites')

    await page.goto('/user-management/members')
    await openInvitesTab(page)

    await expect(page.getByRole('cell').filter({ hasText: /@/ })).toHaveCount(0, { timeout: 10_000 })
  })

  freshTest('member email is the only data row in a freshly-onboarded org', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-single-member')

    await page.goto('/user-management/members')

    await expect(page.getByRole('cell', { name: email })).toHaveCount(1, { timeout: 15_000 })
  })

  freshTest('default invite — pending row shows Member in the Role cell', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-default-role')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-default-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row.getByText(/^Member$/)).toBeVisible()
  })

  freshTest('invite at Admin role — pending row shows Admin in the Role cell', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-admin-invite')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-admin-${Date.now().toString(36)}@${inviteDomain}`

    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.fill(inviteEmail)
    await emailInput.press('Enter')
    await expect(dialog.getByText(inviteEmail)).toBeVisible()

    await dialog
      .getByRole('combobox')
      .filter({ hasText: /^Member$/ })
      .click()
    await page.getByRole('option', { name: /^Admin$/ }).click()

    await dialog.getByRole('button', { name: /^invite$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    await openInvitesTab(page)

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row).toBeVisible({ timeout: 15_000 })
    await expect(row.getByText(/^Admin$/)).toBeVisible()
  })

  freshTest('Awaiting Response tab shows a "1" badge after a single invite', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-tab-badge')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-badge-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await expect(page.getByRole('tab', { name: /awaiting response\s*1/i })).toBeVisible({ timeout: 15_000 })
  })

  freshTest('after inviting, the pending row appears in the Awaiting Response tab with the recipient and Invitation Sent status', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-pending-row')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-pending-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    await expect(page.getByRole('cell').filter({ hasText: inviteEmail }).first()).toBeVisible({ timeout: 15_000 })

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row.getByText(/^Invitation Sent$/)).toBeVisible()
  })

  freshTest('multi-email invite — two committed chips create two pending rows', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-multi-invite')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const stamp = Date.now().toString(36)
    const first = `e2e-multi-a-${stamp}@${inviteDomain}`
    const second = `e2e-multi-b-${stamp}@${inviteDomain}`

    await submitInvite(page, [first, second])

    await openInvitesTab(page)

    await expect(page.getByRole('cell').filter({ hasText: first }).first()).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('cell').filter({ hasText: second }).first()).toBeVisible({ timeout: 15_000 })
  })

  freshTest('resend invite — pending row resend triggers the success toast', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-resend-invite')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-resend-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByTestId('invite-actions-trigger').click()
    await page.getByRole('menuitem', { name: /resend invite/i }).click()

    await expect(page.getByText(/^Invite resent successfully$/).first()).toBeVisible({ timeout: 15_000 })
  })

  freshTest('cancel invite — deleting a pending row removes it from the table', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-cancel-invite')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-cancel-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.getByTestId('invite-actions-trigger').click()

    await page.getByRole('menuitem', { name: /delete invite/i }).click()

    await expect(row).toHaveCount(0, { timeout: 15_000 })
  })
})
