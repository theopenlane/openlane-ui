'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { FileUp, Trash2, Upload } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { acceptedFileTypes, acceptedFileTypesShort } from '@/components/pages/protected/evidence/upload/evidence-upload-config.ts'
import { useUploadEvidenceFiles } from '@/lib/graphql-hooks/evidence.ts'

type TControlEvidenceUploadDialog = {
  controlEvidenceID: string
}

const ControlEvidenceUploadDialog: React.FC<TControlEvidenceUploadDialog> = ({ controlEvidenceID }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateEvidence, isPending: isSubmitting } = useUploadEvidenceFiles()
  const [evidenceFiles, setEvidenceFiles] = useState<TUploadedFile[]>([])

  const handleFileUpload = async () => {
    if (!evidenceFiles) {
      return
    }

    const formData = {
      updateEvidenceId: controlEvidenceID,
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
    } catch {
      errorNotification({
        title: 'Error',
        description: 'There was an error uploading the evidence files. Please try again.',
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Upload />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
          Evidence Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Control Evidence Upload</DialogTitle>
        </DialogHeader>
        <FileUpload acceptedFileTypes={acceptedFileTypes} onFileUpload={handleUploadedFile} acceptedFileTypesShort={acceptedFileTypesShort} maxFileSizeInMb={100} multipleFiles={true} />
        {evidenceFiles.map((file, index) => (
          <div key={index} className="border rounded p-3 mt-4 flex items-center justify-between bg-gray-100 dark:bg-glaucous-900">
            <div className="flex items-center">
              <div className="mr-2">
                <FileUp className="w-8 h-8" />
              </div>
              <div>
                <div className="font-semibold">{file.name}</div>
                <div className="text-sm">Size: {Math.round(file.size! / 1024)} KB</div>
              </div>
            </div>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDelete(file)} />
          </div>
        ))}
        <div className="flex gap-2 justify-end">
          <Button onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting || evidenceFiles?.length === 0}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <Button onClick={() => setIsOpen(false)} variant="outline" disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { ControlEvidenceUploadDialog }
