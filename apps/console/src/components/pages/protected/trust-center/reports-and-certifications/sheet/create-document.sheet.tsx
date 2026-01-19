'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose, Pencil, Save, Trash2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { TrustCenterDocTrustCenterDocumentVisibility, TrustCenterDocWatermarkStatus } from '@repo/codegen/src/schema'
import { useCreateTrustCenterDoc, useDeleteTrustCenterDoc, useGetTrustCenter, useGetTrustCenterDocById, useUpdateTrustCenterDoc } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { DocumentFiles } from './document-files'
import { TitleField } from './form-fields/title-field'
import { CategoryField } from './form-fields/category-field'
import { VisibilityField } from './form-fields/visibility-field'
import { TagsField } from './form-fields/tags-field'
import { FileField } from './form-fields/file-field'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Label } from '@repo/ui/label'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { ObjectEnum } from '@/lib/authz/enums/object-enum'
import { canDelete, canEdit } from '@/lib/authz/utils'
import { Switch } from '@repo/ui/switch'
import DocumentsWatermarkStatusChip from '../../documents-watermark-status-chip.'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  visibility: z.nativeEnum(TrustCenterDocTrustCenterDocumentVisibility, {
    required_error: 'Visibility is required',
  }),
  tags: z.array(z.string()).optional(),
  file: z.instanceof(File).optional(),
  status: z.nativeEnum(TrustCenterDocWatermarkStatus).optional(),
})

type FormData = z.infer<typeof schema>

export const CreateDocumentSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCreateMode = searchParams.get('create') === 'true'
  const documentId = searchParams.get('id')
  const isEditMode = !!documentId

  const { data: permission } = useAccountRoles(ObjectEnum.TRUST_CENTER_DOCUMENT, documentId)

  const isEditAllowed = canEdit(permission?.roles)
  const isDeleteAllowed = canDelete(permission?.roles)

  const [isEditing, setIsEditing] = useState(false)
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

  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? null
  const watermarkEnabled = trustCenterData?.trustCenters?.edges?.[0]?.node?.watermarkConfig?.isEnabled ?? null
  const [isWatermarkEnabled, setWatermarkEnabled] = useState(watermarkEnabled ?? false)
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

  const { handleSubmit, reset, formState } = formMethods
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
          },
          updateTrustCenterDocId: documentId!,
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
      prefillForm()
    } else if (!isEditMode) {
      reset({
        title: '',
        category: '',
        visibility: TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
        tags: [],
        file: undefined,
      })
    }
  }, [isEditMode, documentData, reset, open, prefillForm])

  useEffect(() => {
    if (documentId || isCreateMode) setOpen(true)
  }, [documentId, isCreateMode])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetTitle />
        <SheetDescription />
        <SheetHeader>
          <div className="flex justify-between">
            <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleOpenChange(false)} />

            {isEditMode ? (
              <div className="flex justify-start gap-2 items-center">
                <div className="flex gap-3">
                  <Button
                    className="h-8 p-2"
                    icon={<Copy />}
                    iconPosition="left"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      successNotification({
                        title: 'Link copied',
                        description: 'Document link has been copied to clipboard.',
                      })
                    }}
                  >
                    Copy link
                  </Button>

                  {isSubmitting ? (
                    <Button className="h-8 p-2" variant="primary" icon={<Save />} iconPosition="left" disabled>
                      Saving...
                    </Button>
                  ) : (
                    <>
                      {isEditing ? (
                        <>
                          <CancelButton
                            onClick={() => {
                              setIsEditing(false)
                              prefillForm()
                            }}
                          ></CancelButton>
                          <SaveButton form="document-form" />
                        </>
                      ) : (
                        <>
                          {isEditAllowed && (
                            <Button
                              icon={<Pencil size={16} strokeWidth={2} />}
                              iconPosition="left"
                              type="button"
                              variant="secondary"
                              className="p-2! h-8"
                              aria-label="Edit document"
                              onClick={() => setIsEditing(true)}
                            >
                              Edit
                            </Button>
                          )}
                        </>
                      )}

                      {isDeleteAllowed && (
                        <Button
                          type="button"
                          icon={<Trash2 size={16} strokeWidth={2} />}
                          iconPosition="left"
                          variant="secondary"
                          className="p-2! h-8"
                          onClick={() => setIsDeleteDialogOpen(true)}
                          aria-label="Delete document"
                        >
                          Delete
                        </Button>
                      )}
                    </>
                  )}
                </div>

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
              </div>
            ) : (
              <div className="pt-4 flex justify-end">
                <Button type="submit" form="document-form" disabled={isSubmitting || !uploadedFile} variant="secondary">
                  Create
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="document-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <TitleField isEditing={isEditing || isCreateMode} />
            <CategoryField isEditing={isEditing || isCreateMode} />
            <VisibilityField isEditing={isEditing || isCreateMode} />
            <TagsField isEditing={isEditing || isCreateMode} />
            {isCreateMode && (
              <div className="flex flex-col gap-2">
                <Label>Watermark enabled</Label>
                <Switch
                  checked={isWatermarkEnabled}
                  onCheckedChange={(checked) => {
                    setWatermarkEnabled(checked)
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
            {isEditMode ? <DocumentFiles documentId={documentId!} editAllowed={isEditAllowed} /> : <FileField uploadedFile={uploadedFile} isEditing={isEditing} onFileUpload={handleFileUpload} />}
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
