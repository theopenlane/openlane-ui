'use client'

import { MoreHorizontal, Trash2, UserRoundPen } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { pageStyles } from '../page.styles'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { OrgMembershipRole, useGetUserProfileQuery, useRemoveUserFromOrgMutation, useUpdateUserRoleInOrgMutation } from '@repo/codegen/src/schema'
import { type UseQueryExecute } from 'urql'
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
import React from 'react'
import { Form, FormControl, FormField, FormItem } from '@repo/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z, infer as zInfer } from 'zod'
import { useSession } from 'next-auth/react'
import { useUserHasOrganizationEditPermissions } from '@/lib/authz/utils'

type MemberActionsProps = {
  memberId: string
  refetchMembers: UseQueryExecute
  memberRole: OrgMembershipRole
}

const ICON_SIZE = 12

export const MemberActions = ({ memberId, refetchMembers, memberRole }: MemberActionsProps) => {
  const { actionIcon, roleRow, buttonRow } = pageStyles()
  const { successNotification, errorNotification } = useNotification()
  const [_, deleteMember] = useRemoveUserFromOrgMutation()
  const { data: sessionData } = useSession()
  const userId = sessionData?.user.userId

  const variables = { userId: userId ?? '' }
  const [{ data: userData }] = useGetUserProfileQuery({ variables })

  const { data, isLoading, error } = useUserHasOrganizationEditPermissions(sessionData)

  const handleDeleteMember = async () => {
    const response = await deleteMember({ deleteOrgMembershipId: memberId })

    if (response.error) {
      errorNotification({
        title: 'There was a problem deleting the member, please try again',
      })
    }

    if (response.data) {
      successNotification({
        title: 'Member deleted successfully',
      })
      refetchMembers({
        requestPolicy: 'network-only',
      })
    }
  }

  const [member, updateMember] = useUpdateUserRoleInOrgMutation()
  const handleChangeRole = async (role: OrgMembershipRole) => {
    const response = await updateMember({ updateOrgMemberId: memberId, input: { role: role } })

    if (response.error) {
      errorNotification({
        title: 'There was a problem updating the member, please try again',
        variant: 'destructive',
      })
    }

    if (response.data) {
      successNotification({
        title: 'Role changed successfully',
        variant: 'success',
      })
      refetchMembers({
        requestPolicy: 'network-only',
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

  if (!data.allowed) {
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <div style={{ display: 'flex' }}>
                  <Trash2 width={ICON_SIZE} /> &nbsp; Remove Member
                </div>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone, this will permanently remove the member from the organization.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel asChild>
                    <Button variant="outline">Cancel</Button>
                  </AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button variant="filled" onClick={handleDeleteMember}>
                      Remove Member
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
