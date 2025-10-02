'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { cloneElement, useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useCreateInternalPolicy, useCreateUploadInternalPolicy } from '@/lib/graphql-hooks/policy.ts'
import { TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useRouter } from 'next/navigation'
import { PolicyProcedureTabEnum } from '@/components/shared/enum-mapper/policy-procedure-tab-enum'
import { CreateInternalPolicyInput } from '@repo/codegen/src/schema'
import { FileUp, Import, Info, Trash2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'
import UploadTab from '../../../evidence/upload/upload-tab'
import DirectLinkCreatePolicyProcedureTab from '@/components/shared/policy-procedure-shared-tabs/direct-link-create-policy-procedure-tab'
import { Card } from '@repo/ui/cardpanel'

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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [uploadedFiles, setUploadedFiles] = useState<TUploadedFile[]>([])
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createUploadPolicy, isPending: isSubmitting } = useCreateUploadInternalPolicy()
  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateInternalPolicy()

  const [defaultTab, setDefaultTab] = useState<PolicyProcedureTabEnum>(PolicyProcedureTabEnum.Upload)
  const [policyMdDocumentLink, setPolicyMdDocumentLink] = useState<string>('')
  const [policyMdDocumentLinks, setPolicyMdDocumentLinks] = useState<string[]>([])
  const hasSingleFileOrLink = policyMdDocumentLinks.length + uploadedFiles.length === 1
  const hasFileOrLink = policyMdDocumentLinks.length + uploadedFiles.length > 0

  const handleUpload = async () => {
    if (uploadedFiles.length > 0) {
      await handleFileUpload()
    }

    if (policyMdDocumentLinks.length > 0) {
      await handleLinkUpload()
    }

    setIsOpen(false)
  }

  const handleLinkUpload = async () => {
    const dataArray: { input: CreateInternalPolicyInput }[] = policyMdDocumentLinks.map((link, index) => ({
      input: {
        name: `Name ${link}-${index}`,
        url: link,
      },
    }))
    if (hasSingleFileOrLink) {
      try {
        const policy = await createPolicy(dataArray[0])
        successNotification({
          title: 'Policy Created',
          description: 'Policy has been successfully created',
        })
        router.push(`/policies/${policy.createInternalPolicy.internalPolicy.id}/view`)
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
          await createPolicy(singleData)
        }
        successNotification({
          title: 'Policy Created',
          description: 'Policy(s) have been successfully created',
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
        const policy = await createUploadPolicy({ policyFile: uploadedFiles[0].file })
        successNotification({
          title: 'Policy Created',
          description: 'Policy has been successfully created',
        })
        router.push(`/policies/${policy.createUploadInternalPolicy.internalPolicy.id}/view`)
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
          await createUploadPolicy({ policyFile: uploadedFile.file! })
        }
        successNotification({
          title: 'Policy Created',
          description: 'Policy(s) have been successfully created',
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
    setPolicyMdDocumentLink('')
    setPolicyMdDocumentLinks([])
  }

  const handleAddLink = (link: string) => {
    if (link.trim() === '') return

    setPolicyMdDocumentLinks((prev) => [...prev, link])
    setPolicyMdDocumentLink('')
  }

  const handleDeleteLink = (index: number) => {
    setPolicyMdDocumentLinks((prev) => prev.filter((_, i) => i !== index))
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
            Import Existing Policy(s)
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Existing Policy(s)</DialogTitle>
        </DialogHeader>
        <Card className="mt-6 p-4 flex gap-3">
          <Info className="mt-1" width={16} height={16} />
          <div>
            <p className="text-sm">
              You can upload one or multiple files at once, or pull documents directly from a URL (for example, if your policies are stored in GitHub as Markdown). Each uploaded file will be imported
              separately and create its own policy
            </p>
          </div>
        </Card>
        <Tabs variant="solid" defaultValue={defaultTab} onValueChange={(val) => setDefaultTab(val as PolicyProcedureTabEnum)}>
          <TabsList>
            <TabsTrigger className="bg-unset" value={PolicyProcedureTabEnum.Upload}>
              Upload
            </TabsTrigger>
            <TabsTrigger className="bg-unset" value={PolicyProcedureTabEnum.DirectLink}>
              Direct Link
            </TabsTrigger>
          </TabsList>
          <UploadTab
            acceptedFileTypes={['text/plain; charset=utf-8', 'text/plain', 'text/markdown', 'text/x-markdown', 'text/mdx', '.mdx', '.md']}
            acceptedFileTypesShort={['TXT', 'MD', 'MDX']}
            uploadedFile={handleUploadedFile}
          />
          <DirectLinkCreatePolicyProcedureTab setLink={setPolicyMdDocumentLink} link={policyMdDocumentLink} onAddLink={handleAddLink} />
        </Tabs>
        {policyMdDocumentLinks.map((link, index) => (
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
        {uploadedFiles.map((file, index) => (
          <div key={index} className="border rounded-sm p-3 mt-4 flex items-center justify-between bg-secondary">
            <div className="mr-2">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <div className="font-semibold">{file.name}</div>
              <div className="text-sm">Size: {Math.round(file.size! / 1024)} KB</div>
            </div>
            <Trash2 className="hover:cursor-pointer" onClick={() => handleDeleteFile(index)} />
          </div>
        ))}
        <div className="flex">
          <Button onClick={handleUpload} loading={isSubmitting} disabled={isSubmitting || !hasFileOrLink}>
            {isSubmitting || isCreating ? 'Uploading...' : 'Upload'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CreatePolicyUploadDialog
