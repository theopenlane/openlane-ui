'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose, Pencil, Save, Trash2 } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'

import {
  useCreateTrustCenterSubprocessor,
  useGetTrustCenterSubprocessors,
  useUpdateTrustCenterSubprocessor,
  useBulkDeleteTrustCenterSubprocessors,
} from '@/lib/graphql-hooks/trust-center-subprocessors'
import { useGetSubprocessors } from '@/lib/graphql-hooks/subprocessors'

import { SubprocessorSelectField } from './form-fields/subprocessor-select-field'
import { CategoryField } from './form-fields/category-field'
import { CountriesField } from './form-fields/countries-field'

const schema = z.object({
  subprocessorID: z.string().min(1, 'Please select a subprocessor'),
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
})

type FormData = z.infer<typeof schema>

export const CreateTrustCenterSubprocessorSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const isCreateMode = searchParams.get('create') === 'true'
  const trustCenterSubprocessorId = searchParams.get('id')
  const isEditMode = !!trustCenterSubprocessorId

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [open, setOpen] = useState(isCreateMode || !!trustCenterSubprocessorId)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: createTCSubprocessor } = useCreateTrustCenterSubprocessor()
  const { mutateAsync: updateTCSubprocessor } = useUpdateTrustCenterSubprocessor()
  const { mutateAsync: bulkDeleteTCSubprocessors } = useBulkDeleteTrustCenterSubprocessors()

  const { trustCenterSubprocessors } = useGetTrustCenterSubprocessors({
    enabled: !!trustCenterSubprocessorId,
  })

  const existing = useMemo(() => trustCenterSubprocessors.find((item) => item?.id === trustCenterSubprocessorId) ?? null, [trustCenterSubprocessors, trustCenterSubprocessorId])

  const { subprocessors } = useGetSubprocessors({
    enabled: true,
  })

  const subprocessorOptions = useMemo(
    () =>
      subprocessors.map((sp) => ({
        label: sp?.name ?? '',
        value: sp?.id ?? '',
      })) ?? [],
    [subprocessors],
  )

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subprocessorID: '',
      category: '',
      countries: [],
    },
  })

  const { handleSubmit, reset, formState } = formMethods
  const { isSubmitting } = formState

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    const params = new URLSearchParams(window.location.search)
    if (!isOpen) {
      params.delete('create')
      params.delete('id')
    }
    router.push(`?${params.toString()}`)
  }

  const handleDeleteConfirm = async () => {
    if (!trustCenterSubprocessorId) return

    try {
      await bulkDeleteTCSubprocessors({ ids: [trustCenterSubprocessorId] })
      successNotification({
        title: 'Subprocessor Removed',
        description: 'The Trust Center subprocessor entry has been deleted.',
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
        await updateTCSubprocessor({
          id: trustCenterSubprocessorId!,
          input: {
            subprocessorID: data.subprocessorID,
            category: data.category,
            countries: data.countries,
          },
        })

        successNotification({
          title: 'Subprocessor Updated',
          description: 'The Trust Center subprocessor has been successfully updated.',
        })

        setIsEditing(false)
      } else {
        await createTCSubprocessor({
          input: {
            subprocessorID: data.subprocessorID,
            category: data.category,
            countries: data.countries,
          },
        })

        successNotification({
          title: 'Subprocessor Added',
          description: 'The Trust Center subprocessor has been successfully created.',
        })

        handleOpenChange(false)
      }
    } catch (error) {
      errorNotification({
        title: isEditMode ? 'Error Updating Trust Center Subprocessor' : 'Error Creating Trust Center Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  const prefillForm = useCallback(() => {
    if (!existing) return

    reset({
      subprocessorID: existing?.subprocessor?.id ?? '',
      category: existing?.category ?? '',
      countries: existing?.countries ?? [],
    })
  }, [existing, reset])

  useEffect(() => {
    if (isEditMode && existing) {
      prefillForm()
    } else if (!isEditMode) {
      reset({
        subprocessorID: '',
        category: '',
        countries: [],
      })
    }
  }, [isEditMode, existing, reset, open, prefillForm])

  useEffect(() => {
    if (trustCenterSubprocessorId || isCreateMode) setOpen(true)
  }, [trustCenterSubprocessorId, isCreateMode])

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
                  {/* Copy link */}
                  <Button
                    className="h-8 p-2"
                    icon={<Copy />}
                    iconPosition="left"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      successNotification({
                        title: 'Link copied',
                        description: 'Trust Center Subprocessor link copied to clipboard.',
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

                          <Button variant="primary" type="submit" form="tc-subprocessor-form" className="h-8 p-2" icon={<Save />} iconPosition="left">
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
                  title="Delete Trust Center Subprocessor"
                  description={
                    <>
                      This action cannot be undone. This will permanently remove <b>{existing?.subprocessor?.name ?? 'this Trust Center subprocessor'}</b>.
                    </>
                  }
                  confirmationText="Delete"
                  confirmationTextVariant="destructive"
                />
              </div>
            ) : (
              <div className="pt-4 flex justify-end">
                <Button type="submit" form="tc-subprocessor-form" disabled={isSubmitting} variant="secondary" icon={<Save />} iconPosition="left">
                  Create
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="tc-subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <SubprocessorSelectField options={subprocessorOptions} isEditing={isEditing || isCreateMode} />

            <CategoryField isEditing={isEditing || isCreateMode} />

            <CountriesField isEditing={isEditing || isCreateMode} />
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
