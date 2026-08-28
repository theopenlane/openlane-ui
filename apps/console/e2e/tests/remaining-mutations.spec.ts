import { test, expect, readManifest } from '../fixtures/auth'
import { uniqueName, uniqueRef } from '../utils/unique'
import { confirmDestructive, expectMutationOk } from '../utils/mutations'
import { createControl, createGroup, createSubcontrol, getOwnerApi, getSelf, addOrgMember, loginViaApi, gql, type ApiSession } from '../utils/api'
import { registerAndVerify } from '../utils/registerUser'
import { RUN_ID } from '../utils/constants'

let ownerApi: ApiSession

test.beforeAll(async () => {
  ownerApi = await getOwnerApi()
})

const seedGroupWithMember = async (groupName: string): Promise<{ groupId: string; memberName: string }> => {
  const { sharedOrgId, ownerEmail } = readManifest()
  const groupId = await createGroup(ownerApi, groupName)

  const localPart = `e2e-groupmember-${RUN_ID}-${Date.now().toString(36)}`
  const email = `${localPart}@${ownerEmail.split('@')[1]}`
  await registerAndVerify({ email })
  const memberApi = await loginViaApi(email)
  const { id: userId } = await getSelf(memberApi)
  await addOrgMember(ownerApi, sharedOrgId, userId, 'MEMBER')

  await gql(ownerApi, `mutation($input: CreateGroupMembershipInput!){ createGroupMembership(input: $input){ groupMembership { id } } }`, {
    input: { groupID: groupId, userID: userId, role: 'MEMBER' },
  })

  return { groupId, memberName: localPart }
}

test.describe('group memberships', () => {
  test('a group member role can be changed and the member removed', async ({ page }) => {
    test.slow()
    const { groupId, memberName } = await seedGroupWithMember(uniqueName('E2E GroupMembers'))

    await page.goto(`/user-management/groups?id=${groupId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    const row = page.getByRole('row').filter({ hasText: memberName }).first()
    await expect(row).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'UpdateGroupMembership', async () => {
      await row.getByRole('combobox').first().click()
      await page.getByRole('option', { name: 'Admin', exact: true }).click()
    })
    await expect(page.getByText('Group membership updated successfully.').first()).toBeVisible({ timeout: 30_000 })

    await expectMutationOk(page, 'DeleteGroupMembership', async () => {
      await page.getByRole('button', { name: `Remove ${memberName} from group` }).click()
    })
    await expect(page.getByText('Group membership deleted successfully.').first()).toBeVisible({ timeout: 30_000 })
  })
})

test.describe('subcontrols', () => {
  test('a subcontrol is deleted from its detail page', async ({ page }) => {
    test.slow()
    const controlId = await createControl(ownerApi, uniqueRef('E2E-SUBDEL'))
    const subRefCode = uniqueRef('E2E-SUB')
    const subcontrolId = await createSubcontrol(ownerApi, subRefCode, controlId)

    await page.goto(`/controls/${controlId}/${subcontrolId}`, { waitUntil: 'domcontentloaded', timeout: 180_000 })
    await expect(page.getByRole('heading', { level: 1, name: subRefCode })).toBeVisible({ timeout: 30_000 })

    await page.getByTestId('control-actions-menu').click()
    await page.getByTestId('control-delete-button').click()
    await confirmDestructive(page, 'DeleteSubcontrol')

    await page.waitForURL(new RegExp(`/controls/${controlId}$`), { timeout: 60_000 })
  })
})
