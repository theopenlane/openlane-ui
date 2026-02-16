'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { useCloneBulkCSVControl } from '@/lib/graphql-hooks/control'
import { TUploadedFile } from '../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { Callout } from '@/components/shared/callout/callout'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type BulkCsvCreateControlDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
}

const BulkCSVCloneControlDialog: React.FC<BulkCsvCreateControlDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: cloneBulkControl, isPending: isSubmitting } = useCloneBulkCSVControl()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await cloneBulkControl({ input: uploadedFile.file! })
      successNotification({
        title: 'Controls Created',
        description: `Controls have been successfully created`,
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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!isOpen) {
      setUploadedFile(null)
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFile(uploadedFile)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogTrigger asChild className="bg-transparent self-start">
          {cloneElement(trigger, {
            onClick: () => setIsOpen(true),
            disabled: isSubmitting,
          })}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button icon={<Upload />} className="h-8 px-2! bg-transparent" iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Bulk Upload From Standards
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[640px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Bulk Upload From Standards</DialogTitle>
        </DialogHeader>
        <Callout title="CSV Format">
          Upload your existing controls using a CSV file based on one of our supported standards. This allows you to import your controls while ensuring they stay up to date as future changes are
          published to the upstream standard. Refer to our{' '}
          <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/onboarding/controls`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
            documentation
          </a>{' '}
          for the required column format, where you can also download a CSV template to fill out.
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
          <Button className="primary" onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting || !uploadedFile}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton onClick={() => setIsOpen(false)}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { BulkCSVCloneControlDialog }
