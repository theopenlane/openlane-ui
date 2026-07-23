'use client'

import React, { useCallback, useState } from 'react'
import ExportPdfDialog from '@/components/shared/export/export-pdf-dialog.tsx'
import { type TExportMetadata } from '@/components/shared/export/use-file-export.ts'

type TUsePdfExportDialogProps = {
  onExport: (exportMetadata?: TExportMetadata) => void
}

const usePdfExportDialog = ({ onExport }: TUsePdfExportDialogProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const openPdfExportDialog = useCallback(() => setIsOpen(true), [])

  const pdfExportDialog = <ExportPdfDialog open={isOpen} onOpenChange={setIsOpen} onExport={onExport} />

  return {
    openPdfExportDialog,
    pdfExportDialog,
  }
}

export default usePdfExportDialog
