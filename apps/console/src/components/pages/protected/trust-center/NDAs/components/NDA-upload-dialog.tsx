'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Loader2 } from 'lucide-react'
import { useCreateTrustCenterNDA } from '@/lib/graphql-hooks/trust-center-NDA'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

interface NDAUploadDialogProps {
  triggerText?: string
}

export const NDAUploadDialog = ({ triggerText = 'Upload NDA' }: NDAUploadDialogProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { successNotification, errorNotification } = useNotification()

  const { data: trustCenterData } = useGetTrustCenter()
  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? ''

  const { mutateAsync: createNda, isPending } = useCreateTrustCenterNDA()

  const handleFileSelect = (uploaded: TUploadedFile) => {
    if (uploaded?.file) {
      setSelectedFile(uploaded.file)
    }
  }

  const handleSave = async () => {
    if (!selectedFile) return

    try {
      await createNda({
        input: { trustCenterID },
        templateFiles: [selectedFile],
      })

      successNotification({
        title: 'NDA Uploaded',
        description: `Successfully uploaded ${selectedFile.name}`,
      })

      setIsOpen(false)
      setSelectedFile(null)
    } catch (error) {
      errorNotification({
        title: 'Upload Failed',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload NDA Document</DialogTitle>
          <DialogDescription>Upload a PDF version of the Non-Disclosure Agreement. New requests will use this document.</DialogDescription>
        </DialogHeader>

        <div className="relative grid gap-4 py-4">
          <FileUpload acceptedFileTypes={['application/pdf']} acceptedFileTypesShort={['PDF']} maxFileSizeInMb={10} multipleFiles={false} onFileUpload={handleFileSelect} />
          {selectedFile && <p className="truncate text-sm text-muted-foreground font-medium">Selected: {selectedFile.name}</p>}
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedFile || isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save NDA
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
