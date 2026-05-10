import { expect, type Page, test } from '@playwright/test'

import { seedLoggedInUser } from '../utils/seedUser'

// Submits an invite for `recipient` from /user-management/members and
// waits for the sheet to close. Caller is responsible for navigating to
// the members page first (and being logged in as an org owner).
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

// Switch to the "Awaiting Response" tab and wait for the invites table
// to settle. The badge next to the tab is the totalCount surfaced by
// the GetInvites query, so we wait for it to be at least the expected
// number of newly-created invites.
const openInvitesTab = async (page: Page): Promise<void> => {
  await page.getByRole('tab', { name: /awaiting response/i }).click()
}

test.describe('user management — groups page', () => {
  test('/user-management/groups renders the Groups heading and Create button', async ({ page }) => {
    await seedLoggedInUser(page, 'um-groups-list')

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
    await seedLoggedInUser(page, 'um-group-required')

    await page.goto('/user-management/groups')
    // CreateGroupDialog renders DialogTrigger > Button — both expose
    // role=button with accessible name "Create" (button-in-button), so
    // strict mode finds two matches inside <main>. The outer DialogTrigger
    // is the trigger we want; it's first in DOM order.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .first()
      .click()

    const dialog = page.getByRole('dialog', { name: /create a new group/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // groupName is z.string().min(1, 'Group name is required'). Submitting
    // without filling surfaces the message under the input.
    await dialog.getByRole('button', { name: /^create group$/i }).click()

    await expect(dialog.getByText(/^Group name is required$/)).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — create a group with name only, group appears in the groups table', async ({ page }) => {
    await seedLoggedInUser(page, 'um-group-create')

    await page.goto('/user-management/groups')
    // CreateGroupDialog renders DialogTrigger > Button — both expose
    // role=button with accessible name "Create" (button-in-button), so
    // strict mode finds two matches inside <main>. The outer DialogTrigger
    // is the trigger we want; it's first in DOM order.
    await page
      .getByRole('main')
      .getByRole('button', { name: /^create$/i })
      .first()
      .click()

    const dialog = page.getByRole('dialog', { name: /create a new group/i })
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const groupName = `E2E Group ${Date.now().toString(36)}`
    // groupName field is wired through react-hook-form's Controller and
    // is the first input rendered in the dialog. Visibility defaults to
    // Public; admins defaults to "You" (the seeded user).
    await dialog.locator('input[placeholder="Group name"]').fill(groupName)

    await dialog.getByRole('button', { name: /^create group$/i }).click()

    // Successful create closes the dialog (setIsOpen(false)) and fires
    // a success toast — the dialog disappears from the DOM tree.
    await expect(dialog).toBeHidden({ timeout: 15_000 })

    // Default tab is the table view; the new group shows in a name cell.
    await expect(page.getByRole('cell').filter({ hasText: groupName }).first()).toBeVisible({ timeout: 15_000 })
  })
})

test.describe('user management — members page', () => {
  test('/user-management/members renders the Members heading and Invite member CTA', async ({ page }) => {
    await seedLoggedInUser(page, 'um-list')

    await page.goto('/user-management/members')

    // PageHeading from @repo/ui renders the heading as an <h2>.
    await expect(page.getByRole('heading', { level: 2, name: /^Members$/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /^invite member$/i })).toBeVisible()
  })

  test('Awaiting Response tab shows zero pending invites for a fresh org', async ({ page }) => {
    await seedLoggedInUser(page, 'um-empty-invites')

    await page.goto('/user-management/members')
    await openInvitesTab(page)

    // No invitee email cells should appear. Only the header row with
    // "Invited user" / "Role" / "Status" / "Sent" / "Resend Attempts" /
    // "Action" headers exists in the table.
    await expect(page.getByRole('cell').filter({ hasText: /@/ })).toHaveCount(0, { timeout: 10_000 })
  })

  test('member email is the only data row in a freshly-onboarded org', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-single-member')

    await page.goto('/user-management/members')

    // Members tab is the default. Cells with the seeded user's email
    // are the only data cells in the email column. Cells with @ in
    // their text from any other org member would surface here.
    await expect(page.getByRole('cell', { name: email })).toHaveCount(1, { timeout: 15_000 })
  })

  test('the freshly-onboarded owner is listed as a member of their own org', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-self')

    await page.goto('/user-management/members')

    // The members table should have the owner's email in a cell.
    await expect(page.getByRole('cell', { name: email })).toBeVisible({ timeout: 15_000 })
  })

  test('invite sheet — PanelRightClose icon closes the sheet', async ({ page }) => {
    await seedLoggedInUser(page, 'um-invite-x-close')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // The icon has aria-label="Close detail sheet" (set in the sheet
    // header) — clickable PanelRightClose lucide icon.
    await dialog.getByLabel(/close detail sheet/i).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })

  test('invite sheet — Cancel button closes the sheet without inviting', async ({ page }) => {
    await seedLoggedInUser(page, 'um-invite-cancel-btn')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // The sheet header has a CancelButton (default title "Cancel").
    await dialog.getByRole('button', { name: /^cancel$/i }).click()

    await expect(dialog).toBeHidden({ timeout: 10_000 })
  })

  test('invite sheet — Invite button is disabled when no email chip is committed', async ({ page }) => {
    await seedLoggedInUser(page, 'um-invite-disabled')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Type but don't press Enter — TagInput doesn't commit the chip
    // until a delimiter (Enter / comma / Tab / space). The submit
    // button has `disabled={emails.length === 0}`.
    await dialog.getByRole('textbox').first().fill('not-yet-committed@invitee.invalid')
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeDisabled()
  })

  test('invite sheet — committing the same email twice shows the duplicate-tag message', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-invite-dup')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteDomain = email.split('@')[1]
    const dupEmail = `e2e-dup-${Date.now().toString(36)}@${inviteDomain}`

    const input = dialog.getByRole('textbox').first()
    await input.fill(dupEmail)
    await input.press('Enter')
    await expect(dialog.getByText(dupEmail)).toBeVisible()

    // Second commit of the same email — validateTag returns false and
    // sets invalidEmail = "This email is already added.".
    await input.fill(dupEmail)
    await input.press('Enter')

    await expect(dialog.getByText(/^This email is already added\.$/)).toBeVisible({ timeout: 5_000 })
  })

  test('invite sheet — typing comma after a valid email commits the chip', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-invite-comma')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-comma-${Date.now().toString(36)}@${inviteDomain}`

    // emblor's TagInput delimiterList accepts ' ', ',', 'Enter', 'Tab'.
    // Typing the email + comma should commit the chip same as Enter.
    const input = dialog.getByRole('textbox').first()
    await input.fill(inviteEmail)
    await input.press(',')

    await expect(dialog.getByText(inviteEmail)).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeEnabled()
  })

  test('invite sheet — invalid email is rejected by validateTag and never commits', async ({ page }) => {
    await seedLoggedInUser(page, 'um-invite-invalid')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // Type something that fails isValidEmail and press Enter. The
    // TagInput's validateTag returns false → no chip is added → the
    // form's emails array stays empty → Invite stays disabled. The
    // sheet also shows the inline message "Your email is invalid.".
    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.fill('definitely-not-an-email')
    await emailInput.press('Enter')

    await expect(dialog.getByText(/^Your email is invalid\.$/)).toBeVisible({ timeout: 5_000 })
    await expect(dialog.getByRole('button', { name: /^invite$/i })).toBeDisabled()
  })

  test('clicking Invite member opens the invite sheet', async ({ page }) => {
    await seedLoggedInUser(page, 'um-invite')

    await page.goto('/user-management/members')

    await page.getByRole('button', { name: /^invite member$/i }).click()

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10_000 })
  })

  test('happy path — invite a single email at the default Member role, sheet closes on success', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-send-invite')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    // The emails field is a TagInput — typing alone doesn't commit.
    // delimiterList accepts [' ', ',', 'Enter', 'Tab'] (see
    // packages/ui/src/tag-input/tag-input.tsx). Press Enter to commit
    // the email as a chip; without a committed chip the Invite button
    // stays disabled (emails.length === 0 guard on the submit button).
    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-invitee-${Date.now().toString(36)}@${inviteDomain}`

    // The TagInput input is the first textbox in the sheet — the only
    // other text input ("Search...") is for the groups picker further
    // down. The Email <p> next to it is not a <label>, so getByLabel
    // can't reach the input directly.
    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.fill(inviteEmail)
    await emailInput.press('Enter')

    await expect(dialog.getByText(inviteEmail)).toBeVisible()

    // Default role is Member — no role-select interaction needed. The
    // header "Invite" button is the submit (the trigger that opened
    // the sheet reads "Invite member" so the regex anchors avoid
    // matching it).
    await dialog.getByRole('button', { name: /^invite$/i }).click()

    // onSubmit success path calls handleClose() which closes the sheet.
    await expect(dialog).toBeHidden({ timeout: 15_000 })
  })

  test('invite success — toast `Invite sent successfully` appears', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-invite-toast')

    await page.goto('/user-management/members')
    await page.getByRole('button', { name: /^invite member$/i }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 10_000 })

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-toast-${Date.now().toString(36)}@${inviteDomain}`
    const emailInput = dialog.getByRole('textbox').first()
    await emailInput.fill(inviteEmail)
    await emailInput.press('Enter')

    await dialog.getByRole('button', { name: /^invite$/i }).click()

    // members-invite-sheet.tsx fires successNotification with title
    // "Invite sent successfully" (singular for emails.length === 1).
    await expect(page.getByText(/^Invite sent successfully$/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('default invite — pending row shows Member in the Role cell', async ({ page }) => {
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

  test('invite at Admin role — pending row shows Admin in the Role cell', async ({ page }) => {
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

    // The sheet contains two role=combobox triggers: the Role select
    // (defaultValue "Member") and the groups-table pagination select
    // (rows-per-page "10"). Filter by the visible label text to grab
    // the Role select specifically.
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
    // Role column renders the role formatted as `key.charAt(0).toUpperCase()
    // + key.slice(1).toLowerCase()` → "Admin" for ADMIN.
    await expect(row.getByText(/^Admin$/)).toBeVisible()
  })

  test('Awaiting Response tab shows a "1" badge after a single invite', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-tab-badge')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-badge-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    // members-page.tsx renders the count next to "Awaiting Response"
    // when numInvites > 0. The tab's accessible name becomes
    // "Awaiting Response 1" — match the suffix.
    await expect(page.getByRole('tab', { name: /awaiting response\s*1/i })).toBeVisible({ timeout: 15_000 })
  })

  test('after inviting, the pending row appears in the Awaiting Response tab with the recipient and Invitation Sent status', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-pending-row')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-pending-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    // The recipient is rendered inside the first column cell along with
    // a copy icon. Match by the email substring.
    await expect(page.getByRole('cell').filter({ hasText: inviteEmail }).first()).toBeVisible({ timeout: 15_000 })

    // Status column shows getEnumLabel('INVITATION_SENT') → "Invitation Sent".
    // Scope to the row that contains the recipient so multiple invites
    // in the same suite don't collide on the status text.
    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row.getByText(/^Invitation Sent$/)).toBeVisible()
  })

  test('multi-email invite — two committed chips create two pending rows', async ({ page }) => {
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

  test('resend invite — pending row resend triggers the success toast', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-resend-invite')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-resend-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row).toBeVisible({ timeout: 15_000 })

    await row.locator('.lucide-ellipsis-vertical').click()
    await page.getByRole('menuitem', { name: /resend invite/i }).click()

    // The InviteActions component fires successNotification with title
    // "Invite resent successfully" on success — Toaster renders this
    // via Radix Toast; the title is plain text inside the toast region.
    await expect(page.getByText(/^Invite resent successfully$/).first()).toBeVisible({ timeout: 15_000 })
  })

  test('cancel invite — deleting a pending row removes it from the table', async ({ page }) => {
    const { email } = await seedLoggedInUser(page, 'um-cancel-invite')

    await page.goto('/user-management/members')

    const inviteDomain = email.split('@')[1]
    const inviteEmail = `e2e-cancel-${Date.now().toString(36)}@${inviteDomain}`
    await submitInvite(page, [inviteEmail])

    await openInvitesTab(page)

    const row = page.getByRole('row').filter({ hasText: inviteEmail })
    await expect(row).toBeVisible({ timeout: 15_000 })

    // The row's action cell is a MoreVertical icon trigger that opens a
    // DropdownMenu. The DropdownMenuTrigger uses asChild on a <div>,
    // which Radix doesn't expose as role=button. Click the lucide icon
    // directly — note `MoreVertical` is aliased to `EllipsisVertical`
    // in lucide-react, so the rendered class is `lucide-ellipsis-vertical`.
    await row.locator('.lucide-ellipsis-vertical').click()

    await page.getByRole('menuitem', { name: /delete invite/i }).click()

    // queryClient.invalidateQueries refetches the invites list; the
    // canceled row should disappear.
    await expect(row).toHaveCount(0, { timeout: 15_000 })
  })
})
