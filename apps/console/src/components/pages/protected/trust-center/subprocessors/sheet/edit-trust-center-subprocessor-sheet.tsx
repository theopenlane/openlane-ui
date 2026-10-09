'use client'

import React, { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { omit, orClear, useDirtyInput, type TFieldMappers, passthrough } from '@/hooks/useDirtyInput'
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
import Skeleton from '@/components/shared/skeleton/skeleton'

const LOGO_URL_ERROR = 'Please enter a valid URL'

const httpUrlSchema = z.url({ protocol: /^https?$/ })

const schema = z
  .object({
    category: z.string().optional(),
    countries: z.array(z.string()).optional(),
    name: z.string().trim().min(1, 'Name is required'),
    description: z.string().trim().optional(),
    uploadMode: z.enum(['file', 'url']).default('file'),
    logoFile: z.instanceof(File).optional(),
    logoUrl: z.string().optional(),
  })
  .superRefine(({ uploadMode, logoUrl }, ctx) => {
    const remoteURL = (logoUrl ?? '').trim()
    if (uploadMode !== 'url' || !remoteURL) return
    if (!httpUrlSchema.safeParse(remoteURL).success) ctx.addIssue({ code: 'custom', path: ['logoUrl'], message: LOGO_URL_ERROR })
  })

type FormData = z.infer<typeof schema>

const logoInput = (_value: string | File | undefined, { uploadMode, logoFile, logoUrl }: FormData): UpdateSubprocessorInput => {
  if (uploadMode === 'url') {
    const remoteURL = (logoUrl ?? '').trim()
    return remoteURL ? { logoRemoteURL: remoteURL, clearLogoFile: true } : { clearLogoRemoteURL: true }
  }
  return logoFile instanceof File ? { clearLogoRemoteURL: true } : {}
}

const SUBPROCESSOR_UPDATE_FIELDS = {
  description: orClear('clearDescription'),
  uploadMode: logoInput,
  logoFile: logoInput,
  logoUrl: logoInput,
  category: omit,
  countries: omit,
  name: passthrough,
} satisfies TFieldMappers<FormData, UpdateSubprocessorInput>

const subprocessorCategoryInput = (category: string | undefined): UpdateTrustCenterSubprocessorInput =>
  category ? { trustCenterSubprocessorKindName: category } : { clearTrustCenterSubprocessorKindName: true }

const TRUST_CENTER_SUBPROCESSOR_UPDATE_FIELDS = {
  category: subprocessorCategoryInput,
  countries: orClear('clearCountries'),
  name: omit,
  description: omit,
  uploadMode: omit,
  logoFile: omit,
  logoUrl: omit,
} satisfies TFieldMappers<FormData, UpdateTrustCenterSubprocessorInput>

const trustCenterSubprocessorRefreshInput = ({ category, countries }: FormData): UpdateTrustCenterSubprocessorInput => ({
  ...(category ? subprocessorCategoryInput(category) : {}),
  ...(countries?.length ? { countries } : { clearCountries: true }),
})

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

  const { data, isFetching } = useGetTrustCenterSubprocessorByID({ trustCenterSubprocessorId: trustCenterSubprocessorId || '' })
  const record = trustCenterSubprocessorId && data?.trustCenterSubprocessor?.id === trustCenterSubprocessorId ? data.trustCenterSubprocessor : undefined
  const [seededId, setSeededId] = useState<string | null>(null)

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
  const buildDirtyInput = useDirtyInput(formMethods)
  const { isSubmitting } = formState

  const isEditable = canEditOrg && !record?.subprocessor?.systemOwned
  const isSeeded = !!record && seededId === record.id
  const isNotFound = !record && !isFetching
  const existingLogoBase64 = record?.subprocessor?.logoFile?.base64
  const existingLogoFileUrl = existingLogoBase64 ? toBase64DataUri(existingLogoBase64) : undefined

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
    if (!record) {
      setSeededId(null)
      return
    }
    const sp = record.subprocessor
    const existingLogoBase64 = sp?.logoFile?.base64
    const existingLogoRemoteUrl = sp?.logoRemoteURL

    reset({
      category: record.trustCenterSubprocessorKindName ?? '',
      countries: record.countries ?? [],
      name: sp?.name ?? '',
      description: sp?.description ?? '',
      uploadMode: existingLogoRemoteUrl && !existingLogoBase64 ? 'url' : 'file',
      logoFile: undefined,
      logoUrl: existingLogoRemoteUrl ?? '',
    })
    setSeededId(record.id)
  }, [record, reset])

  const handleLogoUpload = (uploaded: TUploadedFile) => {
    if (uploaded.file) {
      formMethods.setValue('logoFile', uploaded.file, { shouldValidate: true, shouldDirty: true })
    }
  }

  const onSubmit = async (values: FormData) => {
    if (!trustCenterSubprocessorId || !record) return

    try {
      const isSystemOwned = !!record.subprocessor?.systemOwned
      const subprocessorId = record.subprocessor?.id
      const stagedLogo = values.uploadMode === 'file' ? values.logoFile : undefined
      const subprocessorInput = !isSystemOwned && subprocessorId ? await buildDirtyInput<UpdateSubprocessorInput>(values, SUBPROCESSOR_UPDATE_FIELDS) : {}
      const subprocessorChanged = !isSystemOwned && !!subprocessorId && (Object.keys(subprocessorInput).length > 0 || !!stagedLogo)

      if (subprocessorChanged) {
        await updateSubprocessor({ updateSubprocessorId: subprocessorId, input: subprocessorInput, logoFile: stagedLogo })
      }

      const changedTrustCenterInput = await buildDirtyInput<UpdateTrustCenterSubprocessorInput>(values, TRUST_CENTER_SUBPROCESSOR_UPDATE_FIELDS)
      const trustCenterInput = Object.keys(changedTrustCenterInput).length === 0 && subprocessorChanged ? trustCenterSubprocessorRefreshInput(values) : changedTrustCenterInput

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
            formActions={<SlideoutFormActions formId="tc-subprocessor-form" onCancel={() => handleOpenChange(false)} isPending={isSubmitting} disabled={!isSeeded} />}
          />
        }
      >
        {isSeeded ? (
          <FormProvider {...formMethods}>
            <form id="tc-subprocessor-form" onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <NameField isEditing={false} />
              <DescriptionField isEditing={isEditable} />
              <CountriesField isEditing />
              <CategoryField objectType={ObjectTypes.TRUST_CENTER_SUBPROCESSOR} isEditing canCreate={canCreateCategory} />
              <LogoField onFileUpload={handleLogoUpload} isEditing={isEditable} fallbackPreviewSrc={existingLogoFileUrl} />
            </form>
          </FormProvider>
        ) : isNotFound ? (
          <p className="mt-6 text-sm text-muted-foreground">Subprocessor not found.</p>
        ) : (
          <div className="mt-6 space-y-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
