'use client'

import React from 'react'
import { DocumentsCreateSection } from '@/components/shared/documents-section/documents-create-section'

interface StepUploadImportProps {
  onStagedFilesChange: (files: File[]) => void
  onExistingFileIdsChange: (fileIds: string[]) => void
}

const StepUploadImport: React.FC<StepUploadImportProps> = ({ onStagedFilesChange, onExistingFileIdsChange }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Optionally attach documents such as contracts, security assessments, or compliance reports.</p>
      <DocumentsCreateSection onFilesChange={onStagedFilesChange} onFileIdsChange={onExistingFileIdsChange} />
    </div>
  )
}

export default StepUploadImport
