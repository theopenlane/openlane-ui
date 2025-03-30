'use client'

import { MoreHorizontal, Trash2, UserRoundPen } from 'lucide-react'
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
import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { useSession } from 'next-auth/react'
import { useUserHasOrganizationEditPermissions } from '@/lib/authz/utils'
import { useQueryClient } from '@tanstack/react-query'
import { OrgMembershipRole } from '@repo/codegen/src/schema'
import { useRemoveUserFromOrg, useUpdateUserRoleInOrg } from '@/lib/graphql-hooks/members'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

type MemberActionsProps = {
  memberId: string
  memberRole: OrgMembershipRole
}

const ICON_SIZE = 12

export const MemberActions = ({ memberId, memberRole }: MemberActionsProps) => {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const { actionIcon, roleRow, buttonRow } = pageStyles()
  const { mutateAsync: deleteMember } = useRemoveUserFromOrg()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId
  const queryClient = useQueryClient()
  const { errorNotification, successNotification } = useNotification()
  const { data: userData } = useGetCurrentUser(userId)
  const { data } = useUserHasOrganizationEditPermissions(sessionData)

  const handleDeleteMember = async () => {
    try {
      await deleteMember({ deleteOrgMembershipId: memberId })
      successNotification({
        title: 'Member deleted successfully',
      })
      queryClient.invalidateQueries({ queryKey: ['organizationsWithMembers', sessionData?.user.activeOrganizationId] })
    } catch {
      errorNotification({
        title: 'There was a problem deleting the member, please try again',
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

      queryClient.invalidateQueries({ queryKey: ['organizationsWithMembers', sessionData?.user.activeOrganizationId] })
    } catch (error) {
      errorNotification({
        title: 'There was a problem updating the member, please try again',
        variant: 'destructive',
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
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: OrgMembershipRole.MEMBER,
    },
  })

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form

  if (memberRole === OrgMembershipRole.OWNER) {
    //CANT EDIT OWNER
    return null
  }
  if (memberId === userData?.user.id) {
    //CANT EDIT YOURSELF
    return null
  }

  if (!data?.allowed) {
    //MEMBERS CANT EDIT ANYONE
    return null
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <MoreHorizontal className={actionIcon()} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-10">
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
              description="This action cannot be undone, this will permanently remove the member from the organization."
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
                                {Object.entries(OrgMembershipRole)
                                  .reverse()
                                  .filter(([key]) => !key.includes('USER'))
                                  .map(([key, value], i) => (
                                    <SelectItem key={i} value={value}>
                                      {key[0].toUpperCase() + key.slice(1).toLowerCase()}
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
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant="filled" onClick={handleSubmit((data) => handleChangeRole(data.role))}>
                      Change Role
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
