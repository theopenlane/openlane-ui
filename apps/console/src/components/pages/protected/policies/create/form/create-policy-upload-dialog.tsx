'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { cloneElement, useEffect, useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { useNotification } from '@/hooks/useNotification'
import { useCreateInternalPolicy, useCreateUploadInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useGraphQLClient } from '@/hooks/useGraphQLClient'
import { useControllableOpen } from '@/hooks/useControllableOpen'
import { type TUploadedFile } from '../../../evidence/upload/types/TUploadedFile'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { INTEGRATIONS_DOCUMENT_FILTER_URL } from '@/constants'
import { PolicyProcedureTabEnum } from '@/components/shared/enum-mapper/policy-procedure-tab-enum'
import { type CreateInternalPolicyInput, InternalPolicyDocumentManagementMode } from '@repo/codegen/src/schema'
import { Import, Trash2 } from 'lucide-react'
import { Tabs } from '@repo/ui/tabs'
import { RadioGroup, RadioGroupItem } from '@repo/ui/radio-group'
import { Label } from '@repo/ui/label'
import UploadTab from '../../../evidence/upload/upload-tab'
import { POLICY_MANAGEMENT_DOCS_URL } from '@/constants/docs'
import { Callout } from '@/components/shared/callout/callout'
import UploadedFileDetailsCard from '@/components/shared/file-upload/uploaded-file-details-card'
import { wordAcceptedFileTypes } from '@/components/shared/file-upload/file-upload-config'
import { PolicyTemplateBrowser } from '@/components/shared/github-selector/policy-selector'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { isWordFilename } from '@/components/pages/protected/policies/policy-management-utils'
import { ManagementModeOptions } from '@/components/shared/enum-mapper/policy-enum'

