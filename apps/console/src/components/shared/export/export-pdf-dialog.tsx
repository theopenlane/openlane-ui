'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Label } from '@repo/ui/label'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { type TExportMetadata } from '@/components/shared/export/use-file-export.ts'
import { DownloadIcon } from 'lucide-react'

type TExportPdfDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (exportMetadata?: TExportMetadata) => void
}

const ExportPdfDialog: React.FC<TExportPdfDialogProps> = ({ open, onOpenChange, onExport }) => {
  const [excludePDFMetadata, setExcludePDFMetadata] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setExcludePDFMetadata(false)
    }
    onOpenChange(nextOpen)
  }

  const handleExport = () => {
    onExport(excludePDFMetadata ? { excludePDFMetadata: true } : undefined)
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Export to PDF</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-start space-x-2">
            <Checkbox id="exclude-pdf-metadata" className="mt-0.5" checked={excludePDFMetadata} onCheckedChange={(checked) => setExcludePDFMetadata(checked === true)} />
            <Label htmlFor="exclude-pdf-metadata" className="font-normal cursor-pointer">
              <span className="block">Exclude metadata</span>
              <span className="block text-xs text-muted-foreground">Leave out the document metadata section (such as owner, approver, version and dates) from the generated PDF.</span>
            </Label>
          </div>
          <div className="flex self-end gap-2">
            <Button variant="primary" onClick={handleExport} icon={<DownloadIcon />} iconPosition="left">
              Export
            </Button>
            <CancelButton onClick={() => handleOpenChange(false)} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ExportPdfDialog
