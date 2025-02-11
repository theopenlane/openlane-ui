'use client'
import React, { useState } from 'react'
import { useGroupsStore } from '@/hooks/useGroupsStore'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useToast } from '@repo/ui/use-toast'
import { useDeleteGroupMutation, useGetGroupDetailsQuery } from '@repo/codegen/src/schema'

const DeleteGroupDialog = () => {
  const { selectedGroup, setSelectedGroup, isAdmin } = useGroupsStore()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const [{ data, fetching }] = useGetGroupDetailsQuery({ variables: { groupId: selectedGroup || '' }, pause: !selectedGroup })
  const { id, name, isManaged } = data?.group || {}

  const [{}, deleteGroup] = useDeleteGroupMutation()

  const handleDelete = async () => {
    if (!selectedGroup || !id) return

    try {
      await deleteGroup({ deleteGroupId: id })
      toast({ title: `Group "${name}" deleted successfully`, variant: 'success' })
      setSelectedGroup(null)
      setIsOpen(false)
    } catch (error) {
      toast({ title: 'Failed to delete group.', variant: 'destructive' })
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
          <Select>
            <SelectTrigger>Show associated objects</SelectTrigger>
            <SelectContent>
              <SelectItem value="permissions">Permissions</SelectItem>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select>
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
