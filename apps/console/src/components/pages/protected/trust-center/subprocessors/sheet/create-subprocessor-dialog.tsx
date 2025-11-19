'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateSubprocessor } from '@/lib/graphql-hooks/subprocessors'

import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

/* ------------------------------ SCHEMA ------------------------------ */

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logoFile: z.instanceof(File, { message: 'Logo is required' }),
})

type FormData = z.infer<typeof schema>

/* ------------------------------ COMPONENT ------------------------------ */

export const CreateSubprocessorDialog = () => {
  const [open, setOpen] = useState(false)
  const [uploadedLogo, setUploadedLogo] = useState<File | null>(null)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createSubprocessor } = useCreateSubprocessor()

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

  const handleLogoUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      setUploadedLogo(uploaded.file)
      formMethods.setValue('logoFile', uploaded.file, { shouldValidate: true })
    }
  }

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      reset()
      setUploadedLogo(null)
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
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
      reset()
      setUploadedLogo(null)
    } catch (error) {
      errorNotification({
        title: 'Error Creating Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>Create custom</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Subprocessor</DialogTitle>
        </DialogHeader>

        <FormProvider {...formMethods}>
          <form id="subprocessor-form" className="space-y-5 mt-4">
            <NameField isEditing />
            <DescriptionField isEditing />
            <LogoField isEditing onFileUpload={handleLogoUpload} existingLogo={null} />
          </form>
        </FormProvider>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit(onSubmit)} type="button" form="subprocessor-form" variant="primary" disabled={isSubmitting || !uploadedLogo}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
