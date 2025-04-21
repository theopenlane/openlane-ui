'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Import, Info } from 'lucide-react'
import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { useCreateBulkCSVTask } from '@/lib/graphql-hooks/tasks'
import { useNotification } from '@/hooks/useNotification'

const BulkCSVCreateTaskDialog = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createBulkTask, isPending: isSubmitting } = useCreateBulkCSVTask()

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createBulkTask({ input: uploadedFile.file! })
      successNotification({
        title: 'Tasks Created',
        description: `Tasks has been successfully created`,
      })
      setIsOpen(false)
    } catch (error) {
      errorNotification({
        title: 'Error',
        description: 'There was an error creating the tasks. Please try again.',
      })
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFile(uploadedFile)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button icon={<Import />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
        </DialogHeader>
        <Card className="mt-6 p-4 flex gap-3">
          <Info className="mt-1" width={16} height={16} />
          <div>
            <p className="font-semibold">Column format</p>
            <p className="text-sm">
              You can upload a csv containing tasks. Please refer to our{' '}
              <a href="https://docs.theopenlane.io/docs/api/graph-api/objects#task" target="_blank" className="text-brand hover:underline">
                documentation
              </a>{' '}
              for column format. We also provide a <span className="text-brand hover:underline">template csv file</span> for you to fill out.
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

export { BulkCSVCreateTaskDialog }
