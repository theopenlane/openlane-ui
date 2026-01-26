'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { acceptedFileTypes, acceptedFileTypesShort } from '@/components/pages/protected/evidence/upload/evidence-upload-config.ts'
import { useUploadEvidenceFiles } from '@/lib/graphql-hooks/evidence.ts'
import { TUploadedFile } from './upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TControlEvidenceUploadDialog = {
  evidenceID: string
}

const ControlEvidenceUploadDialog: React.FC<TControlEvidenceUploadDialog> = ({ evidenceID }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateEvidence, isPending: isSubmitting } = useUploadEvidenceFiles()
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFile[]>([])

  const handleFileUpload = async () => {
    if (!evidenceFiles) {
      return
    }

    const formData = {
      updateEvidenceId: evidenceID,
      input: {},
      evidenceFiles: evidenceFiles?.map((item) => item.file) || [],
    }

    try {
      await updateEvidence(formData)
      setIsOpen(false)
      successNotification({
        title: 'Evidence file(s) uploaded',
        description: `Evidence file(s) have been successfully uploaded`,
      })
      setEvidenceFiles([])
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setEvidenceFiles((prev) => [uploadedFile, ...prev])
  }

  const handleDelete = (file: TUploadedFile) => {
    setEvidenceFiles((prev) => {
      return prev.filter((evidenceFile) => evidenceFile.name !== file.name)
    })
  }

  const handleCancel = () => {
    setIsOpen(false)
    setEvidenceFiles([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" icon={<Upload />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
          File Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Control Evidence Upload</DialogTitle>
        </DialogHeader>
        <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleUploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={100} multipleFiles={true} />
        <div className="flex gap-6">
          {evidenceFiles.map((file, index) => (
            <UploadedFileDetailsCard key={index} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={() => handleDelete(file)} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting || evidenceFiles?.length === 0}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton disabled={isSubmitting} onClick={handleCancel}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ControlEvidenceUploadDialog }
