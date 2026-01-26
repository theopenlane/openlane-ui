'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { exportCSV } from '@/lib/export'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { GRAPHQL_OBJECT_DOCS } from '@/constants/docs'
import { Callout } from '@/components/shared/callout/callout'
import { TUploadedFile } from '../upload/types/TUploadedFile'
import { useCreateBulkCSVEvidence } from '@/lib/graphql-hooks/evidence'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type BulkCSVCreateEvidenceDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
}

const BulkCSVCreateEvidenceDialog: React.FC<BulkCSVCreateEvidenceDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkEvidence, isPending: isSubmitting } = useCreateBulkCSVEvidence()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createBulkEvidence({ input: uploadedFile.file! })
      successNotification({
        title: 'Evidence Created',
        description: `Evidence has been successfully created`,
      })
      setIsOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFile(uploadedFile)
  }

  const handleCSVExport = async () => {
    await exportCSV({ filename: 'evidence' })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger className="bg-transparent">
          {cloneElement(trigger, {
            onClick: () => setIsOpen(true),
            disabled: isSubmitting,
          })}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="transparent" icon={<Upload />} className="h-8 px-2!" iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Bulk Upload
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[640px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
        </DialogHeader>
        <Callout title="CSV Format">
          <p className="text-sm">
            You can upload a csv containing evidence. Please refer to our{' '}
            <a href={`${GRAPHQL_OBJECT_DOCS}#evidence`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
              documentation
            </a>{' '}
            for column format. We also provide a{' '}
            <a className="text-brand hover:underline cursor-pointer" onClick={() => handleCSVExport()}>
              template csv file
            </a>{' '}
            for you to fill out.
          </p>
        </Callout>
        <FileUpload
          acceptedFileTypes={['text/csv']}
          acceptedFileTypesShort={['CSV']}
          maxFileSizeInMb={1}
          onFileUpload={handleUploadedFile}
          multipleFiles={false}
          acceptedFilesClass="flex justify-between text-sm"
        />
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton onClick={() => setIsOpen(false)}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { BulkCSVCreateEvidenceDialog }
