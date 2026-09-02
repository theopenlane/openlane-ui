'use client'
import React, { useState } from 'react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { AlertTriangle, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { useDeleteGroup, useGetGroupDetails } from '@/lib/graphql-hooks/group'
import { useQueryClient } from '@tanstack/react-query'
import GroupsDeletePermissionsTable from '../groups-delete-permissions-table'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type DeleteGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DeleteGroupDialog = ({ open, onOpenChange }: DeleteGroupDialogProps) => {
  const { selectedGroup, setSelectedGroup } = useGroupsStore()
  const { successNotification, errorNotification } = useNotification()
  const [expanded, setExpanded] = useState(false)
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
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete group</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 p-4 border border-destructive-border bg-(--color-destructive-transparent) rounded-lg">
          <AlertTriangle className="text-destructive mt-1 flex-none" width={16} height={16} />
          <div>
            <p className="font-medium text-base text-destructive">Warning</p>
            <p className="text-sm text-destructive">Please proceed with caution, because you will not be able to undo this action.</p>
          </div>
        </div>
        <p>
          Are you sure you want to delete the group <span className="font-semibold">{name}</span> from your organization?
        </p>
        <div className="space-y-2.5">
          <p className=" font-medium">Objects associated with the group</p>
          <p className="text-sm ">All granted permissions to the group will be unassociated. No objects will be deleted.</p>
          <button className="border rounded-lg flex gap-1 items-center  py-1.5 px-3" onClick={() => setExpanded((prev) => !prev)}>
            <p>Show associated Objects</p>
            {expanded ? <ChevronUpIcon size={16} /> : <ChevronDownIcon size={16} />}
          </button>
          {expanded && <GroupsDeletePermissionsTable />}
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button variant="destructive" onClick={handleDelete}>
            Delete this group
          </Button>
          <CancelButton onClick={() => onOpenChange(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteGroupDialog
