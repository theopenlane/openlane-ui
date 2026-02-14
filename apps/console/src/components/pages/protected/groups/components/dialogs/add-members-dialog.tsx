'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useSession } from 'next-auth/react'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetGroupDetails, useUpdateGroup } from '@/lib/graphql-hooks/group'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'
import { User } from '@repo/codegen/src/schema'
import { canEdit } from '@/lib/authz/utils'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'

const AddMembersDialog = () => {
  const { selectedGroup } = useGroupsStore()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { successNotification } = useNotification()
  const [selectedMembers, setSelectedMembers] = useState<Option[]>([])
  const queryClient = useQueryClient()
  const { data } = useGetGroupDetails(selectedGroup)
  const { members: membersGroupData, isManaged, id } = data?.group || {}
  const [hasInitialized, setHasInitialized] = useState(false)
  const { data: permission } = useAccountRoles(ObjectTypes.GROUP, selectedGroup)

  const members = useMemo(
    () =>
      membersGroupData?.edges?.map((user) => {
        return {
          user: user?.node?.user as User,
          groupID: user?.node?.id || '',
        }
      }) || [],
    [membersGroupData?.edges],
  )

  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const { mutateAsync: updateGroup } = useUpdateGroup()

  const membersOptions = membersData?.organization?.members?.edges?.map((member) => ({
    value: member?.node?.user?.id,
    label: `${member?.node?.user?.displayName}`,
    membershipId: member?.node?.user?.id,
  }))

  const handleMemberChange = (newSelected: Option[]) => {
    setSelectedMembers(newSelected)
  }

  const handleSave = async () => {
    if (!selectedGroup || !id) return

    const originalMembersMap = new Map(members?.map((member) => [member.user.id, member]))

    const newMemberIds = new Set(selectedMembers.map((member) => member.value))

    const removeGroupMembers = members?.filter((member) => !newMemberIds.has(member.user.id)).map((member) => member.groupID)

    const addGroupMembers = selectedMembers
      .filter((selected) => !originalMembersMap.has(selected.value))
      .map((selected) => ({
        groupID: id,
        userID: selected.value,
      }))

    await updateGroup({
      updateGroupId: id,
      input: {
        removeGroupMembers,
        addGroupMembers,
      },
    })

    queryClient.invalidateQueries({ queryKey: ['groups', selectedGroup] })
    successNotification({ title: 'Members updated successfully' })
    setIsOpen(false)
  }

  useEffect(() => {
    if (!hasInitialized && members.length > 0) {
      const initialSelected = members.map((member) => ({
        value: member.user.id,
        label: `${member.user.displayName}`,
      }))

      setSelectedMembers(initialSelected)
      setHasInitialized(true)
    }
  }, [members, hasInitialized])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" icon={<Plus />} iconPosition="left" disabled={!!isManaged || !canEdit(permission?.roles)}>
          Add members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add members</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="font-medium">Group member(s)</p>
          {/* mateo todo: fix type error and remove as Option[] */}
          {membersOptions && <MultipleSelector defaultOptions={membersOptions as Option[]} value={selectedMembers} onChange={handleMemberChange} />}
        </div>

        <DialogFooter className="flex justify-center pt-4">
          <SaveButton className="w-full" onClick={handleSave} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddMembersDialog
