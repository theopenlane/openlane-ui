'use client'

import React, { useState } from 'react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import ContactMultiSelect from './contact-multi-select'

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

      <ContactMultiSelect label="Contacts (optional)" />
    </div>
  )
}

export default StepUploadImport
