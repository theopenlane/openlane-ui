'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { TrustCenterDocTrustCenterDocumentVisibility, TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'
import { useCreateTrustCenterDoc, useDeleteTrustCenterDoc, useGetTrustCenterDocById, useUpdateTrustCenterDoc } from '@/lib/graphql-hooks/trust-center-doc'
import { useGetTrustCenter } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { DocumentFiles } from './document-files'
import { TitleField } from './form-fields/title-field'
import { CategoryField } from './form-fields/category-field'
import { VisibilityField } from './form-fields/visibility-field'
import { TagsField } from './form-fields/tags-field'
import { FileField } from './form-fields/file-field'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Label } from '@repo/ui/label'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { Switch } from '@repo/ui/switch'
import DocumentsWatermarkStatusChip from '../../documents-watermark-status-chip.'
import { deleteMenuAction, copyLinkMenuAction, SlideoutHeader, type SlideoutMenuAction } from '@/components/shared/crud-base/slideout-header'
import { SlideoutFormFooter } from '@/components/shared/crud-base/slideout-footer'
import { StandardField } from './form-fields/standard-field'
import { Callout } from '@/components/shared/callout/callout'
import { useGetTrustCenterNDAFiles } from '@/lib/graphql-hooks/trust-center-nda-request'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  visibility: z.enum(TrustCenterDocTrustCenterDocumentVisibility, {
    error: (issue) => (issue.input === undefined ? 'Visibility is required' : undefined),
  }),
  tags: z.array(z.string()).optional(),
  file: z.instanceof(File).optional(),
  status: z.enum(TrustCenterDocWatermarkStatus).optional(),
  standardID: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export const CreateDocumentSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCreateMode = searchParams.get('create') === 'true'
  const documentId = searchParams.get('id')
  const isEditMode = !!documentId

  const { data: permission } = useAccountRoles(ObjectTypes.TRUST_CENTER_DOC, documentId)
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()

  const isEditAllowed = canEdit(permission?.roles, session)
  const canCreateDoc = hasPermission(orgPermission?.roles, AccessEnum.CanCreateTrustCenterDocument, session)
  const isDeleteAllowed = canDelete(permission?.roles)

  const [isEditing, setIsEditing] = useState(false)
  const prefilledDocumentRef = useRef<string | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [open, setOpen] = useState(isCreateMode || !!documentId)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createDoc } = useCreateTrustCenterDoc()
  const { mutateAsync: updateDoc } = useUpdateTrustCenterDoc()
  const { mutateAsync: deleteDoc } = useDeleteTrustCenterDoc()

  const { data: trustCenterData } = useGetTrustCenter()
  const { data: documentData } = useGetTrustCenterDocById({
    trustCenterDocId: documentId || '',
    enabled: !!documentId,
  })

  const { latestFile: latestNdaFile } = useGetTrustCenterNDAFiles()
  const hasNdaTemplate = Boolean(latestNdaFile)

  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? null
  const watermarkEnabled = trustCenterData?.trustCenters?.edges?.[0]?.node?.watermarkConfig?.isEnabled ?? null
  const [isWatermarkEnabled, setIsWatermarkEnabled] = useState(watermarkEnabled ?? false)
  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: '',
      visibility: TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
      tags: [],
      file: undefined,
    },
  })

  const { handleSubmit, reset, formState, control } = formMethods
  const visibilityValue = useWatch({ control, name: 'visibility' })
  const { isSubmitting } = formState

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    const current = new URLSearchParams(window.location.search)
    if (!isOpen) {
      current.delete('create')
      current.delete('id')
      handleFileUpload(null)
    }
    router.push(`?${current.toString()}`)
  }

  const handleFileUpload = (uploaded: TUploadedFile | null) => {
    if (uploaded?.file) {
      setUploadedFile(uploaded.file)
      formMethods.setValue('file', uploaded.file, { shouldValidate: true })
    } else {
      setUploadedFile(null)
      formMethods.setValue('file', undefined, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (!trustCenterID) throw new Error('Trust Center ID not found.')

      if (isEditMode) {
        await updateDoc({
          input: {
            title: data.title,
            trustCenterDocKindName: data.category,
            visibility: data.visibility,
            tags: data.tags ?? [],
            ...(data.standardID ? { standardID: data.standardID } : { clearStandard: true }),
          },
          updateTrustCenterDocId: documentId ?? '',
          trustCenterDocFile: data.file,
        })

        successNotification({
          title: 'Document Updated',
          description: 'The document has been successfully updated.',
        })
        setIsEditing(false)
      } else {
        if (!data.file) throw new Error('Please upload a PDF file.')
        await createDoc({
          input: {
            title: data.title,
            trustCenterDocKindName: data.category,
            visibility: data.visibility,
            tags: data.tags ?? [],
            trustCenterID,
            watermarkingEnabled: isWatermarkEnabled,
            standardID: data.standardID || undefined,
          },
          trustCenterDocFile: data.file,
        })

        successNotification({
          title: 'Document Uploaded',
          description: 'The document has been successfully uploaded.',
        })
        handleOpenChange(false)
      }
    } catch (error) {
      const message = parseErrorMessage(error)
      errorNotification({
        title: isEditMode ? 'Error Updating Document' : 'Error Uploading Document',
        description: message,
      })
    } finally {
      handleFileUpload(null)
    }
  }

  const prefillForm = useCallback(() => {
    const doc = documentData?.trustCenterDoc
    reset({
      title: doc?.title ?? '',
      category: doc?.trustCenterDocKindName ?? '',
      visibility: doc?.visibility ?? TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
      tags: doc?.tags ?? [],
      file: undefined,
      status: doc?.watermarkStatus ?? undefined,
      standardID: doc?.standardID ?? undefined,
    })
  }, [documentData, reset])

  const handleDeleteConfirm = async () => {
    if (!documentId) return
    try {
      await deleteDoc({ deleteTrustCenterDocId: documentId })
      successNotification({
        title: 'Document Deleted',
        description: 'The document has been successfully deleted.',
      })
      setIsDeleteDialogOpen(false)
      handleOpenChange(false)
    } catch (error) {
      const message = parseErrorMessage(error)
      errorNotification({
        title: 'Error Deleting Document',
        description: message,
      })
    }
  }

  useEffect(() => {
    if (isEditMode && documentData?.trustCenterDoc) {
      if (prefilledDocumentRef.current === documentId) return

      prefilledDocumentRef.current = documentId
      prefillForm()
    } else if (!isEditMode) {
      prefilledDocumentRef.current = null
      reset({
        title: '',
        category: '',
        visibility: TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
        tags: [],
        file: undefined,
      })
    }
  }, [isEditMode, documentData, documentId, reset, prefillForm])

  useEffect(() => {
    if (documentId || isCreateMode) setOpen(true)
  }, [documentId, isCreateMode])

  const documentHeading = isCreateMode ? 'Create Document' : documentData?.trustCenterDoc?.title || 'Document'

  const documentMenuActions: SlideoutMenuAction[] = isEditMode
    ? [
        copyLinkMenuAction(() => {
          navigator.clipboard.writeText(window.location.href)
          successNotification({
            title: 'Link copied',
            description: 'Document link has been copied to clipboard.',
          })
        }),
        ...(isDeleteAllowed ? [deleteMenuAction(() => setIsDeleteDialogOpen(true))] : []),
      ]
    : []

  return (
    <>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          aria-describedby={undefined}
          side="right"
          className="w-[420px] sm:w-[480px] overflow-y-auto"
          header={
            <SlideoutHeader
              title={documentHeading}
              onClose={() => handleOpenChange(false)}
              onEdit={isEditMode && !isEditing && isEditAllowed ? () => setIsEditing(true) : undefined}
              menuActions={documentMenuActions}
            />
          }
          footer={
            isCreateMode ? (
              <SlideoutFormFooter formId="document-form" onCancel={() => handleOpenChange(false)} isPending={isSubmitting} disabled={!uploadedFile} saveLabel="Create" savingLabel="Creating..." />
            ) : isEditing ? (
              <SlideoutFormFooter
                formId="document-form"
                onCancel={() => {
                  setIsEditing(false)
                  prefillForm()
                }}
                isPending={isSubmitting}
              />
            ) : undefined
          }
        >
          <FormProvider {...formMethods}>
            <form id="document-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <TitleField isEditing={isEditing || isCreateMode} />
              <CategoryField isEditing={isEditing || isCreateMode} isCreateAllowed={isEditAllowed || canCreateDoc} />
              <VisibilityField isEditing={isEditing || isCreateMode} />
              {isCreateMode && visibilityValue === TrustCenterDocTrustCenterDocumentVisibility.PROTECTED && !hasNdaTemplate && (
                <Callout variant="warning" compact>
                  <span>Protected documents require a NDA to be uploaded. </span>
                  <Link href="/trust-center/NDAs" target="_blank" rel="noreferrer" className="underline">
                    Upload NDA
                  </Link>
                </Callout>
              )}
              <StandardField isEditing={isEditing || isCreateMode} />
              <TagsField isEditing={isEditing || isCreateMode} />
              {isCreateMode && (
                <div className="flex flex-col gap-2">
                  <Label>Watermark enabled</Label>
                  <Switch
                    checked={isWatermarkEnabled}
                    onCheckedChange={(checked) => {
                      setIsWatermarkEnabled(checked)
                    }}
                  />
                </div>
              )}
              {isEditMode && (
                <div className="flex flex-col gap-2">
                  <Label>Watermark status</Label>
                  <DocumentsWatermarkStatusChip className="self-start" status={documentData?.trustCenterDoc?.watermarkStatus ?? undefined} />
                </div>
              )}
              {isEditMode ? (
                <DocumentFiles documentId={documentId ?? ''} editAllowed={isEditAllowed} />
              ) : (
                <FileField uploadedFile={uploadedFile} isEditing={isEditing} onFileUpload={handleFileUpload} />
              )}
            </form>
          </FormProvider>
        </SheetContent>
      </Sheet>
      {isEditMode && (
        <ConfirmationDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Delete Document"
          description={
            <>
              This action cannot be undone. This will permanently remove <b>{documentData?.trustCenterDoc?.title || 'this document'}</b>.
            </>
          }
          confirmationText="Delete"
          confirmationTextVariant="destructive"
        />
      )}
    </>
  )
}
