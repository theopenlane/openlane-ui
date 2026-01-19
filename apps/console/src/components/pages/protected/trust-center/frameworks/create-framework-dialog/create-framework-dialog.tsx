'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTrigger, DialogClose, DialogTitle } from '@repo/ui/dialog'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { StandardNode, useCreateStandard, useUpdateStandard } from '@/lib/graphql-hooks/standards'
import { TitleField } from './form-fields/title-field'
import { DescriptionField } from './form-fields/description-field'
import { UploadField } from './form-fields/upload-field'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  logoFile: z.instanceof(File).nullable().optional(),
})

type FormData = z.infer<typeof schema>

interface StandardDialogProps {
  trigger: React.ReactNode
  standard?: StandardNode
  resetPagination: () => void
}

export const StandardDialog = ({ trigger, standard, resetPagination }: StandardDialogProps) => {
  const [open, setOpen] = useState(false)
  const isEditMode = !!standard
  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createStandard } = useCreateStandard()
  const { mutateAsync: updateStandard } = useUpdateStandard()

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
    },
  })

  const { handleSubmit, reset, formState } = formMethods
  const { isSubmitting } = formState

  const prefillForm = useCallback(() => {
    if (!standard) return

    reset({
      title: standard?.shortName ?? '',
      description: standard?.description ?? '',
    })
  }, [standard, reset])

  const onSubmit = async (data: FormData) => {
    try {
      resetPagination()

      if (isEditMode && standard?.id) {
        await updateStandard({
          updateStandardId: standard?.id,
          input: {
            shortName: data.title,
            description: data.description,
          },
          logoFile: data.logoFile ?? undefined,
        })

        successNotification({ title: 'Standard updated', description: 'Changes have been saved.' })
      } else {
        await createStandard({
          input: {
            name: data.title,
            shortName: data.title,
            description: data.description,
          },
          logoFile: data.logoFile ?? undefined,
        })

        successNotification({ title: 'Standard created', description: 'A new standard has been added.' })
        setOpen(false)
      }
    } catch (err) {
      errorNotification({ title: 'Error', description: parseErrorMessage(err) })
    }
  }

  useEffect(() => {
    if (open) {
      if (isEditMode && standard) {
        prefillForm()
      } else if (!isEditMode) {
        reset({ title: '', description: '' })
      }
    }
  }, [open, isEditMode, standard, reset, prefillForm])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogTitle />

      <DialogContent className="overflow-hidden max-w-xl">
        <DialogHeader className=" flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-4">
            <p className="text-xl font-semibold">{isEditMode ? `Edit Standard ${standard?.shortName}` : 'Add Custom Framework'}</p>
          </div>
        </DialogHeader>

        <DialogDescription className="sr-only">Standard management form</DialogDescription>

        <FormProvider {...formMethods}>
          <form id="standard-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <TitleField />
            <DescriptionField />
            <UploadField initialUrl={standard?.logoFile?.presignedURL ?? null} />
          </form>
        </FormProvider>
        <div className="flex gap-2 justify-end">
          <DialogClose asChild>
            <CancelButton />
          </DialogClose>
          <SaveButton form="standard-form" disabled={isSubmitting} isSaving={isSubmitting} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
