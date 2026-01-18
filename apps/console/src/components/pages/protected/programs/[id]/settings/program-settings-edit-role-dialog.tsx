'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { useEffect, useState } from 'react'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupName: string
  currentRole: 'Viewer' | 'Editor'
  onSubmit: (newRole: 'Viewer' | 'Editor') => void
}

export const EditGroupRoleDialog = ({ open, onOpenChange, groupName, currentRole, onSubmit }: Props) => {
  const [role, setRole] = useState<'Viewer' | 'Editor'>(currentRole)
  useEffect(() => {
    if (open) {
      setRole(currentRole)
    }

    return () => {}
  }, [open, currentRole])

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
          <Select key={currentRole} value={role} onValueChange={(val) => setRole(val as 'Viewer' | 'Editor')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Viewer">Viewer</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex justify-start gap-2">
          <Button onClick={() => onSubmit(role)}>Edit role</Button>
          <CancelButton onClick={() => onOpenChange(false)}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
