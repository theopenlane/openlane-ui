'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Import, Trash2 } from 'lucide-react'
import React, { cloneElement, useState, useEffect } from 'react'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useCreateProcedure, useCreateUploadProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import UploadTab from '../../../evidence/upload/upload-tab'
import { PolicyProcedureTabEnum } from '@/components/shared/enum-mapper/policy-procedure-tab-enum'
import { CreateProcedureInput } from '@repo/codegen/src/schema'
import { useRouter } from 'next/navigation'
import DirectLinkCreatePolicyProcedureTab from '@/components/shared/policy-procedure-shared-tabs/direct-link-create-policy-procedure-tab'
import { Callout } from '@/components/shared/callout/callout'
import { COMPLIANCE_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'

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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFiles, setUploadedFiles] = useState<TUploadedFile[]>([])
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadProcedure, isPending: isSubmitting } = useCreateUploadProcedure()
  const { mutateAsync: createProcedure, isPending: isCreating } = useCreateProcedure()

  const [defaultTab, setDefaultTab] = useState<PolicyProcedureTabEnum>(PolicyProcedureTabEnum.Upload)
  const [procedureMdDocumentLink, setProcedureMdDocumentLink] = useState<string>('')
  const [procedureMdDocumentLinks, setProcedureMdDocumentLinks] = useState<string[]>([])
  const hasSingleFileOrLink = procedureMdDocumentLinks.length + uploadedFiles.length === 1
  const hasFileOrLink = procedureMdDocumentLinks.length + uploadedFiles.length > 0

  const handleUpload = async () => {
    if (uploadedFiles.length > 0) {
      await handleFileUpload()
    }

    if (procedureMdDocumentLinks.length > 0) {
      await handleLinkUpload()
    }

    setIsOpen(false)
  }

  const handleLinkUpload = async () => {
    const dataArray: { input: CreateProcedureInput }[] = procedureMdDocumentLinks.map((link, index) => ({
      input: {
        name: `Name ${link}-${index}`,
        url: link,
      },
    }))
    if (hasSingleFileOrLink) {
      try {
        const createdProcedure = await createProcedure(dataArray[0])
        successNotification({
          title: 'Procedure Created',
          description: 'Procedure has been successfully created',
        })
        router.push(`/procedures/${createdProcedure.createProcedure.procedure.id}/view`)
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    } else {
      try {
        for (const singleData of dataArray) {
          await createProcedure(singleData)
        }
        successNotification({
          title: 'Procedure Created',
          description: 'Procedure(s) have been successfully created',
        })
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    }
  }

  const handleFileUpload = async () => {
    if (hasSingleFileOrLink) {
      try {
        const createdProcedure = await createUploadProcedure({ procedureFile: uploadedFiles[0].file })
        successNotification({
          title: 'Procedure Created',
          description: 'Procedure has been successfully created',
        })
        router.push(`/procedures/${createdProcedure.createUploadProcedure.procedure.id}/view`)
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    } else {
      try {
        for (const uploadedFile of uploadedFiles) {
          await createUploadProcedure({ procedureFile: uploadedFile.file! })
        }
        successNotification({
          title: 'Procedure Created',
          description: 'Procedure(s) have been successfully created',
        })
      } catch (error) {
        const errorMessage = parseErrorMessage(error)
        errorNotification({
          title: 'Error',
          description: errorMessage,
        })
      }
    }
  }

  const handleUploadedFile = (uploadedFile: TUploadedFile) => {
    setUploadedFiles((prev) => [...prev, uploadedFile])
  }

  const handleDeleteFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (!isOpen) {
      clearState()
    }
  }, [isOpen])

  const clearState = () => {
    setProcedureMdDocumentLink('')
    setProcedureMdDocumentLinks([])
  }

  const handleAddLink = (link: string) => {
    if (link.trim() === '') return

    setProcedureMdDocumentLinks((prev) => [...prev, link])
    setProcedureMdDocumentLink('')
  }

  const handleDeleteLink = (index: number) => {
    setProcedureMdDocumentLinks((prev) => prev.filter((_, i) => i !== index))
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
            Import Existing Procedure(s)
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[640px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Import Existing Procedure(s)</DialogTitle>
        </DialogHeader>
        <Callout title="File Format">
          You can upload one or multiple files at once, or pull documents directly from a URL (for example, if your policies are stored in GitHub as Markdown). Each uploaded file will be imported
          separately and create its own procedure. For more details on supported file types and formatting, please refer to our{' '}
          <a href={`${COMPLIANCE_MANAGEMENT_DOCS_URL}/onboarding/policies`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
            documentation
          </a>
          .
        </Callout>
        <Tabs defaultValue={defaultTab} onValueChange={(val) => setDefaultTab(val as PolicyProcedureTabEnum)}>
          <TabsList>
            <TabsTrigger className="bg-unset" value={PolicyProcedureTabEnum.Upload}>
              Upload
            </TabsTrigger>
            <TabsTrigger className="bg-unset" value={PolicyProcedureTabEnum.DirectLink}>
              Direct Link
            </TabsTrigger>
          </TabsList>
          <UploadTab
            acceptedFileTypes={[
              'text/plain; charset=utf-8',
              'text/plain',
              'text/markdown',
              'text/x-markdown',
              'text/mdx',
              '.mdx',
              '.md',
              '.doc',
              '.docx',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ]}
            acceptedFileTypesShort={['TXT', 'MD', 'MDX', 'DOC', 'DOCX']}
            uploadedFile={handleUploadedFile}
          />
          <DirectLinkCreatePolicyProcedureTab setLink={setProcedureMdDocumentLink} link={procedureMdDocumentLink} onAddLink={handleAddLink} />
        </Tabs>
        {procedureMdDocumentLinks.map((link, index) => (
          <div key={index} className="border rounded-sm p-3 mt-4 flex items-center justify-between bg-secondary">
            <div>
              <div className="font-semibold">
                <div className="truncate max-w-sm">{link}</div>
              </div>
              <div className="text-sm">Direct link</div>
            </div>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDeleteLink(index)} />
          </div>
        ))}
        <div className="grid grid-cols-4 gap-6 max-h-96 overflow-y-auto">
          {uploadedFiles.map((file, index) => (
            <UploadedFileDetailsCard key={index} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={handleDeleteFile} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <Button className="primary" onClick={handleUpload} loading={isSubmitting} disabled={isSubmitting || !hasFileOrLink}>
            {isSubmitting || isCreating ? 'Uploading...' : 'Upload'}
          </Button>
          <Button variant="back" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreateProcedureUploadDialog
