'use client'

import React, { useEffect, useState } from 'react'
import { Input } from '@repo/ui/input'
import { Button } from '@repo/ui/button'
import { Label } from '@repo/ui/label'
import { Trash2, Upload } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import MultipleSelector from '@repo/ui/multiple-selector'
import FileUpload from '@/components/shared/file-upload/file-upload'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { TrustCenterDocTrustCenterDocumentVisibility } from '@repo/codegen/src/schema'
import { useCreateTrustCenterDoc, useDeleteTrustCenterDoc, useGetTrustCenter, useGetTrustCenterDocById, useUpdateTrustCenterDoc } from '@/lib/graphql-hooks/trust-center'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { enumToOptions } from '../../tasks/table/table-config'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().min(1, 'Category is required'),
  visibility: z.nativeEnum(TrustCenterDocTrustCenterDocumentVisibility, {
    required_error: 'Visibility is required',
  }),
  tags: z.array(z.string()).optional(),
  file: z.instanceof(File).optional(),
})

type FormData = z.infer<typeof schema>

export const CreateDocumentSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasCreateParam = searchParams.get('create') === 'true'
  const documentId = searchParams.get('id')

  const [open, setOpen] = useState(hasCreateParam || !!documentId)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createDoc } = useCreateTrustCenterDoc()
  const { mutateAsync: updateDoc } = useUpdateTrustCenterDoc()
  const { data: trustCenterData } = useGetTrustCenter()
  const { data: documentData } = useGetTrustCenterDocById({
    trustCenterDocId: documentId || '',
    enabled: !!documentId,
  })

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { mutateAsync: deleteDoc } = useDeleteTrustCenterDoc()

  const trustCenterID = trustCenterData?.trustCenters?.edges?.[0]?.node?.id ?? null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      category: '',
      visibility: TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
      tags: [],
      file: undefined,
    },
  })

  const visibilityValue = watch('visibility')

  const isEditMode = !!documentId
  const existingFile = documentData?.trustCenterDoc?.file

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    const current = new URLSearchParams(window.location.search)
    if (!isOpen) {
      current.delete('create')
      current.delete('id')
    }
    router.push(`?${current.toString()}`)
  }

  const handleFileUpload = (uploadedFile: TUploadedFile) => {
    if (uploadedFile.file) {
      setUploadedFile(uploadedFile.file)
      setValue('file', uploadedFile.file, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (!trustCenterID) throw new Error('Trust Center ID not found.')

      if (documentId) {
        await updateDoc({
          input: {
            trustCenterID,
            title: data.title,
            category: data.category,
            visibility: data.visibility,
            tags: data.tags ?? [],
          },
          updateTrustCenterDocId: documentId,
          trustCenterDocFile: data.file,
        })

        if (data.file) {
          await createDoc({
            input: {
              title: data.title,
              category: data.category,
              visibility: data.visibility,
              tags: data.tags ?? [],
              trustCenterID,
            },
            trustCenterDocFile: data.file,
          })
          handleOpenChange(false)
        }

        successNotification({
          title: 'Document Updated',
          description: 'The document has been successfully updated.',
        })
      } else {
        if (!data.file) throw new Error('Please upload a PDF file.')

        await createDoc({
          input: {
            title: data.title,
            category: data.category,
            visibility: data.visibility,
            tags: data.tags ?? [],
            trustCenterID,
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
        title: documentId ? 'Error Updating Document' : 'Error Uploading Document',
        description: message,
      })
    }
  }

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
    if (documentId && documentData?.trustCenterDoc) {
      const doc = documentData.trustCenterDoc
      reset({
        title: doc.title ?? '',
        category: doc.category ?? '',
        visibility: doc.visibility ?? TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
        tags: doc.tags ?? [],
        file: undefined,
      })
    } else if (!documentId) {
      reset({
        title: '',
        category: '',
        visibility: TrustCenterDocTrustCenterDocumentVisibility.NOT_VISIBLE,
        tags: [],
        file: undefined,
      })
    }
  }, [documentId, documentData, reset, open])

  useEffect(() => {
    if (documentId || hasCreateParam) {
      setOpen(true)
    }
  }, [documentId, hasCreateParam])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetHeader className="flex flex-row items-center justify-between">
          <SheetTitle>{isEditMode ? 'Edit Document' : 'Upload Document'}</SheetTitle>

          {isEditMode && (
            <>
              <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} icon={<Trash2 size={16} />} iconPosition="left">
                Delete
              </Button>

              <ConfirmationDialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
                title="Delete Document"
                description={
                  <>
                    Are you sure you want to delete this document?
                    <br />
                    This action cannot be undone.
                  </>
                }
                confirmationText="Delete"
                confirmationTextVariant="destructive"
                showInput
              />
            </>
          )}
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          {/* Title */}
          <div>
            <Label>Title</Label>
            <Input placeholder="Document title" {...register('title')} />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Input placeholder="Category" {...register('category')} />
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
          </div>

          {/* Visibility */}
          <div>
            <Label>Visibility</Label>
            <Select
              onValueChange={(val) =>
                setValue('visibility', val as TrustCenterDocTrustCenterDocumentVisibility, {
                  shouldValidate: true,
                })
              }
              value={visibilityValue || ''}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                {enumToOptions(TrustCenterDocTrustCenterDocumentVisibility).map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.visibility && <p className="text-red-500 text-sm mt-1">{errors.visibility.message}</p>}
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <MultipleSelector creatable value={(field.value ?? []).map((tag) => ({ value: tag, label: tag }))} onChange={(selected) => field.onChange(selected.map((s) => s.value))} />
              )}
            />
            {errors.tags && <p className="text-red-500 text-sm mt-1">{errors.tags.message as string}</p>}
          </div>

          {/* File Upload + Existing File */}
          <div>
            <Label>Document file</Label>
            {existingFile && !uploadedFile && existingFile.presignedURL && (
              <div className="flex items-center justify-between mb-2">
                <a href={existingFile.presignedURL} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 truncate" title={existingFile.providedFileName}>
                  {existingFile.providedFileName}
                </a>
              </div>
            )}
            <FileUpload onFileUpload={handleFileUpload} maxFileSizeInMb={10} acceptedFileTypes={['application/pdf']} acceptedFileTypesShort={['PDF']} multipleFiles={false} />
            {errors.file && <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>}
          </div>

          {/* Submit */}
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={isSubmitting || (!uploadedFile && !isEditMode)} icon={<Upload size={16} strokeWidth={2} />} iconPosition="left">
              {'Submit'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
