'use client'

import { MoreHorizontal, ShieldOff, ShieldPlus, Trash2, UserRoundPen, UsersRound } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import React, { useState } from 'react'
import { Form, FormControl, FormField, FormItem } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useForm, useWatch } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z, type infer as zInfer } from 'zod'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { useRemoveUserFromOrg, useUpdateUserRoleInOrg } from '@/lib/graphql-hooks/member'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canEdit } from '@/lib/authz/utils.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { TransferOwnershipDialog } from '@/components/pages/protected/organization-settings/general-settings/transfer-ownership-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { toHumanLabel } from '@/utils/strings'
import { RoleInfoSlideOut } from '@/components/shared/role-info-slide-out/role-info-slide-out'
import { UserRoleIconMapper } from '@/components/shared/enum-mapper/user-role-enum'
import { ManageAdditionalRolesDialog } from '@/components/shared/organization-roles/manage-additional-roles-dialog'
import { SuperAdminRoleWarning } from '@/components/shared/organization-roles/super-admin-role-warning'
import { ASSIGNABLE_BASE_ROLES } from './assignable-base-roles'
import { invalidateMembershipQueries } from '@/lib/graphql-hooks/membership-cache'

type MemberActionsProps = {
  memberId: string
  memberUserId: string
  memberRole: OrgMembershipRole
  memberName: string
  additionalRoles?: string[] | null
  memberSSOExempt?: boolean
}

const ICON_SIZE = 12

