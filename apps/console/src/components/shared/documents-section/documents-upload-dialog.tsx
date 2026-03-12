'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { acceptedFileTypes, acceptedFileTypesShort, maxFileSizeInMb } from '@/components/shared/file-upload/file-upload-config'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type DocumentsUploadDialogProps = {
  onUpload: (files: File[]) => Promise<void>
  isUploading: boolean
  title?: string
  buttonLabel?: string
  buttonVariant?: 'primary' | 'secondary' | 'secondaryOutline'
}

const DocumentsUploadDialog: React.FC<DocumentsUploadDialogProps> = ({ onUpload, isUploading, title = 'Document Upload', buttonLabel = 'File Upload', buttonVariant = 'secondary' }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [stagedFiles, setStagedFiles] = useState<TUploadedFile[]>([])

  const handleFileUpload = async () => {
    if (!stagedFiles.length) {
      return
    }

    const files = stagedFiles.filter((item) => item.file).map((item) => item.file as File)
    await onUpload(files)
    setIsOpen(false)
    setStagedFiles([])
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setStagedFiles((prev) => [uploadedFile, ...prev])
  }

  const handleDelete = (file: TUploadedFile) => {
    setStagedFiles((prev) => prev.filter((f) => f.name !== file.name))
  }

  const handleCancel = () => {
    setIsOpen(false)
    setStagedFiles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} icon={<Upload />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isUploading} loading={isUploading}>
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleUploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={maxFileSizeInMb} multipleFiles={true} />
        <div className="flex gap-6">
          {stagedFiles.map((file, index) => (
            <UploadedFileDetailsCard key={index} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(file)} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleFileUpload} loading={isUploading} disabled={isUploading || stagedFiles.length === 0}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton disabled={isUploading} onClick={handleCancel} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { DocumentsUploadDialog }
