'use client'
import React, { useState } from 'react'
import { useMyGroupsStore } from '@/hooks/useMyGroupsStore'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Trash2, AlertTriangle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useToast } from '@repo/ui/use-toast'
import { useDeleteGroupMutation } from '@repo/codegen/src/schema'

const DeleteGroupDialog = () => {
  const { selectedGroup, setSelectedGroup } = useMyGroupsStore()
  const [isOpen, setIsOpen] = useState(false)
  const { toast } = useToast()

  const [{}, deleteGroup] = useDeleteGroupMutation()

  const handleDelete = async () => {
    if (!selectedGroup) return

    try {
      await deleteGroup({ deleteGroupId: selectedGroup.id })
      toast({ title: `Group "${selectedGroup.name}" deleted successfully`, variant: 'success' })
      setSelectedGroup(null)
      setIsOpen(false)
    } catch (error) {
      toast({ title: 'Failed to delete group.', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Trash2 />} iconPosition="left" variant="outline" disabled={selectedGroup?.isManaged}>
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[445px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Delete group</DialogTitle>
        </DialogHeader>

        {/* Warning Alert */}
        <div className="flex items-start gap-3 p-4 border border-destructive-border bg-[var(--color-destructive-transparent)] rounded-lg">
          <AlertTriangle className="text-destructive mt-1 flex-none" width={16} height={16} />
          <div>
            <p className="font-medium text-base text-destructive">Warning</p>
            <p className="text-sm text-destructive">Please proceed with caution, because you will not be able to undo this action.</p>
          </div>
        </div>

        {/* Confirmation Message */}
        <p>
          Are you sure you want to delete the group <span className="font-semibold">{selectedGroup?.name}</span> from your organization?
        </p>

        {/* Associated Objects Dropdown */}
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

        {/* Action Buttons */}
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
