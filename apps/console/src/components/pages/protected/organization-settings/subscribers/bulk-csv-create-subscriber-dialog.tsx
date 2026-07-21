'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { useControllableOpen } from '@/hooks/useControllableOpen'
import { exportCSV } from '@/lib/export'
import { useCreateBulkCSVSubscriber } from '@/lib/graphql-hooks/subscriber'
import { type TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Callout } from '@/components/shared/callout/callout'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type BulkCsvCreateSubscriberDialogProps = {
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

const BulkCSVCreateSubscriberDialog: React.FC<BulkCsvCreateSubscriberDialogProps> = ({ trigger, open: openProp, onOpenChange }) => {
  const [isOpen, setIsOpen, isControlled] = useControllableOpen({ open: openProp, onOpenChange })
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkSubscriber, isPending: isSubmitting } = useCreateBulkCSVSubscriber()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createBulkSubscriber({ input: uploadedFile.file ?? new File([], '') })
      successNotification({
        title: 'Subscribers Created',
        description: `Subscribers has been successfully created`,
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
    await exportCSV({ filename: 'subscriber' })
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
          <Button icon={<Upload />} className="h-8 !px-2 bg-transparent" iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Bulk Upload
          </Button>
        </DialogTrigger>
      ) : null}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
        </DialogHeader>
        <Callout title="CSV Format">
          You can upload a csv containing subscribers. Please refer to our{' '}
          <a className="text-brand hover:underline cursor-pointer" onClick={() => handleCSVExport()}>
            template csv file
          </a>{' '}
          for available fields and format.
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
          <CancelButton onClick={() => setIsOpen(false)}></CancelButton>
          <Button className="btn-secondary" onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting || !uploadedFile}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default BulkCSVCreateSubscriberDialog
