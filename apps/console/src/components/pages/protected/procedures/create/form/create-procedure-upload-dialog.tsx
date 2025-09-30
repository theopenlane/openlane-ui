'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Import, Info } from 'lucide-react'
import React, { cloneElement, useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useCreateUploadProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import UploadTab from '../../../evidence/upload/upload-tab'
import DirectLinkCreateTab from './create-procedure-via-direct-link'

type TCreateProcedureUploadDialogProps = {
  trigger?: React.ReactElement<
    Partial<{
      onClick: React.MouseEventHandler
      disabled: boolean
      loading: boolean
    }>
  >
}

const CreateProcedureUploadDialog: React.FC<TCreateProcedureUploadDialogProps> = ({ trigger }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFile, setUploadedFile] = useState<TUploadedFile | null>(null)
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadProcedure, isPending: isSubmitting } = useCreateUploadProcedure()
  const defaultTab = 'upload'
  const [procedureMdDocumentLink, setProcedureMdDocumentLink] = useState<string>('')
  const [procedureMdDocumentLinks, setProcedureMdDocumentLinks] = useState<string[]>([])

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      return
    }

    try {
      await createUploadProcedure({ procedureFile: uploadedFile.file! })
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
  // const handleAddProcedureLink = async () => {
  //   if (procedureMdDocumentLink.trim() === '') return

  //   setProcedureMdDocumentLinks((prev) => [...prev, procedureMdDocumentLink])
  //   setProcedureMdDocumentLink('')
  // }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFile(uploadedFile)
  }

  useEffect(() => {
    if (!isOpen) {
      console.log('isopen')
      setProcedureMdDocumentLink('')
      setProcedureMdDocumentLinks([])
    }
  }, [isOpen])

  const handleAddLink = (link: string) => {
    if (link.trim() === '') return

    setProcedureMdDocumentLinks((prev) => [...prev, link])
    setProcedureMdDocumentLink('')
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
        <Tabs variant="solid" defaultValue={defaultTab}>
          <TabsList>
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="directLink">Direct Link</TabsTrigger>
            <TabsTrigger value="existingFiles">Existing Files</TabsTrigger>
          </TabsList>
          <UploadTab
            acceptedFileTypes={['text/plain; charset=utf-8', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
            acceptedFileTypesShort={['TXT', 'DOCX']}
            uploadedFile={handleUploadedFile}
          />
          <DirectLinkCreateTab setProcedureMdDocumentLink={setProcedureMdDocumentLink} procedureMdDocumentLink={procedureMdDocumentLink} onAddLink={handleAddLink}></DirectLinkCreateTab>
        </Tabs>
        <Info className="mt-1" width={16} height={16} />
        <div className="flex">
          <Button onClick={handleFileUpload} loading={isSubmitting} disabled={isSubmitting}>
            {isSubmitting ? 'Uploading...' : 'Upload'}
          </Button>
          <Button onClick={() => console.log(procedureMdDocumentLinks)} loading={isSubmitting} disabled={isSubmitting}>
            Check
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProcedureUploadDialog
