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

const schema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    uploadMode: z.enum(['file', 'url']).default('file'),
    logoFile: z.instanceof(File).optional(),
    logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.uploadMode === 'file' && !data.logoFile) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Logo file is required',
        path: ['logoFile'],
      })
    }
    if (data.uploadMode === 'url' && !data.logoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Logo URL is required',
        path: ['logoUrl'],
      })
    }
  })

type FormData = z.infer<typeof schema>

export const CreateSubprocessorSheet = ({ onCreateSuccess }: { onCreateSuccess: () => void }) => {
  const [open, setOpen] = useState(false)

  const { successNotification, errorNotification } = useNotification()
  const { mutateAsync: createSubprocessor } = useCreateSubprocessor()

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      description: '',
      uploadMode: 'file',
      logoFile: undefined,
      logoUrl: '',
      tags: [],
    },
  })

  const { handleSubmit, reset, formState, watch } = formMethods
  const { isSubmitting } = formState

  const currentUploadMode = watch('uploadMode')
  const currentFile = watch('logoFile')
  const currentUrl = watch('logoUrl')

  const isSubmitDisabled = currentUploadMode === 'file' ? !currentFile : !currentUrl

  const handleLogoUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      formMethods.setValue('logoFile', uploaded.file, { shouldValidate: true })
    }
  }

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) {
      reset()
    }
  }

  const onSubmit = async (data: FormData) => {
    try {
      await createSubprocessor({
        input: {
          name: data.name,
          description: data.description || '',
          tags: data.tags,
          logoRemoteURL: data.uploadMode === 'url' ? data.logoUrl : undefined,
        },
        logoFile: data.uploadMode === 'file' ? data.logoFile : undefined,
      })

      successNotification({
        title: 'Subprocessor Created',
        description: 'The subprocessor has been created successfully.',
      })

      setOpen(false)
      onCreateSuccess()
      reset()
    } catch (error) {
      errorNotification({
        title: 'Error Creating Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
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
            <LogoField onFileUpload={handleLogoUpload} />
            <DescriptionField isEditing />
            <TagsField isEditing />
          </form>
        </FormProvider>

        <SheetFooter className="mt-8">
          <Button onClick={handleSubmit(onSubmit)} type="button" form="subprocessor-form" variant="primary" disabled={isSubmitting || isSubmitDisabled} className="w-full">
            {isSubmitting ? 'Creating...' : 'Create Subprocessor'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
