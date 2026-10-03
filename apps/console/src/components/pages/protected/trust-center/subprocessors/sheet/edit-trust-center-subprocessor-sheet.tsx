'use client'

import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { useChangedInput } from '@/hooks/useChangedInput'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { useRouter, useSearchParams } from 'next/navigation'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { toBase64DataUri } from '@/lib/image-utils'

import { useGetTrustCenterSubprocessorByID, useUpdateTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { useUpdateSubprocessor } from '@/lib/graphql-hooks/subprocessor'
import { type UpdateSubprocessorInput, type UpdateTrustCenterSubprocessorInput } from '@repo/codegen/src/schema'

import { CategoryField } from '../../shared/category-field'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { CountriesField } from './form-fields/countries-field'
import { copyLinkMenuAction, SlideoutHeader } from '@/components/shared/crud-base/slideout-header'
import { SlideoutFormActions } from '@/components/shared/crud-base/slideout-form-actions'
import { NameField } from './form-fields/name-field'
import { DescriptionField } from './form-fields/description-field'
import { LogoField } from './form-fields/logo-field'
import { type TUploadedFile } from '@/components/pages/protected/evidence/upload/types/TUploadedFile'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useSession } from 'next-auth/react'

const schema = z.object({
  category: z.string().min(1, 'Category is required'),
  countries: z.array(z.string()).min(1, 'Select at least one country'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  uploadMode: z.enum(['file', 'url']).default('file'),
  logoFile: z.instanceof(File).optional(),
  logoUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')).or(z.string().startsWith('data:')),
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
  const { data: orgPermission } = useOrganizationRoles()
  const { data: session } = useSession()
  const canEditOrg = canEdit(orgPermission?.roles, session)
  const canCreateCategory = hasPermission(orgPermission?.roles, AccessEnum.CanCreateCustomTypeEnum, session)

  const { data } = useGetTrustCenterSubprocessorByID({ trustCenterSubprocessorId: trustCenterSubprocessorId || '' })

  const formMethods = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
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
  const buildChangedInput = useChangedInput(formMethods)
  const { isSubmitting } = formState

  const isEditable = canEditOrg && !data?.trustCenterSubprocessor?.subprocessor?.systemOwned

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
    const existingLogoBase64 = sp?.logoFile?.base64
    const existingLogoFileUrl = existingLogoBase64 ? toBase64DataUri(existingLogoBase64) : undefined
    const existingLogoRemoteUrl = sp?.logoRemoteURL

    reset({
      category: data.trustCenterSubprocessor?.trustCenterSubprocessorKindName ?? '',
      countries: data.trustCenterSubprocessor?.countries ?? [],
      name: sp?.name ?? '',
      description: sp?.description ?? '',
      uploadMode: existingLogoRemoteUrl && !existingLogoBase64 ? 'url' : 'file',
      logoFile: undefined,
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

      const subprocessorId = tc?.subprocessor?.id
      const stagedLogo = values.uploadMode === 'file' ? values.logoFile : undefined
      const subprocessorInput =
        !isSystemOwned && subprocessorId
          ? await buildChangedInput(values, (formValues): UpdateSubprocessorInput => {
              const description = (formValues.description ?? '').trim()
              const logoUrl = (formValues.logoUrl ?? '').trim()
              return {
                name: formValues.name.trim(),
                ...(description ? { description } : { clearDescription: true }),
                ...(formValues.uploadMode === 'url'
                  ? logoUrl
                    ? { logoRemoteURL: logoUrl, clearLogoFile: true }
                    : { clearLogoRemoteURL: true }
                  : formValues.logoFile instanceof File
                    ? { clearLogoRemoteURL: true }
                    : {}),
              }
            })
          : {}
      const subprocessorChanged = !!subprocessorId && (Object.keys(subprocessorInput).length > 0 || !!stagedLogo)

      if (subprocessorChanged) {
        await updateSubprocessor({ updateSubprocessorId: subprocessorId, input: subprocessorInput, logoFile: stagedLogo })
      }

      const buildTrustCenterSubprocessorInput = (formValues: FormData): UpdateTrustCenterSubprocessorInput => ({
        trustCenterSubprocessorKindName: formValues.category,
        countries: formValues.countries,
      })
      const changedTrustCenterInput = await buildChangedInput(values, buildTrustCenterSubprocessorInput)
      const trustCenterInput = Object.keys(changedTrustCenterInput).length > 0 || !subprocessorChanged ? changedTrustCenterInput : buildTrustCenterSubprocessorInput(values)

      if (Object.keys(trustCenterInput).length > 0) {
        await updateTCSubprocessor({ id: trustCenterSubprocessorId, input: trustCenterInput })
      }

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
      <SheetContent
        aria-describedby={undefined}
        side="right"
        className="w-[420px] sm:w-[480px] overflow-y-auto"
        header={
          <SlideoutHeader
            title="Edit Subprocessor"
            onClose={() => handleOpenChange(false)}
            menuActions={[
              copyLinkMenuAction(() => {
                navigator.clipboard.writeText(window.location.href)
                successNotification({
                  title: 'Link copied',
                  description: 'Trust center subprocessor link copied to clipboard.',
                })
              }),
            ]}
            formActions={<SlideoutFormActions formId="tc-subprocessor-form" onCancel={() => handleOpenChange(false)} isPending={isSubmitting} />}
          />
        }
      >
        <FormProvider {...formMethods}>
          <form id="tc-subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <NameField isEditing={false} />
            <DescriptionField isEditing={isEditable} />
            <CountriesField isEditing />
            <CategoryField objectType={ObjectTypes.TRUST_CENTER_SUBPROCESSOR} isEditing canCreate={canCreateCategory} />
            <LogoField onFileUpload={handleLogoUpload} isEditing={isEditable} />
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  )
}
