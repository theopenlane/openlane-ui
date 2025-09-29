'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Info, Upload } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { exportCSV } from '@/lib/export'
import { DOCS_URL, GRAPHQL_OBJECT_DOCS } from '@/constants'
import { useCreateBulkCSVTemplate } from '@/lib/graphql-hooks/templates'
import { TUploadedFile } from '../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type BulkCsvCreateTemplateDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
}

const BulkCSVCreateTemplatelDialog: React.FC<BulkCsvCreateTemplateDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkTemplate, isPending: isSubmitting } = useCreateBulkCSVTemplate()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createBulkTemplate({ input: uploadedFile.file! })
      successNotification({
        title: 'Templates Created',
        description: `Templates has been successfully created`,
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
    await exportCSV({ filename: 'template' })
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
          <Button icon={<Upload />} className="h-8 !px-2 bg-transparent" iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Bulk Upload
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
        </DialogHeader>
        <Card className="mt-6 p-4 flex gap-3">
          <Info className="mt-1" width={16} height={16} />
          <div>
            <p className="font-semibold">Column format</p>
            <p className="text-sm">
              You can upload a csv containing templates. Please refer to our{' '}
              <a href={`${DOCS_URL}${GRAPHQL_OBJECT_DOCS}#template`} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                documentation
              </a>
              for column format. We also provide a{' '}
              <span className="text-brand hover:underline cursor-pointer" onClick={() => handleCSVExport()}>
                template csv file
              </span>{' '}
              for you to fill out.
            </p>
          </div>
        </Card>
        <FileUpload
          acceptedFileTypes={['text/csv']}
          acceptedFileTypesShort={['CSV']}
          maxFileSizeInMb={1}
          onFileUpload={handleUploadedFile}
          multipleFiles={false}
          acceptedFilesClass="flex justify-between text-sm"
        />
        <div className="flex">
          <Button onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export { BulkCSVCreateTemplatelDialog }
