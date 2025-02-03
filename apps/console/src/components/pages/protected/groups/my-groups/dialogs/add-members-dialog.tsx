'use client'
import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Plus, X } from 'lucide-react'
import { useToast } from '@repo/ui/use-toast'
import { GetSingleOrganizationMembersQueryVariables, useGetSingleOrganizationMembersQuery } from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import MultipleSelector, { Option } from '@repo/ui/multiple-selector'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'

const AddMembersDialog = () => {
  const { selectedGroup } = useMyGroupsStore()
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()
  const [selectedMembers, setSelectedMembers] = useState<Option[]>([])

  console.log('selectedGroup', selectedGroup)

  const variables: GetSingleOrganizationMembersQueryVariables = {
    organizationId: session?.user.activeOrganizationId ?? '',
  }

  const [{ data: membersData }] = useGetSingleOrganizationMembersQuery({
    variables,
  })

  const membersOptions = membersData?.organization?.members?.map((member) => ({
    value: member.user.id,
    label: `${member.user.firstName} ${member.user.lastName}`,
  }))

  const handleMemberChange = (newSelected: Option[]) => {
    setSelectedMembers(newSelected)
  }
  const handleSave = () => {
    console.log('Selected Members:', selectedMembers)
    toast({ title: 'Members added successfully', variant: 'success' })
    setIsOpen(false)
  }
  useEffect(() => {
    const selectedMembersOptions = selectedGroup?.members?.map((member) => ({
      value: member.user.id,
      label: `${member.user.firstName} ${member.user.lastName}`,
    }))

    setSelectedMembers(selectedMembersOptions ?? [])
  }, [])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" icon={<Plus />} iconPosition="left" disabled={selectedGroup?.isManaged}>
          Add members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Add members</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <p className="font-medium">Group member(s)</p>
          {membersOptions && <MultipleSelector defaultOptions={membersOptions} value={selectedMembers} onChange={handleMemberChange} />}{' '}
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
