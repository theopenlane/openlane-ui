'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useState } from 'react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  currentRole: string
  onSubmit: (newRole: string) => void
}

export const EditGroupRoleDialog = ({ open, onOpenChange, groupName, currentRole, onSubmit }: Props) => {
  const [role, setRole] = useState(currentRole)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit role</DialogTitle>
        </DialogHeader>

        <p className="text-sm mb-2">
          Edit role for <strong>{groupName}</strong>
        </p>

        <div className="space-y-1">
          <label className="text-sm font-medium">Role</label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Member">Member</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex justify-start gap-2">
          <Button onClick={() => onSubmit(role)}>Edit role</Button>
          <Button variant="back" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
