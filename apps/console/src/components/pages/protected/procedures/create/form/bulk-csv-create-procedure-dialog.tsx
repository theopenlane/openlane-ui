'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Import } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { useCreateBulkCSVProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { GRAPHQL_OBJECT_DOCS } from '@/constants/docs'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Callout } from '@/components/shared/callout/callout'
import { exportCSV } from '@/lib/export'

type TBulkCSVCreateProcedureDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
}

const handleCSVExport = async () => {
  await exportCSV({ filename: 'procedure' })
}

const BulkCSVCreateProcedureDialog: React.FC<TBulkCSVCreateProcedureDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkProcedure, isPending: isSubmitting } = useCreateBulkCSVProcedure()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createBulkProcedure({ input: uploadedFile.file! })
      successNotification({
        title: 'Procedure Created',
        description: `Procedure has been successfully created`,
      })
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
          <Button icon={<Import />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Import existing document
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk upload</DialogTitle>
        </DialogHeader>
        <Callout title="CSV Format">
          <p className="text-sm">
            You can upload a csv containing procedures. Please refer to our{' '}
            <a href={`${GRAPHQL_OBJECT_DOCS}#procedures`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
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
        <div className="flex justify-end gap-2">
          <Button variant="back" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button className="btn-secondary" onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BulkCSVCreateProcedureDialog
