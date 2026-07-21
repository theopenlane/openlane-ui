'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Import } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { useControllableOpen } from '@/hooks/useControllableOpen'
import { useCreateBulkCSVProcedure } from '@/lib/graphql-hooks/procedure'
import { type TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Callout } from '@/components/shared/callout/callout'
import { exportCSV } from '@/lib/export'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TBulkCSVCreateProcedureDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const handleCSVExport = async () => {
  await exportCSV({ filename: 'procedure' })
}

const BulkCSVCreateProcedureDialog: React.FC<TBulkCSVCreateProcedureDialogProps> = ({ trigger, open: openProp, onOpenChange }) => {
  const [isOpen, setIsOpen, isControlled] = useControllableOpen({ open: openProp, onOpenChange })
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkProcedure, isPending: isSubmitting } = useCreateBulkCSVProcedure()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createBulkProcedure({ input: uploadedFile.file ?? undefined })
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
          {/* eslint-disable-next-line @eslint-react/no-clone-element */}
          {cloneElement(trigger, {
            onClick: () => setIsOpen(true),
            disabled: isSubmitting,
          })}
        </DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button icon={<Import />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Import existing document
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[640px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Bulk upload</DialogTitle>
        </DialogHeader>
        <Callout title="CSV Format">
          <p className="text-sm">
            You can upload a csv containing procedures. Please refer to our{' '}
            <a className="text-brand hover:underline cursor-pointer" onClick={() => handleCSVExport()}>
              template csv file for available fields and format.
            </a>{' '}
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
          <Button className="primary" onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting || !uploadedFile}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <CancelButton onClick={() => setIsOpen(false)}></CancelButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BulkCSVCreateProcedureDialog
