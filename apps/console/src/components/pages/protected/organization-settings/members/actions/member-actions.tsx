'use client'

import { MoreVertical, Trash2, UserRoundPen, UsersRound } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@repo/ui/alert-dialog'
import { Button } from '@repo/ui/button'
import React, { useState } from 'react'
import { Form, FormControl, FormField, FormItem } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { useRemoveUserFromOrg, useUpdateUserRoleInOrg } from '@/lib/graphql-hooks/members'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { canEdit } from '@/lib/authz/utils.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { TransferOwnershipDialog } from '../../general-settings/transfer-ownership-dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type MemberActionsProps = {
  memberId: string
  memberUserId: string
  memberRole: OrgMembershipRole
  memberName: string
}

const ICON_SIZE = 12

export const MemberActions = ({ memberId, memberUserId, memberRole, memberName }: MemberActionsProps) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { actionIcon, roleRow } = pageStyles()
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

      queryClient.invalidateQueries({
        predicate: (query) => ['memberships', 'organizationsWithMembers', 'groups'].includes(query.queryKey[0] as string),
      })
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

      queryClient.invalidateQueries({
        predicate: (query) => ['memberships', 'organizationsWithMembers', 'groups'].includes(query.queryKey[0] as string),
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
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

  if (memberUserId === userData?.user.id && memberRole !== OrgMembershipRole.OWNER) {
    //CANT EDIT YOURSELF IF NOT OWNER
    return null
  }

  if (!canEdit(data?.roles)) {
    //MEMBERS CANT EDIT ANYONE
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center justify-center border border-solid rounded-md w-8 h-8 text-brand-100 hover:bg-brand-50 cursor-pointer">
          <MoreVertical className={actionIcon()} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[200px]">
        {memberRole === OrgMembershipRole.OWNER && memberUserId === userData?.user.id ? (
          <DropdownMenuGroup>
            <TransferOwnershipDialog
              trigger={
                <div className="flex items-center gap-2 px-2 py-1.5 cursor-pointer text-sm hover:bg-muted">
                  <UsersRound width={ICON_SIZE} /> Transfer Ownership
                </div>
              }
            />
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
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                }}
              >
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <UserRoundPen width={ICON_SIZE} /> &nbsp; Change Role
                    </div>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Change Role</AlertDialogTitle>
                      <AlertDialogDescription>Change the role of the member in the organization.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className={roleRow()}>
                      <Form {...form}>
                        New Role:{' '}
                        <FormField
                          name="role"
                          control={control}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.values(OrgMembershipRole)
                                      .filter((role) => role !== OrgMembershipRole.OWNER && !role.includes('USER'))
                                      .map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {role.charAt(0) + role.slice(1).toLowerCase()}
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
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