export const MemberActions = ({ memberId, memberUserId, memberRole, memberName, additionalRoles, memberSSOExempt = false }: MemberActionsProps) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [showChangeRole, setShowChangeRole] = useState(false)
  const [showManageRoles, setShowManageRoles] = useState(false)
  const [showSSOExempt, setShowSSOExempt] = useState(false)
  const [exemptReason, setExemptReason] = useState('')
  const hasFullAccess = memberRole === OrgMembershipRole.OWNER || memberRole === OrgMembershipRole.SUPER_ADMIN
  const { changeRoleGrid } = pageStyles()
  const { mutateAsync: deleteMember } = useRemoveUserFromOrg()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const queryClient = useQueryClient()
  const { errorNotification, successNotification } = useNotification()
  const { data: userData } = useGetCurrentUser(userId)
  const { data } = useOrganizationRoles()

  const handleDeleteMember = async () => {
    try {
      await deleteMember({ deleteOrgMembershipId: memberId })
      successNotification({
        title: 'Member deleted successfully',
      })

      invalidateMembershipQueries(queryClient)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const { mutateAsync: updateMember } = useUpdateUserRoleInOrg()
  const handleChangeRole = async (role: OrgMembershipRole) => {
    try {
      await updateMember({ updateOrgMemberId: memberId, input: { role: role } })
      successNotification({
        title: 'Role changed successfully',
        variant: 'success',
      })

      invalidateMembershipQueries(queryClient)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleToggleSSOExempt = async () => {
    const granting = !memberSSOExempt
    try {
      await updateMember({
        updateOrgMemberId: memberId,
        input: granting ? { ssoExempt: true, ssoExemptReason: exemptReason.trim() || undefined } : { ssoExempt: false, clearSSOExemptReason: true },
      })
      successNotification({
        title: granting ? 'Member marked as SSO exempt' : 'SSO exemption removed',
        variant: 'success',
      })

      invalidateMembershipQueries(queryClient)

      setShowSSOExempt(false)
      setExemptReason('')
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(error),
      })
    }
  }

  const formSchema = z.object({
    role: z
      .nativeEnum(OrgMembershipRole, {
        errorMap: () => ({ message: 'Invalid role' }),
      })
      .default(OrgMembershipRole.MEMBER),
  })

  type FormData = zInfer<typeof formSchema>

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as Resolver<FormData>,
    defaultValues: {
      role: OrgMembershipRole.MEMBER,
    },
  })

  const { control, handleSubmit } = form
  const selectedRole = useWatch({ control, name: 'role' })

  if (memberUserId === userData?.user.id && memberRole !== OrgMembershipRole.OWNER) {
    //CANT EDIT YOURSELF IF NOT OWNER
    return null
  }

  if (!canEdit(data?.roles)) {
    //MEMBERS CANT EDIT ANYONE
    return null
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="-mr-2">
            <MoreHorizontal className="h-4 w-4 text-brand" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {memberRole === OrgMembershipRole.OWNER && memberUserId === userData?.user.id ? (
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <TransferOwnershipDialog
                  trigger={
                    <div className="flex gap-2 items-center">
                      <UsersRound width={ICON_SIZE} /> Transfer Ownership
                    </div>
                  }
                />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          ) : (
            <>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault()
                  }}
                >
                  <div className="flex" onClick={() => setShowDeleteConfirmation(true)}>
                    <Trash2 width={ICON_SIZE} /> &nbsp; Remove Member
                  </div>
                  <ConfirmationDialog
                    open={showDeleteConfirmation}
                    onOpenChange={setShowDeleteConfirmation}
                    onConfirm={handleDeleteMember}
                    title={`Delete Member`}
                    description={
                      <>
                        This action cannot be undone. This will permanently remove <b>{memberName}</b> from the organization.
                      </>
                    }
                  />
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setShowChangeRole(true)}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <UserRoundPen width={ICON_SIZE} /> &nbsp; Change Base Role
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={hasFullAccess ? (e) => e.preventDefault() : () => setShowManageRoles(true)}
                  className={hasFullAccess ? 'cursor-not-allowed opacity-50' : undefined}
                  title={hasFullAccess ? "Owners and super admins already have full access, so additional roles aren't needed." : undefined}
                >
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <ShieldPlus width={ICON_SIZE} /> &nbsp; Manage Additional Roles
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => (memberSSOExempt ? handleToggleSSOExempt() : setShowSSOExempt(true))}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    {memberSSOExempt ? <ShieldOff width={ICON_SIZE} /> : <ShieldPlus width={ICON_SIZE} />} &nbsp; {memberSSOExempt ? 'Remove SSO Exemption' : 'Mark as SSO Exempt'}
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={showChangeRole} onOpenChange={setShowChangeRole}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Role</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">Change the role of the member in the organization.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className={changeRoleGrid()}>
            <span className="text-muted-foreground">Member</span>
            <span className="font-medium text-text-header">{memberName}</span>
            <span className="text-muted-foreground">Current role</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-text-header">
              <span className="text-muted-foreground">{UserRoleIconMapper[memberRole]}</span>
              {toHumanLabel(memberRole)}
            </span>
            <span className="text-muted-foreground">New role</span>
            <Form {...form}>
              <FormField
                name="role"
                control={control}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSIGNABLE_BASE_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {toHumanLabel(role)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />
            </Form>
          </div>
          {selectedRole === OrgMembershipRole.SUPER_ADMIN && <SuperAdminRoleWarning />}
          <RoleInfoSlideOut />
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <CancelButton />
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="primary" onClick={handleSubmit((data) => handleChangeRole(data.role))}>
                Change Role
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ManageAdditionalRolesDialog
        open={showManageRoles}
        onOpenChange={setShowManageRoles}
        subjectType="user"
        subjectIds={[memberUserId]}
        subjectName={memberName}
        currentRoleNames={additionalRoles ?? []}
      />
      <AlertDialog open={showSSOExempt} onOpenChange={setShowSSOExempt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as SSO Exempt</AlertDialogTitle>
            <AlertDialogDescription>
              <b>{memberName}</b> will be allowed to sign in without the organization&apos;s SSO directory, even when SSO is enforced. Multi-factor authentication still applies.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm text-muted-foreground">Reason (optional)</span>
            <Input value={exemptReason} onChange={(e) => setExemptReason(e.target.value)} placeholder="External auditor" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <CancelButton />
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="primary" onClick={handleToggleSSOExempt}>
                Mark exempt
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
