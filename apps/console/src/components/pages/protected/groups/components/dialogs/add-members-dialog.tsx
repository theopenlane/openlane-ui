'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { useNotification } from '@/hooks/useNotification'
import { useSession } from 'next-auth/react'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { useGetGroupDetails, useUpdateGroup } from '@/lib/graphql-hooks/groups'
import { useGetSingleOrganizationMembers } from '@/lib/graphql-hooks/organization'
import { useQueryClient } from '@tanstack/react-query'

const AddMembersDialog = () => {
  const { selectedGroup, isAdmin } = useGroupsStore()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const [selectedMembers, setSelectedMembers] = useState<Option[]>([])
  const queryClient = useQueryClient()
  const { data } = useGetGroupDetails(selectedGroup)
  const { members, isManaged, id } = data?.group || {}

  const { data: membersData } = useGetSingleOrganizationMembers({ organizationId: session?.user.activeOrganizationId })
  const { mutateAsync: updateGroup } = useUpdateGroup()

  const membersOptions = membersData?.organization?.members?.edges
    ?.filter((member) => member?.node?.user?.id != session?.user.userId)
    .map((member) => ({
      value: member?.node?.user?.id,
      label: `${member?.node?.user?.firstName} ${member?.node?.user?.lastName}`,
      membershipId: member?.node?.user?.id,
    }))

  const handleMemberChange = (newSelected: Option[]) => {
    setSelectedMembers(newSelected)
  }

  const handleSave = async () => {
    if (!selectedGroup || !id) return

    const originalMembersMap = new Map(members?.map((member) => [member.user.id, member.id || '']))
    const newMemberIds = new Set(selectedMembers.map((member) => member.value))
    const removeGroupMembers = [...originalMembersMap.entries()].filter(([userId]) => !newMemberIds.has(userId)).map(([, membershipId]) => membershipId) // Extract membership ID
    const addGroupMembers = [...newMemberIds]
      .filter((userId) => !originalMembersMap.has(userId))
      .map((userId) => ({
        groupID: id,
        userID: userId,
      }))

    await updateGroup({
      updateGroupId: id,
      input: {
        removeGroupMembers,
        addGroupMembers,
      },
    })

    queryClient.invalidateQueries({ queryKey: ['group', selectedGroup] })
    successNotification({ title: 'Members updated successfully' })
    setIsOpen(false)
  }

  useEffect(() => {
    if (members) {
      const selectedMembersOptions = members
        .filter((member) => member.user.id != session?.user.userId)
        .map((member) => ({
          value: member.user.id,
          label: `${member.user.firstName} ${member.user.lastName}`,
        }))
      setSelectedMembers(selectedMembersOptions)
    }
  }, [members])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={<Plus />} iconPosition="left" disabled={!!isManaged || !isAdmin}>
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
          <Button className="w-full" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddMembersDialog
