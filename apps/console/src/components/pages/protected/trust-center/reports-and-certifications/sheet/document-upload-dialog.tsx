'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { FileUp, Trash2, Upload } from 'lucide-react'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { useUpdateTrustCenterDoc } from '@/lib/graphql-hooks/trust-center-doc'
import { useQueryClient } from '@tanstack/react-query'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TDocumentUploadDialog = {
  documentId: string
}

export const DocumentUploadDialog: React.FC<TDocumentUploadDialog> = ({ documentId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<TUploadedFile[]>([])
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: updateDocument, isPending: isSubmitting } = useUpdateTrustCenterDoc()
  const queryClient = useQueryClient()

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFiles([uploadedFile])
  }

  const handleDelete = (file: TUploadedFile) => {
    setUploadedFiles((prev) => prev.filter((f) => f.name !== file.name))
  }

  const handleFileUpload = async () => {
    if (!uploadedFiles.length) return

    const file = uploadedFiles[0].file
    if (file?.type !== 'application/pdf') {
      errorNotification({
        title: 'Invalid file type',
        description: 'Only PDF files are allowed.',
      })
      return
    }

    try {
      await updateDocument({
        updateTrustCenterDocId: documentId,
        input: {},
        trustCenterDocFile: file,
      })

      successNotification({
        title: 'Document File Uploaded',
        description: 'The document file has been successfully uploaded.',
      })

      setIsOpen(false)
      setUploadedFiles([])
      queryClient.invalidateQueries({ queryKey: ['documentFiles'] })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Upload Error',
        description: errorMessage,
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" icon={<Upload />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
          Upload New
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload PDF Document</DialogTitle>
        </DialogHeader>

        {/* ✅ Restrict to PDF files only */}
        <FileUpload acceptedFileTypes={['application/pdf']} acceptedFileTypesShort={['PDF']} maxFileSizeInMb={10} multipleFiles={false} onFileUpload={handleUploadedFile} />

        {uploadedFiles.map((file, index) => (
          <div key={index} className="border rounded-sm p-3 mt-4 flex items-center justify-between bg-secondary">
            <div className="flex items-center flex-1 min-w-0">
              <div className="mr-2">
                <FileUp className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate max-w-[240px]" title={file.name}>
                  {file.name}
                </div>
                <div className="text-sm">Size: {Math.round(file.size! / 1024)} KB</div>
              </div>
            </div>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDelete(file)} />
          </div>
        ))}

        <div className="flex gap-2 justify-end">
          <Button onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting || uploadedFiles.length === 0}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton onClick={() => setIsOpen(false)} disabled={isSubmitting}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
