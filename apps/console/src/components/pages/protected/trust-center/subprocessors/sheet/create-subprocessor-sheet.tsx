'use client'

import React, { useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { PanelRightClose, SquarePlus } from 'lucide-react'

import { Button } from '@repo/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetTrigger, SheetHeader } from '@repo/ui/sheet'

import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useCreateSubprocessor } from '@/lib/graphql-hooks/subprocessors'

import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { TagsField } from './form-fields/tags-field'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { CreateSubprocessorMutation } from '@repo/codegen/src/schema'

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

interface CreateSubprocessorSheetProps {
  onCreateSuccess: (subprocessor: CreateSubprocessorMutation['createSubprocessor']['subprocessor']) => void
}

export const CreateSubprocessorSheet = ({ onCreateSuccess }: CreateSubprocessorSheetProps) => {
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

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const onOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) reset()
  }

  const onSubmit = async (data: FormData) => {
    try {
      const resp = await createSubprocessor({
        input: {
          name: data.name.trim(),
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

      handleClose()

      if (resp.createSubprocessor?.subprocessor) {
        onCreateSuccess(resp.createSubprocessor.subprocessor)
      }
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
        <SheetHeader>
          <div className="flex items-center justify-between">
            <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={handleClose} />

            <div className="flex justify-end gap-2">
              <CancelButton onClick={handleClose}></CancelButton>
              <Button iconPosition="left" type="button" form="subprocessor-form" onClick={handleSubmit(onSubmit)} disabled={isSubmitting || isSubmitDisabled}>
                {isSubmitting ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-start">
            <SheetTitle className="text-2xl mb-6">Create Subprocessor</SheetTitle>
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="subprocessor-form" className="space-y-6">
            <NameField isEditing />
            <LogoField onFileUpload={handleLogoUpload} />
            <DescriptionField isEditing />
            <TagsField isEditing />
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
