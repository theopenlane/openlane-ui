'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { Button, type ButtonProps } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { acceptedFileTypes, acceptedFileTypesShort, maxFileSizeInMb } from '@/components/shared/file-upload/file-upload-config'
import { type TUploadedFile } from '@/components/shared/file-upload/types'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { StagedUploadList } from './staged-upload-list'
import { type StagedUpload } from './staged-upload'

type DocumentsUploadDialogProps = {
  onUpload: (uploads: StagedUpload[]) => Promise<void>
  isUploading: boolean
  title?: string
  buttonLabel?: string
  buttonVariant?: ButtonProps['variant']
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const DocumentsUploadDialog: React.FC<DocumentsUploadDialogProps> = ({
  onUpload,
  isUploading,
  title = 'Document Upload',
  buttonLabel = 'File Upload',
  buttonVariant = 'secondary',
  open,
  onOpenChange,
}) => {
  const [internalOpen, setInternalOpen] = useState<boolean>(false)
  const isOpen = open ?? internalOpen
  const setIsOpen = onOpenChange ?? setInternalOpen
  const [stagedUploads, setStagedUploads] = useState<StagedUpload[]>([])
  const nextStagedIdRef = useRef(0)

  const handleFileUpload = async () => {
    if (!stagedUploads.length) {
      return
    }

    try {
      await onUpload(stagedUploads)
    } catch {
      return
    }

    setIsOpen(false)
    setStagedUploads([])
  }

  const handleUploadedFile = ({ file }: TUploadedFile) => {
    if (!file) {
      return
    }

    nextStagedIdRef.current += 1
    const id = `staged-${nextStagedIdRef.current}`

    setStagedUploads((prev) => [{ id, file, name: '', category: '' }, ...prev])
  }

  const updateStagedUpload = (id: string, changes: Partial<StagedUpload>) => {
    setStagedUploads((prev) => prev.map((staged) => (staged.id === id ? { ...staged, ...changes } : staged)))
  }

  const removeStagedUpload = (id: string) => {
    setStagedUploads((prev) => prev.filter((staged) => staged.id !== id))
  }

  const handleCancel = () => {
    setIsOpen(false)
    setStagedUploads([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!onOpenChange && (
        <DialogTrigger asChild>
          <Button variant={buttonVariant} icon={<Upload />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isUploading} loading={isUploading}>
            {buttonLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleUploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={maxFileSizeInMb} multipleFiles={true} />
        <StagedUploadList uploads={stagedUploads} onChange={updateStagedUpload} onRemove={removeStagedUpload} />
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleFileUpload} loading={isUploading} disabled={isUploading || stagedUploads.length === 0}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton disabled={isUploading} onClick={handleCancel} />
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { DocumentsUploadDialog }
