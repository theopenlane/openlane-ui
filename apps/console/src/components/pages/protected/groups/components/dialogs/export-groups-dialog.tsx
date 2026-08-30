'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { DownloadIcon } from 'lucide-react'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TExportGroupsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (includePermissions: boolean) => void
}

const ExportGroupsDialog: React.FC<TExportGroupsDialogProps> = ({ open, onOpenChange, onExport }) => {
  const [includePermissions, setIncludePermissions] = useState(false)

  const handleExport = () => {
    onExport(includePermissions)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Export groups</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Every group matching the current filters is exported to CSV using the columns visible in the table.</p>
          <div className="flex items-start space-x-2">
            <Checkbox id="include-group-permissions" className="mt-0.5" checked={includePermissions} onCheckedChange={(checked) => setIncludePermissions(checked === true)} />
            <Label htmlFor="include-group-permissions" className="font-normal cursor-pointer">
              <span className="block">Include permissions</span>
              <span className="block text-xs text-muted-foreground">Add a column listing every object each group can view, edit, create or is blocked from.</span>
            </Label>
          </div>
          <div className="flex self-end gap-2">
            <Button variant="primary" onClick={handleExport} icon={<DownloadIcon />} iconPosition="left">
              Export
            </Button>
            <CancelButton onClick={() => onOpenChange(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportGroupsDialog
