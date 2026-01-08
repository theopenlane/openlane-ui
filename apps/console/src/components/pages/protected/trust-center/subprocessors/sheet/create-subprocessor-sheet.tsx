'use client'

import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { SquarePlus } from 'lucide-react'

import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetFooter } from '@repo/ui/sheet'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateSubprocessor } from '@/lib/graphql-hooks/subprocessors'

import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { TagsField } from './form-fields/tags-field'
import { AddExistingDialog } from '../table/add-existing-dialog'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  logoFile: z.instanceof(File, { message: 'Logo is required' }),
  tags: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof schema>

export const CreateSubprocessorSheet = () => {
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
          tags: data.tags,
          //   logoRemoteURL: ""
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <AddExistingDialog />
      <SheetTrigger asChild>
        <Button variant="primary" icon={<SquarePlus size={16} />} iconPosition="left">
          Create Subprocessor
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetTitle className="text-2xl mb-6">Create Subprocessor</SheetTitle>

        <FormProvider {...formMethods}>
          <form id="subprocessor-form" className="space-y-6 ">
            <NameField isEditing />
            <LogoField isEditing onFileUpload={handleLogoUpload} existingLogo={null} />
            <DescriptionField isEditing />
            <TagsField isEditing />
          </form>
        </FormProvider>

        <SheetFooter className="mt-8">
          <Button onClick={handleSubmit(onSubmit)} type="button" form="subprocessor-form" variant="primary" disabled={isSubmitting || !uploadedLogo} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Subprocessor'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
