'use client'
import React, { useState } from 'react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Trash2, AlertTriangle, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'
import { useDeleteGroupMutation, useGetGroupDetailsQuery } from '@repo/codegen/src/schema'
import GroupsDeletePermissionsTable from '../groups-delete-permissions-table'
import { useNotification } from '@/hooks/useNotification'

const DeleteGroupDialog = () => {
  const { selectedGroup, setSelectedGroup, isAdmin, reexecuteGroupsQuery } = useGroupsStore()
  const [isOpen, setIsOpen] = useState(false)
  const { successNotification, errorNotification } = useNotification()
  const [expanded, setExpanded] = useState(false)

  const [{ data }] = useGetGroupDetailsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const { id, name, isManaged } = data?.group || {}

  const [{}, deleteGroup] = useDeleteGroupMutation()

  const handleDelete = async () => {
    if (!selectedGroup || !id) return

    try {
      await deleteGroup({ deleteGroupId: id })
      successNotification({ title: `Group "${name}" deleted successfully` })
      setSelectedGroup(null)
      setIsOpen(false)
      reexecuteGroupsQuery?.()
    } catch (error) {
      errorNotification({ title: 'Failed to delete group.' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Trash2 />} iconPosition="left" variant="outline" disabled={!!isManaged || !isAdmin}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete group</DialogTitle>
        </DialogHeader>

        <div className="flex items-start gap-3 p-4 border border-destructive-border bg-[var(--color-destructive-transparent)] rounded-lg">
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
          <Button variant="outline" className="" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteGroupDialog
