'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Plus } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { GetSingleOrganizationMembersQueryVariables, useGetGroupDetailsQuery, useGetSingleOrganizationMembersQuery, useUpdateGroupMutation } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { useGroupsStore } from '@/hooks/useGroupsStore'

const AddMembersDialog = () => {
  const { selectedGroup, isAdmin } = useGroupsStore()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const [selectedMembers, setSelectedMembers] = useState<Option[]>([])

  const [{ data, fetching }] = useGetGroupDetailsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const { members, isManaged, id } = data?.group || {}

  const variables: GetSingleOrganizationMembersQueryVariables = {
    organizationId: session?.user.activeOrganizationId ?? '',
  }

  const [{ data: membersData }] = useGetSingleOrganizationMembersQuery({ variables })
  const [{}, updateGroup] = useUpdateGroupMutation()

  const membersOptions = membersData?.organization?.members
    ?.filter((member) => member.user.id != session?.user.userId)
    .map((member) => ({
      value: member.user.id,
      label: `${member.user.firstName} ${member.user.lastName}`,
      membershipId: member.id,
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

    toast({ title: 'Members updated successfully', variant: 'success' })
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
          {membersOptions && <MultipleSelector defaultOptions={membersOptions} value={selectedMembers} onChange={handleMemberChange} />}
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
