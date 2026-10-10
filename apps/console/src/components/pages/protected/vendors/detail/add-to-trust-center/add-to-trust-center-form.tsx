'use client'

import React, { useEffect, useRef, useState } from 'react'
import { FormProvider } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { Button } from '@repo/ui/button'
import { DialogFooter } from '@repo/ui/dialog'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { type EntityQuery } from '@repo/codegen/src/schema'
import { CountriesField } from '@/components/pages/protected/trust-center/shared/countries-field'
import { CategoryField, categoryEnumWhere } from '@/components/pages/protected/trust-center/shared/category-field'
import { DisabledReasonTooltip } from '@/components/shared/disabled-reason-tooltip/disabled-reason-tooltip'
import { VendorLogo } from '@/components/shared/vendor-logo/vendor-logo'
import { type TVendorSubprocessorMatch, useCreateSubprocessor, useUpdateSubprocessor } from '@/lib/graphql-hooks/subprocessor'
import { useCreateTrustCenterSubprocessor } from '@/lib/graphql-hooks/trust-center-subprocessor'
import { useGetCustomTypeEnums } from '@/lib/graphql-hooks/custom-type-enum'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { fetchLogoAsFile, getVendorLogoUrl } from '@/lib/vendor-logo'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { matchVendorCategory, toVendorSubprocessorInput, vendorSubprocessorDescription, vendorSubprocessorName } from './vendor-subprocessor'
import { type TAddToTrustCenterFormData, useAddToTrustCenterForm } from './use-add-to-trust-center-form-schema'

const CATEGORY_WHERE = categoryEnumWhere(ObjectTypes.TRUST_CENTER_SUBPROCESSOR)

type TAddToTrustCenterFormProps = {
  vendor: EntityQuery['entity']
  existingSubprocessor: TVendorSubprocessorMatch | null
  onCancel: () => void
  onAdded: () => void
}

export const AddToTrustCenterForm = ({ vendor, existingSubprocessor, onCancel, onAdded }: TAddToTrustCenterFormProps) => {
  const { data: session } = useSession()
  const { data: orgPermission } = useOrganizationRoles()
  const canCreateCategory = hasPermission(orgPermission?.roles, AccessEnum.CanCreateCustomTypeEnum, session)
  const canCreateSubprocessor = hasPermission(orgPermission?.roles, AccessEnum.CanCreateSubprocessor, session)
  const { successNotification, errorNotification, warningNotification } = useNotification()
  const { mutateAsync: createSubprocessor } = useCreateSubprocessor()
  const { mutateAsync: updateSubprocessor } = useUpdateSubprocessor()
  const { mutateAsync: createTrustCenterSubprocessor } = useCreateTrustCenterSubprocessor()
  const { enumOptions: categoryOptions } = useGetCustomTypeEnums({ where: CATEGORY_WHERE })

  const [existing] = useState(existingSubprocessor)
  const createdIdRef = useRef<string | null>(null)

  const form = useAddToTrustCenterForm()
  const { isSubmitting } = form.formState
  const vendorCategory = matchVendorCategory(vendor, categoryOptions)

  useEffect(() => {
    if (vendorCategory && !form.getFieldState('category').isDirty) {
      form.resetField('category', { defaultValue: vendorCategory })
    }
  }, [vendorCategory, form])

  const preview = existing
    ? { name: existing.name, logoUrl: undefined, subtitle: 'Already exists as a subprocessor, so it will be reused.' }
    : { name: vendorSubprocessorName(vendor), logoUrl: getVendorLogoUrl(vendor.logoFile), subtitle: vendorSubprocessorDescription(vendor) }

  const createDisabledReason = !existing && !canCreateSubprocessor ? 'You do not have permission to create subprocessors.' : undefined

  const createVendorSubprocessor = async (): Promise<string> => {
    const result = await createSubprocessor({ input: toVendorSubprocessorInput(vendor), logoFile: preview.logoUrl ? await fetchLogoAsFile(preview.logoUrl) : undefined })
    createdIdRef.current = result.createSubprocessor.subprocessor.id
    return createdIdRef.current
  }

  const linkExistingToVendor = async (subprocessorID: string) => {
    try {
      await updateSubprocessor({ updateSubprocessorId: subprocessorID, input: { addEntityIDs: [vendor.id] } })
    } catch (error) {
      warningNotification({ title: 'Subprocessor not linked to this vendor', description: parseErrorMessage(error) })
    }
  }

  const onSubmit = async ({ countries, category }: TAddToTrustCenterFormData) => {
    try {
      const subprocessorID = existing?.id ?? createdIdRef.current ?? (await createVendorSubprocessor())
      await createTrustCenterSubprocessor({ input: { subprocessorID, countries, trustCenterSubprocessorKindName: category } })
      successNotification({ title: 'Added to Trust Center', description: `${preview.name} is now listed as a subprocessor on your Trust Center.` })
      if (existing && !existing.isLinkedToVendor) await linkExistingToVendor(existing.id)
      onAdded()
    } catch (error) {
      errorNotification({ title: 'Could not add to Trust Center', description: parseErrorMessage(error) })
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.stopPropagation()
    return form.handleSubmit(onSubmit)(event)
  }

  return (
    <FormProvider {...form}>
      <form id="add-vendor-to-trust-center-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <VendorLogo name={preview.name} logoUrl={preview.logoUrl} />
          <div className="flex min-w-0 flex-col gap-1">
            <p className="truncate text-sm font-medium">{preview.name}</p>
            {preview.subtitle && <p className="line-clamp-3 text-sm text-muted-foreground">{preview.subtitle}</p>}
          </div>
        </div>
        <CountriesField isEditing />
        <CategoryField objectType={ObjectTypes.TRUST_CENTER_SUBPROCESSOR} isEditing canCreate={canCreateCategory} />
      </form>
      <DialogFooter className="gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <DisabledReasonTooltip reason={createDisabledReason}>
          <Button type="submit" form="add-vendor-to-trust-center-form" disabled={isSubmitting || !!createDisabledReason}>
            {isSubmitting ? 'Adding...' : 'Add to Trust Center'}
          </Button>
        </DisabledReasonTooltip>
      </DialogFooter>
    </FormProvider>
  )
}
