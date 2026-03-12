'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'

const csvAcceptedFileTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
const csvAcceptedFileTypesShort = ['.csv', '.xls']
const csvMaxFileSizeInMb = 3

interface StepUploadImportProps {
  onStagedFilesChange: (files: File[]) => void
  onExistingFileIdsChange: (fileIds: string[]) => void
}

const StepUploadImport: React.FC<StepUploadImportProps> = ({ onStagedFilesChange }) => {
  const [uploadedFiles, setUploadedFiles] = useState<TUploadedFile[]>([])

  const handleFileUpload = (uploadedFile: TUploadedFile) => {
    setUploadedFiles((prev) => {
      const updated = [uploadedFile, ...prev]
      onStagedFilesChange(updated.filter((f) => f.file).map((f) => f.file as File))
      return updated
    })
  }

  const handleDeleteFile = (index: number) => {
    setUploadedFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      onStagedFilesChange(updated.filter((f) => f.file).map((f) => f.file as File))
      return updated
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-2">Bulk Upload (CSV)</p>
        <FileUpload
          acceptedFileTypes={csvAcceptedFileTypes}
          acceptedFileTypesShort={csvAcceptedFileTypesShort}
          maxFileSizeInMb={csvMaxFileSizeInMb}
          onFileUpload={handleFileUpload}
          multipleFiles={true}
        />
      </div>

      {uploadedFiles.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {uploadedFiles.map((file, index) => (
            <UploadedFileDetailsCard key={`${file.name}-${index}`} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDeleteFile(index)} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between rounded-lg border border-dashed border-muted-foreground/40 px-4 py-3">
        <p className="text-sm font-medium">Contact (Optional)</p>
        <Button type="button" variant="secondary" className="h-8 px-2!" iconPosition="left" icon={<Plus />}>
          Add Contact
        </Button>
      </div>
    </div>
  )
}

export default StepUploadImport
