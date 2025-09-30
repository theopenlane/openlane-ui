'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Import, Info } from 'lucide-react'
import React, { cloneElement, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useNotification } from '@/hooks/useNotification'
import { useCreateUploadInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import { DOCS_URL, GRAPHQL_OBJECT_DOCS } from '@/constants'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

type TCreatePolicyUploadDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
}

const CreatePolicyUploadDialog: React.FC<TCreatePolicyUploadDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadPolicy, isPending: isSubmitting } = useCreateUploadInternalPolicy()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createUploadPolicy({ policyFile: uploadedFile.file! })
      successNotification({
        title: 'Policies Created',
        description: `Policies has been successfully created`,
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
        <DialogTrigger>
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
          <DialogTitle>Import existing document</DialogTitle>
        </DialogHeader>
        <Card className="mt-6 p-4 flex gap-3">
          <Info className="mt-1" width={16} height={16} />
          <div>
            <p className="font-semibold">Column format</p>
            <p className="text-sm">
              You can upload a csv containing policies. Please refer to our{' '}
              <a href={`${DOCS_URL}${GRAPHQL_OBJECT_DOCS}#policies`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
                documentation
              </a>{' '}
              for column format. We also provide a <span className="text-brand hover:underline">template csv file</span> for you to fill out.
            </p>
          </div>
        </Card>
        <FileUpload
          acceptedFileTypes={['text/plain; charset=utf-8', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
          acceptedFileTypesShort={['TXT', 'MD', 'DOCX']}
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

export default CreatePolicyUploadDialog
