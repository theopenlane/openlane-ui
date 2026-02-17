'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Upload } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { exportCSV } from '@/lib/export'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { GRAPHQL_OBJECT_DOCS } from '@/constants/docs'
import { Callout } from '@/components/shared/callout/callout'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { TUploadedFile } from '../upload/TUploadedFile'
import { toHumanLabel, pluralizeTypeName } from '@/utils/strings'

type GenericBulkCsvCreateDialogProps = {
  entityType: ObjectTypes
  onBulkCreate: (file: File) => Promise<void>
}

const GenericBulkCSVCreateDialog: React.FC<GenericBulkCsvCreateDialogProps> = ({ entityType, onBulkCreate }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const entityLabel = toHumanLabel(entityType)
  const entityLabelPlural = pluralizeTypeName(entityLabel)

  const handleFileUpload = async () => {
    if (!uploadedFile?.file) {
      return
    }

    setIsSubmitting(true)
    try {
      await onBulkCreate(uploadedFile.file)
      successNotification({
        title: `${entityLabelPlural} Created`,
        description: `${entityLabelPlural} have been successfully created`,
      })
      setIsOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFile(uploadedFile)
  }

  const handleCSVExport = async () => {
    await exportCSV({ filename: entityType.toLowerCase() })
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="transparent"
          className={`px-1 w-full flex !justify-start space-x-2 cursor-pointer`}
          onClick={() => {
            setIsOpen(true)
          }}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          <Upload size={16} strokeWidth={2} />
          <span>Bulk Upload</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[640px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Bulk Upload {entityLabelPlural}</DialogTitle>
        </DialogHeader>
        <Callout title="CSV Format">
          <p className="text-sm">
            You can upload a csv containing {entityLabelPlural}. Please refer to our{' '}
            <a href={`${GRAPHQL_OBJECT_DOCS}#${entityType.toLowerCase()}`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
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

export { GenericBulkCSVCreateDialog }
