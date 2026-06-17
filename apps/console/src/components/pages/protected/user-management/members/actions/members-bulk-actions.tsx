'use client'

import React, { useState } from 'react'
import { ChevronDown, ShieldMinus, ShieldPlus, Trash2, UserRoundPen } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { AlertDialog, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@repo/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useQueryClient } from '@tanstack/react-query'
import { OrgMembershipRole, type OrgMembership } from '@repo/codegen/src/schema'
import { ManageAdditionalRolesDialog } from '@/components/shared/organization-roles/manage-additional-roles-dialog'
import { ASSIGNABLE_BASE_ROLES } from './assignable-base-roles'
import { invalidateMembershipQueries } from '@/lib/graphql-hooks/membership-cache'
import { useRemoveUserFromOrg, useUpdateUserRoleInOrg } from '@/lib/graphql-hooks/member'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { toHumanLabel } from '@/utils/strings'

const ICON_SIZE = 12

type MembersBulkActionsProps = {
  selectedMembers: OrgMembership[]
  onClear: () => void
}

export const MembersBulkActions = ({ selectedMembers, onClear }: MembersBulkActionsProps) => {
  const [rolesMode, setRolesMode] = useState<'add' | 'remove' | null>(null)
  const [showChangeRole, setShowChangeRole] = useState(false)
  const [showRemove, setShowRemove] = useState(false)
  const [newRole, setNewRole] = useState<OrgMembershipRole>(OrgMembershipRole.MEMBER)

  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateMember } = useUpdateUserRoleInOrg()
  const { mutateAsync: deleteMember } = useRemoveUserFromOrg()

  const count = selectedMembers.length
  const userIds = selectedMembers.map((m) => m.user.id)

  const handleChangeRole = async () => {
    try {
      await Promise.all(selectedMembers.map((m) => updateMember({ updateOrgMemberId: m.id, input: { role: newRole } })))
      successNotification({ title: `Updated base role for ${count} member(s)` })
      invalidateMembershipQueries(queryClient)
      setShowChangeRole(false)
      onClear()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  const handleRemove = async () => {
    try {
      await Promise.all(selectedMembers.map((m) => deleteMember({ deleteOrgMembershipId: m.id })))
      successNotification({ title: `Removed ${count} member(s)` })
      invalidateMembershipQueries(queryClient)
      onClear()
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="secondary">
            Bulk actions ({count})
            <ChevronDown className="ml-1" size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setShowChangeRole(true)}>
              <UserRoundPen width={ICON_SIZE} /> &nbsp; Change Base Role
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRolesMode('add')}>
              <ShieldPlus width={ICON_SIZE} /> &nbsp; Add Additional Role
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setRolesMode('remove')}>
              <ShieldMinus width={ICON_SIZE} /> &nbsp; Remove Additional Role
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setShowRemove(true)} className="text-destructive">
              <Trash2 width={ICON_SIZE} /> &nbsp; Remove Members
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageAdditionalRolesDialog
        open={rolesMode !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRolesMode(null)
            onClear()
          }
        }}
        subjectType="user"
        subjectIds={userIds}
        mode={rolesMode ?? 'add'}
      />

      <AlertDialog open={showChangeRole} onOpenChange={setShowChangeRole}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change base role for {count} member(s)</AlertDialogTitle>
          </AlertDialogHeader>
          <Select value={newRole} onValueChange={(value) => setNewRole(value as OrgMembershipRole)}>
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
          <AlertDialogFooter>
            <CancelButton onClick={() => setShowChangeRole(false)} />
            <Button type="button" variant="primary" onClick={handleChangeRole}>
              Change Role
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ConfirmationDialog
        open={showRemove}
        onOpenChange={setShowRemove}
        onConfirm={handleRemove}
        title="Remove members"
        description={<>This action cannot be undone. This will permanently remove {count} member(s) from the organization.</>}
      />
    </>
  )
}
