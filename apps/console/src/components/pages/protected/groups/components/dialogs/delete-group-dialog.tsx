'use client'
import React from 'react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { useDeleteGroup, useGetGroupDetails } from '@/lib/graphql-hooks/group'
import { useQueryClient } from '@tanstack/react-query'
import GroupAssociatedObjectsSection from './group-associated-objects-section'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { Callout } from '@/components/shared/callout/callout'

type DeleteGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteGroupDialog = ({ open, onOpenChange }: DeleteGroupDialogProps) => {
  const { selectedGroup, setSelectedGroup } = useGroupsStore()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

  const { data } = useGetGroupDetails(selectedGroup)
  const { id, name } = data?.group || {}

  const { mutateAsync: deleteGroup } = useDeleteGroup()

  const handleDelete = async () => {
    if (!selectedGroup || !id) return

    try {
      await deleteGroup({ deleteGroupId: id })
      successNotification({ title: `Group "${name}" deleted successfully` })
      setSelectedGroup(null)
      onOpenChange(false)
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete group</DialogTitle>
        </DialogHeader>

        <Callout variant="danger" title="Warning" compact>
          Please proceed with caution, because you will not be able to undo this action.
        </Callout>
        <p className="break-words">
          Are you sure you want to delete the group <span className="font-semibold">{name}</span> from your organization?
        </p>
        <GroupAssociatedObjectsSection />

        <DialogFooter className="flex gap-2">
          <CancelButton onClick={() => onOpenChange(false)} />
          <Button variant="destructive" onClick={handleDelete}>
            Delete this group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteGroupDialog
