'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import EvidenceAllFilesTable from './evidence-all-files-table'

type TProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EvidenceAllFilesDialog: React.FC<TProps> = ({ open, onOpenChange }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Existing Evidence Files</DialogTitle>
      </DialogHeader>
      <EvidenceAllFilesTable />
    </DialogContent>
  </Dialog>
)

export default EvidenceAllFilesDialog
