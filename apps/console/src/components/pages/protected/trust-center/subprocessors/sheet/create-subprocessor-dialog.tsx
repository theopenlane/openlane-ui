'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Pencil, Save, Trash2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@repo/ui/dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateSubprocessor, useUpdateSubprocessor, useBulkDeleteSubprocessors } from '@/lib/graphql-hooks/subprocessors'

import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

/* ----------------------------- ZOD SCHEMA ----------------------------- */
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
})

type FormData = z.infer<typeof schema>

/* ------------------------------ COMPONENT ------------------------------ */
export const CreateSubprocessorDialog = ({
  existing,
}: {
  existing?: {
    id: string
    name: string
    description?: string | null
    logoRemoteURL?: string | null
  } | null
}) => {
  const isEditMode = !!existing

  const [open, setOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(!existing)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: createSubprocessor } = useCreateSubprocessor()
  const { mutateAsync: updateSubprocessor } = useUpdateSubprocessor()
  const { mutateAsync: bulkDeleteSubprocessors } = useBulkDeleteSubprocessors()

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      logoFile: undefined,
    },
  })

  const { handleSubmit, reset, formState } = formMethods
  const { isSubmitting } = formState

  /* ----------------------------- Helpers ----------------------------- */

  const handleLogoUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      setUploadedLogo(uploaded.file)
      formMethods.setValue('logoFile', uploaded.file, { shouldValidate: true })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!existing?.id) return

    try {
      await bulkDeleteSubprocessors({ ids: [existing.id] })
      successNotification({
        title: 'Subprocessor Deleted',
        description: 'The subprocessor has been successfully deleted.',
      })

      setIsDeleteDialogOpen(false)
      setOpen(false)
    } catch (error) {
      errorNotification({
        title: 'Error Deleting Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  const onSubmit = async (data: FormData) => {
    console.log(data)
    try {
      if (isEditMode) {
        await updateSubprocessor({
          updateSubprocessorId: existing!.id,
          input: {
            name: data.name,
            description: data.description || '',
          },
          logoFile: data.logoFile,
        })

        successNotification({
          title: 'Subprocessor Updated',
          description: 'The subprocessor has been updated successfully.',
        })

        setIsEditing(false)
      } else {
        if (!data.logoFile) throw new Error('Please upload a logo.')

        await createSubprocessor({
          input: {
            name: data.name,
            description: data.description || '',
          },
          logoFile: data.logoFile,
        })

        successNotification({
          title: 'Subprocessor Created',
          description: 'The subprocessor has been created successfully.',
        })

        setOpen(false)
      }
    } catch (error) {
      errorNotification({
        title: isEditMode ? 'Error Updating' : 'Error Creating',
        description: parseErrorMessage(error),
      })
    }
  }

  const prefillForm = useCallback(() => {
    if (!existing) {
      reset({ name: '', description: '', logoFile: undefined })
      return
    }

    reset({
      name: existing.name ?? '',
      description: existing.description ?? '',
      logoFile: undefined,
    })
  }, [existing, reset])

  useEffect(() => {
    if (open) prefillForm()
  }, [open, prefillForm])

  /* ----------------------------- RENDER ----------------------------- */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create custom</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Subprocessor Details' : 'Create Subprocessor'}</DialogTitle>
          <DialogDescription />
        </DialogHeader>

        <FormProvider {...formMethods}>
          <form id="subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-4">
            <NameField isEditing={isEditing} />
            <DescriptionField isEditing={isEditing} />
            <LogoField isEditing={isEditing} onFileUpload={handleLogoUpload} existingLogo={existing?.logoRemoteURL ?? null} />
          </form>
        </FormProvider>

        <DialogFooter className="flex justify-between mt-6">
          {/* Left side (Delete in edit mode) */}
          {isEditMode && (
            <Button variant="secondary" icon={<Trash2 size={16} />} iconPosition="left" className="!p-2 h-8" onClick={() => setIsDeleteDialogOpen(true)}>
              Delete
            </Button>
          )}

          {/* Right side buttons */}
          <div className="flex gap-2">
            {isEditMode ? (
              <>
                {!isEditing ? (
                  <Button type="button" variant="secondary" icon={<Pencil size={16} />} iconPosition="left" className="!p-2 h-8" onClick={() => setIsEditing(true)}>
                    Edit
                  </Button>
                ) : (
                  <>
                    <Button type="button" variant="secondary" className="!p-2 h-8" onClick={prefillForm}>
                      Cancel
                    </Button>
                    <Button type="submit" form="subprocessor-form" variant="primary" icon={<Save />} className="!p-2 h-8" disabled={isSubmitting}>
                      Save
                    </Button>
                  </>
                )}
              </>
            ) : (
              <Button type="submit" form="subprocessor-form" variant="primary" disabled={isSubmitting || !uploadedLogo}>
                Create
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Subprocessor"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{existing?.name ?? 'this subprocessor'}</b>.
          </>
        }
        confirmationText="Delete"
        confirmationTextVariant="destructive"
      />
    </Dialog>
  )
}