type TCreatePolicyUploadDialogProps = {
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

const CreatePolicyUploadDialog: React.FC<TCreatePolicyUploadDialogProps> = ({ trigger, open: openProp, onOpenChange }) => {
  const router = useRouter()
  const [isOpen, setIsOpen, isControlled] = useControllableOpen({ open: openProp, onOpenChange })
  const [uploadedFiles, setUploadedFiles] = useState<TUploadedFile[]>([])
  const { successNotification, errorNotification } = useNotification()
  const { queryClient } = useGraphQLClient()
  const { mutateAsync: createUploadPolicy, isPending: isSubmitting } = useCreateUploadInternalPolicy({ autoInvalidate: false })
  const { mutateAsync: createPolicy, isPending: isCreating } = useCreateInternalPolicy({ autoInvalidate: false })

  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false)

  const [defaultTab, setDefaultTab] = useState<PolicyProcedureTabEnum>(PolicyProcedureTabEnum.Upload)
  const [_policyMdDocumentLink, setPolicyMdDocumentLink] = useState<string>('')
  const [policyMdDocumentLinks, setPolicyMdDocumentLinks] = useState<string[]>([])
  const [managementMode, setManagementMode] = useState<InternalPolicyDocumentManagementMode>(InternalPolicyDocumentManagementMode.OPENLANE_MANAGED)
  const hasSingleFileOrLink = policyMdDocumentLinks.length + uploadedFiles.length === 1
  const hasFileOrLink = policyMdDocumentLinks.length + uploadedFiles.length > 0
  const canKeepAsWord = useMemo(() => uploadedFiles.length > 0 && uploadedFiles.every((f) => isWordFilename(f.name)), [uploadedFiles])

  useEffect(() => {
    if (!canKeepAsWord && managementMode === InternalPolicyDocumentManagementMode.EXTERNAL_REFERENCE) {
      setManagementMode(InternalPolicyDocumentManagementMode.OPENLANE_MANAGED)
    }
  }, [canKeepAsWord, managementMode])

  const handleUpload = async () => {
    if (uploadedFiles.length > 0) {
      await handleFileUpload()
    }

    if (policyMdDocumentLinks.length > 0) {
      await handleLinkUpload()
    }

    queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    setIsOpen(false)
  }

  const handleTemplateFileSelect = (file: TUploadedFile) => {
    setUploadedFiles((prev) => [...prev, file])
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

  const modeFor = (file: TUploadedFile | undefined): InternalPolicyDocumentManagementMode =>
    managementMode === InternalPolicyDocumentManagementMode.EXTERNAL_REFERENCE && isWordFilename(file?.name)
      ? InternalPolicyDocumentManagementMode.EXTERNAL_REFERENCE
      : InternalPolicyDocumentManagementMode.OPENLANE_MANAGED

  const handleFileUpload = async () => {
    if (hasSingleFileOrLink) {
      try {
        const policy = await createUploadPolicy({
          internalPolicyFile: uploadedFiles[0].file,
          managementMode: modeFor(uploadedFiles[0]),
        })
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
          await createUploadPolicy({
            internalPolicyFile: uploadedFile.file ?? new File([], ''),
            managementMode: modeFor(uploadedFile),
          })
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

  const clearState = () => {
    setPolicyMdDocumentLink('')
    setPolicyMdDocumentLinks([])
    setManagementMode(InternalPolicyDocumentManagementMode.OPENLANE_MANAGED)
  }

  useEffect(() => {
    if (!isOpen) {
      clearState()
    }
  }, [isOpen])

  // const handleAddLink = (link: string) => {
  //   if (link.trim() === '') return

  //   setPolicyMdDocumentLinks((prev) => [...prev, link])
  //   setPolicyMdDocumentLink('')
  // }

  const handleDeleteLink = (index: number) => {
    setPolicyMdDocumentLinks((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {/* eslint-disable-next-line @eslint-react/no-clone-element */}
          {cloneElement(trigger, {
            onClick: () => setIsOpen(true),
            disabled: isSubmitting,
          })}
        </DialogTrigger>
      ) : !isControlled ? (
        <DialogTrigger asChild>
          <Button icon={<Import />} iconPosition="left" onClick={() => setIsOpen(true)} disabled={isSubmitting} loading={isSubmitting}>
            Import Existing Policy(s)
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-[640px] bg-secondary">
        <DialogHeader>
          <DialogTitle>Import Existing Policy(s)</DialogTitle>
        </DialogHeader>
        <Callout title="File Format">
          You can upload one or multiple files at once, or pull documents directly from a public URL (for example, if your policies are stored in GitHub as Markdown). Each uploaded file will be
          imported separately and create its own policy. Want to import from Google Drive? Try our{' '}
          <Link href={INTEGRATIONS_DOCUMENT_FILTER_URL} className="text-brand hover:underline">
            Google Drive integration
          </Link>{' '}
          instead. For more details on supported file types and formatting, please refer to our{' '}
          <a href={`${POLICY_MANAGEMENT_DOCS_URL}/import`} target="_blank" className="text-brand hover:underline" rel="noreferrer">
            documentation
          </a>
          .
        </Callout>
        <Tabs defaultValue={defaultTab} onValueChange={(val) => setDefaultTab(val as PolicyProcedureTabEnum)}>
          {/* <TabsList>
            <TabsTrigger className="bg-unset" value={PolicyProcedureTabEnum.Upload}>
              Upload
            </TabsTrigger>
            <TabsTrigger className="bg-unset" value={PolicyProcedureTabEnum.DirectLink}>
              Direct Link
            </TabsTrigger>
          </TabsList> */}
          <UploadTab
            acceptedFileTypes={['text/plain; charset=utf-8', 'text/plain', 'text/markdown', 'text/x-markdown', 'text/mdx', '.mdx', '.md', ...wordAcceptedFileTypes]}
            acceptedFileTypesShort={['TXT', 'MD', 'MDX', 'DOC', 'DOCX']}
            uploadedFile={handleUploadedFile}
          />
          {/* <DirectLinkCreatePolicyProcedureTab setLink={setPolicyMdDocumentLink} link={policyMdDocumentLink} onAddLink={handleAddLink} /> */}
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
        <div className="grid grid-cols-4 gap-6 max-h-96 overflow-y-auto">
          {uploadedFiles.map((file, index) => (
            <UploadedFileDetailsCard key={index} fileName={file.name} fileSize={file.size} index={index} handleDeleteFile={handleDeleteFile} />
          ))}
        </div>
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-2 border rounded-md p-3 bg-secondary">
            <span className="text-sm font-medium">Management mode</span>
            <RadioGroup value={managementMode} onValueChange={(v) => setManagementMode(v as InternalPolicyDocumentManagementMode)} className="gap-3">
              {ManagementModeOptions.filter((option) => option.value !== InternalPolicyDocumentManagementMode.INTEGRATION).map((option) => {
                const isExternal = option.value === InternalPolicyDocumentManagementMode.EXTERNAL_REFERENCE
                const disabled = isExternal && !canKeepAsWord
                const id = `mgmt-${option.value}`
                const description = isExternal
                  ? canKeepAsWord
                    ? 'View this document in Openlane while continuing to manage it in Microsoft Word.'
                    : 'Available only when every uploaded file is a .doc or .docx.'
                  : 'Parse this document and edit it directly in Openlane.'

                return (
                  <div key={option.value} className="flex items-start gap-2">
                    <RadioGroupItem id={id} value={option.value} disabled={disabled} className="mt-0.5" />
                    <Label htmlFor={id} className={`font-normal ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="block text-xs text-muted-foreground">{description}</span>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Button variant="primary" onClick={handleUpload} loading={isSubmitting} disabled={isSubmitting || !hasFileOrLink}>
            {isSubmitting || isCreating ? 'Uploading...' : 'Upload Files'}
          </Button>
          <CancelButton onClick={() => setIsOpen(false)}></CancelButton>
        </div>
      </DialogContent>
      <PolicyTemplateBrowser isOpen={showTemplateBrowser} onClose={() => setShowTemplateBrowser(false)} onFileSelect={handleTemplateFileSelect} />
    </Dialog>
  )
}

export default CreatePolicyUploadDialog
