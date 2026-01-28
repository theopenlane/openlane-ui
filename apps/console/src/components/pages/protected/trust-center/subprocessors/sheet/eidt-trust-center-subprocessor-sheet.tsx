'use client'

import React, { useEffect, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Copy, PanelRightClose } from 'lucide-react'
import { FormProvider, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

import { useGetTrustCenterSubprocessorByID, useUpdateTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessors'
import { useUpdateSubprocessor } from '@/lib/graphql-hooks/subprocessors'
import { UpdateSubprocessorInput } from '@repo/codegen/src/schema'

import { SubprocessorSelectField } from './form-fields/subprocessor-select-field'
import { CategoryField } from './form-fields/category-field'
import { CountriesField } from './form-fields/countries-field'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'
import { TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'

const schema = z.object({
  subprocessorID: z.string().min(1, 'Please select a subprocessor'),
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  uploadMode: z.enum(['file', 'url']).default('file'),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

type FormData = z.infer<typeof schema>

export const EditTrustCenterSubprocessorSheet: React.FC = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const trustCenterSubprocessorId = searchParams.get('id')

  const [open, setOpen] = useState(!!trustCenterSubprocessorId)

  const { successNotification, errorNotification } = useNotification()

  const { mutateAsync: updateTCSubprocessor } = useUpdateTrustCenterSubprocessor()
  const { mutateAsync: updateSubprocessor } = useUpdateSubprocessor()

  const { data } = useGetTrustCenterSubprocessorByID({ trustCenterSubprocessorId: trustCenterSubprocessorId || '' })

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subprocessorID: '',
      category: '',
      countries: [],
      name: '',
      description: '',
      uploadMode: 'file',
      logoFile: undefined,
      logoUrl: '',
    },
  })

  const { handleSubmit, reset, formState } = formMethods
  const { isSubmitting } = formState

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)

    const params = new URLSearchParams(window.location.search)
    if (!isOpen) {
      params.delete('id')
      router.push(params.toString() ? `?${params.toString()}` : '?')
      return
    }

    router.push(params.toString() ? `?${params.toString()}` : '?')
  }

  useEffect(() => {
    setOpen(!!trustCenterSubprocessorId)
  }, [trustCenterSubprocessorId])

  useEffect(() => {
    if (!data) return
    const sp = data.trustCenterSubprocessor?.subprocessor
    const existingLogoFileUrl = sp?.logoFile?.presignedURL
    const existingLogoRemoteUrl = sp?.logoRemoteURL

    reset({
      subprocessorID: sp?.id ?? '',
      category: data.trustCenterSubprocessor?.category ?? '',
      countries: data.trustCenterSubprocessor?.countries ?? [],
      name: sp?.name ?? '',
      description: sp?.description ?? '',
      uploadMode: existingLogoRemoteUrl && !existingLogoFileUrl ? 'url' : 'file',
      logoFile: undefined,
      // Used by LogoField for "existing preview" (remote URL or presigned file URL)
      logoUrl: existingLogoRemoteUrl ?? existingLogoFileUrl ?? '',
    })
  }, [data, reset])

  const handleLogoUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      formMethods.setValue('logoFile', uploaded.file, { shouldValidate: true })
    }
  }

  const onSubmit = async (values: FormData) => {
    if (!trustCenterSubprocessorId) return

    try {
      const tc = data?.trustCenterSubprocessor
      const isSystemOwned = !!tc?.subprocessor?.systemOwned

      if (!isSystemOwned) {
        const subprocessorId = tc?.subprocessor?.id

        if (subprocessorId) {
          const trimmedName = values.name.trim()
          const trimmedDescription = (values.description ?? '').trim()
          const trimmedLogoUrl = (values.logoUrl ?? '').trim()

          const input: UpdateSubprocessorInput = {
            name: trimmedName,
          }

          if (trimmedDescription) {
            input.description = trimmedDescription
          } else {
            input.clearDescription = true
          }

          if (values.uploadMode === 'url') {
            if (trimmedLogoUrl) {
              input.logoRemoteURL = trimmedLogoUrl
              input.clearLogoFile = true
            } else {
              input.clearLogoRemoteURL = true
            }
          } else if (values.uploadMode === 'file' && values.logoFile instanceof File) {
            input.clearLogoRemoteURL = true
          }

          await updateSubprocessor({
            updateSubprocessorId: subprocessorId,
            input,
            logoFile: values.uploadMode === 'file' ? values.logoFile : undefined,
          })
        }
      }

      await updateTCSubprocessor({
        id: trustCenterSubprocessorId,
        input: {
          subprocessorID: values.subprocessorID,
          category: values.category,
          countries: values.countries,
        },
      })

      successNotification({
        title: 'Subprocessor Updated',
        description: 'The trust center subprocessor has been successfully updated.',
      })

      handleOpenChange(false)
    } catch (error) {
      errorNotification({
        title: 'Error Updating Trust Center Subprocessor',
        description: parseErrorMessage(error),
      })
    }
  }

  if (!trustCenterSubprocessorId) return null

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[480px] overflow-y-auto">
        <SheetTitle />
        <SheetDescription />
        <SheetHeader>
          <div className="flex justify-between">
            <PanelRightClose aria-label="Close detail sheet" size={16} className="cursor-pointer" onClick={() => handleOpenChange(false)} />

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
                      description: 'Trust center subprocessor link copied to clipboard.',
                    })
                  }}
                >
                  Copy link
                </Button>

                <SaveButton isSaving={isSubmitting} form="tc-subprocessor-form" />
              </div>
            </div>
          </div>
        </SheetHeader>

        <FormProvider {...formMethods}>
          <form id="tc-subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <SubprocessorSelectField isEditing={false} selectedSubprocessor={data?.trustCenterSubprocessor?.subprocessor} />
            <CategoryField isEditing />
            <CountriesField isEditing />

            {!data?.trustCenterSubprocessor?.subprocessor?.systemOwned && (
              <>
                <NameField isEditing />
                <LogoField onFileUpload={handleLogoUpload} />
                <DescriptionField isEditing />
              </>
            )}
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
