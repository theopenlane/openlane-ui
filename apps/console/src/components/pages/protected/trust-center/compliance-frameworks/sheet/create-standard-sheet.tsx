'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Button } from '@repo/ui/button'
import { PanelRightClose, Pencil, Save, Trash2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useCreateStandard, useGetStandardDetails, useUpdateStandard } from '@/lib/graphql-hooks/standards'
import { useDeleteStandard } from '@/lib/graphql-hooks/standards'

import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { DescriptionField } from './form-fields/description-field'
import { TitleField } from './form-fields/title-field'
import { TagsField } from './form-fields/tags-field'
import { UploadField } from './form-fields/upload-field'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  logoFile: z.instanceof(File).nullable().optional(),
})

type FormData = z.infer<typeof schema>

export const CreateStandardSheet = ({ resetPagination }: { resetPagination: () => void }) => {
  const router = useRouter()
  const params = useSearchParams()
  const isCreate = params.get('create') === 'true'
  const id = params.get('id')
  const isEditMode = !!id

  const [isEditing, setIsEditing] = useState(isCreate)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [open, setOpen] = useState(isCreate || !!id)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: createStandard } = useCreateStandard()
  const { mutateAsync: updateStandard } = useUpdateStandard()
  const { mutateAsync: deleteStandard } = useDeleteStandard()

  const { data: standardData } = useGetStandardDetails(id)

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      tags: [],
    },
  })

  const { handleSubmit, reset, formState } = formMethods
  const { isSubmitting } = formState

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    const current = new URLSearchParams(window.location.search)
    if (!value) {
      current.delete('create')
      current.delete('id')
    }
    router.push(`?${current.toString()}`)
  }

  const prefillForm = useCallback(() => {
    if (!standardData?.standard) return
    const s = standardData.standard

    reset({
      title: s.shortName ?? '',
      description: s.description ?? '',
      tags: s.tags ?? [],
    })
  }, [standardData, reset])

  const onSubmit = async (data: FormData) => {
    try {
      resetPagination()

      if (isEditMode) {
        await updateStandard({
          updateStandardId: id!,
          input: {
            shortName: data.title,
            description: data.description,
            tags: data.tags ?? [],
          },
          logoFile: data.logoFile ?? undefined,
        })

        successNotification({
          title: 'Standard updated',
          description: 'Changes have been saved.',
        })
        setIsEditing(false)
      } else {
        await createStandard({
          input: {
            name: data.title,
            shortName: data.title,
            description: data.description,
            tags: data.tags ?? [],
          },
          logoFile: data.logoFile ?? undefined,
        })

        successNotification({
          title: 'Standard created',
          description: 'A new standard has been added.',
        })
        handleOpenChange(false)
      }
    } catch (err) {
      errorNotification({
        title: 'Error',
        description: parseErrorMessage(err),
      })
    }
  }

  const handleDelete = async () => {
    if (!id) return
    try {
      resetPagination()

      await deleteStandard({ deleteStandardId: id })

      successNotification({
        title: 'Standard Deleted',
        description: 'The standard has been permanently removed.',
      })

      setDeleteDialogOpen(false)
      handleOpenChange(false)
    } catch (err) {
      errorNotification({
        title: 'Error deleting standard',
        description: parseErrorMessage(err),
      })
    }
  }

  useEffect(() => {
    if (isEditMode && standardData?.standard) {
      prefillForm()
    } else if (isCreate) {
      reset({
        title: '',
        description: '',
        tags: [],
      })
    }
  }, [isEditMode, isCreate, standardData, reset, prefillForm])

  useEffect(() => {
    if (id || isCreate) setOpen(true)
  }, [id, isCreate])

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetTitle></SheetTitle>
        <SheetDescription />

        <SheetHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <PanelRightClose size={16} className="cursor-pointer" onClick={() => handleOpenChange(false)} />
              <p className="text-2xl">{isCreate ? 'Create Standard' : `Update ${standardData?.standard.name}`}</p>
            </div>
            {isEditMode ? (
              <div className="flex gap-3 items-center">
                {isSubmitting ? (
                  <Button className="h-8 p-2" variant="primary" disabled icon={<Save />}>
                    Saving...
                  </Button>
                ) : isEditing ? (
                  <>
                    <Button
                      className="h-8 p-2"
                      variant="secondary"
                      onClick={() => {
                        setIsEditing(false)
                        prefillForm()
                      }}
                    >
                      Cancel
                    </Button>
                    <Button className="h-8 p-2" variant="primary" icon={<Save />} form="standard-form" type="submit">
                      Save
                    </Button>
                  </>
                ) : (
                  <Button className="h-8 p-2" variant="secondary" icon={<Pencil size={16} />} onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                )}

                <Button className="h-8 p-2" variant="secondary" icon={<Trash2 size={16} />} onClick={() => setDeleteDialogOpen(true)}>
                  Delete
                </Button>
              </div>
            ) : (
              <Button form="standard-form" type="submit" disabled={isSubmitting} variant="secondary">
                Create
              </Button>
            )}
          </div>

          <ConfirmationDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Standard"
            description="This action cannot be undone."
            confirmationText="Delete"
            confirmationTextVariant="destructive"
            onConfirm={handleDelete}
          />
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="standard-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
            <TitleField isEditing={isEditing || isCreate} />
            <DescriptionField isEditing={isEditing || isCreate} />
            <TagsField isEditing={isEditing || isCreate} />
            <UploadField isEditing={isEditing || isCreate} initialUrl={standardData?.standard?.logoFile?.presignedURL ?? null} />
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
