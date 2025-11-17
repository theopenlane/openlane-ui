'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose, Pencil, Save, Trash2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCreateSubprocessor, useUpdateSubprocessor, useBulkDeleteSubprocessors, useGetSubprocessors } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'

/* ----------------------------- ZOD SCHEMA ----------------------------- */
const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
})

type FormData = z.infer<typeof schema>

/* --------------------------------------------------------------------- */

export const CreateSubprocessorSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isCreateMode = searchParams.get('create') === 'true'
  const subprocessorId = searchParams.get('id')
  const isEditMode = !!subprocessorId

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null)
  const [open, setOpen] = useState(isCreateMode || !!subprocessorId)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: createSubprocessor } = useCreateSubprocessor()
  const { mutateAsync: updateSubprocessor } = useUpdateSubprocessor()
  const { mutateAsync: bulkDeleteSubprocessors } = useBulkDeleteSubprocessors()

  // Fetch single subprocessor (from your pagination list)
  const { data: allSubprocessors } = useGetSubprocessors({
    enabled: true,
  })

  const existing = allSubprocessors?.subprocessors.edges?.find((sp) => sp?.node?.id === subprocessorId) || null

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

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    const params = new URLSearchParams(window.location.search)
    if (!isOpen) {
      params.delete('create')
      params.delete('id')
    }
    router.push(`?${params.toString()}`)
  }

  const handleLogoUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      setUploadedLogo(uploaded.file)
      formMethods.setValue('logoFile', uploaded.file, { shouldValidate: true })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!subprocessorId) return

    try {
      await bulkDeleteSubprocessors({ ids: [subprocessorId] })
      successNotification({
        title: 'Subprocessor Deleted',
        description: 'The subprocessor has been successfully deleted.',
      })
      setIsDeleteDialogOpen(false)
      handleOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error Deleting Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditMode) {
        await updateSubprocessor({
          updateSubprocessorId: subprocessorId!,
          input: {
            name: data.name,
            description: data.description || '',
          },
          logoFile: data.logoFile,
        })

        successNotification({
          title: 'Subprocessor Updated',
          description: 'The subprocessor has been successfully updated.',
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
          description: 'The subprocessor has been successfully created.',
        })

        handleOpenChange(false)
      }
    } catch (error) {
      errorNotification({
        title: isEditMode ? 'Error Updating Subprocessor' : 'Error Creating Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  const prefillForm = useCallback(() => {
    if (!existing) return
    reset({
      name: existing?.node?.name ?? '',
      description: existing?.node?.description ?? '',
      logoFile: undefined,
    })
  }, [existing, reset])

  useEffect(() => {
    if (isEditMode && existing) {
      prefillForm()
    } else if (!isEditMode) {
      reset({ name: '', description: '', logoFile: undefined })
    }
  }, [isEditMode, existing, reset, open, prefillForm])

  useEffect(() => {
    if (subprocessorId || isCreateMode) setOpen(true)
  }, [subprocessorId, isCreateMode])

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
                        description: 'Subprocessor link copied to clipboard.',
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
                          <Button
                            className="h-8 p-2"
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setIsEditing(false)
                              prefillForm()
                            }}
                          >
                            Cancel
                          </Button>

                          <Button variant="primary" type="submit" form="subprocessor-form" className="h-8 p-2" icon={<Save />} iconPosition="left">
                            Save
                          </Button>
                        </>
                      ) : (
                        <Button icon={<Pencil size={16} strokeWidth={2} />} iconPosition="left" type="button" variant="secondary" className="!p-2 h-8" onClick={() => setIsEditing(true)}>
                          Edit
                        </Button>
                      )}

                      <Button type="button" icon={<Trash2 size={16} strokeWidth={2} />} iconPosition="left" variant="secondary" className="!p-2 h-8" onClick={() => setIsDeleteDialogOpen(true)}>
                        Delete
                      </Button>
                    </>
                  )}
                </div>

                <ConfirmationDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                  onConfirm={handleDeleteConfirm}
                  title="Delete Subprocessor"
                  description={
                    <>
                      This action cannot be undone. This will permanently remove <b>{existing?.node?.name ?? 'this subprocessor'}</b>.
                    </>
                  }
                  confirmationText="Delete"
                  confirmationTextVariant="destructive"
                />
              </div>
            ) : (
              <div className="pt-4 flex justify-end">
                <Button type="submit" form="subprocessor-form" disabled={isSubmitting || !uploadedLogo} variant="secondary">
                  Create
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <NameField isEditing={isEditing || isCreateMode} />
            <DescriptionField isEditing={isEditing || isCreateMode} />
            <LogoField isEditing={isEditing || isCreateMode} onFileUpload={handleLogoUpload} existingLogo={existing?.node?.logoRemoteURL ?? null} />
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
