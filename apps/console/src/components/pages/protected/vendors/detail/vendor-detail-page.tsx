'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormProvider, useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import type { ResponsibilitySelection } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { useNavigationGuard } from 'next-navigation-guard'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { useEntity, useGetEntityAssociations, useUpdateEntity, useDeleteEntity } from '@/lib/graphql-hooks/entity'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit } from '@/lib/authz/utils'
import { useNotification } from '@/hooks/useNotification'
import { useHasScrollbar } from '@/hooks/useHasScrollbar'
import { useOrganization } from '@/hooks/useOrganization'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { normalizeEntityData, buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type UpdateEntityInput, type EntityQuery } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import { ASSOCIATION_REMOVAL_CONFIG } from '@/components/shared/object-association/object-association-config'
import AssetDetailsSheet from '@/components/pages/protected/controls/tabs/assets-scans/asset-details-sheet'
import EvidenceDetailsSheet from '@/components/pages/protected/evidence/evidence-details-sheet'
import VendorDetailHeader from './vendor-detail-header'
import VendorPropertiesSidebar from './vendor-properties-sidebar'
import VendorDetailTabs from './tabs/vendor-detail-tabs'
import type { EditVendorFormData } from '../hooks/use-form-schema'

interface VendorDetailPageProps {
  vendorId: string
}

type VendorFormValues = EditVendorFormData

const normalizeData = (data: EntityQuery['entity']) =>
  normalizeEntityData(data, {
    internalOwner: { user: data?.internalOwnerUser, group: data?.internalOwnerGroup, stringValue: data?.internalOwner },
    reviewedBy: { user: data?.reviewedByUser, group: data?.reviewedByGroup, stringValue: data?.reviewedBy },
  })

const VendorDetailPage: React.FC<VendorDetailPageProps> = ({ vendorId }) => {
  const router = useRouter()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const currentOrganization = getOrganizationByID(currentOrgId ?? '')

  const { data, isLoading, isError } = useEntity(vendorId)
  const { data: associationsData } = useGetEntityAssociations(vendorId)
  const { data: permission } = useAccountRoles(ObjectTypes.ENTITY, vendorId)
  const { mutateAsync: updateEntity } = useUpdateEntity()
  const { mutateAsync: deleteEntity } = useDeleteEntity()

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [initialValues, setInitialValues] = useState<Partial<VendorFormValues>>({})

  const hasScrollbar = useHasScrollbar([isEditing, data?.entity, associationsData?.entity])

  const form = useForm<VendorFormValues>({
    defaultValues: {},
  })

  const { isDirty } = form.formState
  const navGuard = useNavigationGuard({ enabled: isDirty })

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Registry', href: '/registry/vendors' },
      { label: 'Vendors', href: '/registry/vendors' },
      { label: data?.entity?.displayName || data?.entity?.name || '', isLoading },
    ])
  }, [setCrumbs, data?.entity, isLoading])

  useEffect(() => {
    if (data?.entity) {
      const normalized = normalizeData(data.entity)
      const newValues: Partial<VendorFormValues> = {
        name: data.entity.name ?? '',
        displayName: data.entity.displayName ?? undefined,
        description: data.entity.description ?? undefined,
        status: data.entity.status ?? undefined,
        domains: data.entity.domains ?? undefined,
        tags: data.entity.tags ?? undefined,
        environmentName: data.entity.environmentName ?? undefined,
        scopeName: data.entity.scopeName ?? null,
        reviewFrequency: data.entity.reviewFrequency ?? undefined,
        lastReviewedAt: data.entity.lastReviewedAt ?? undefined,
        nextReviewAt: data.entity.nextReviewAt ?? undefined,
        tier: data.entity.tier ?? undefined,
        riskRating: data.entity.riskRating ?? undefined,
        riskScore: data.entity.riskScore ?? undefined,
        renewalRisk: data.entity.renewalRisk ?? undefined,
        annualSpend: data.entity.annualSpend ?? undefined,
        spendCurrency: data.entity.spendCurrency ?? undefined,
        billingModel: data.entity.billingModel ?? undefined,
        contractStartDate: data.entity.contractStartDate ?? undefined,
        contractEndDate: data.entity.contractEndDate ?? undefined,
        contractRenewalAt: data.entity.contractRenewalAt ?? undefined,
        terminationNoticeDays: data.entity.terminationNoticeDays ?? undefined,
        autoRenews: data.entity.autoRenews ?? undefined,
        hasSoc2: data.entity.hasSoc2 ?? undefined,
        soc2PeriodEnd: data.entity.soc2PeriodEnd ?? undefined,
        mfaSupported: data.entity.mfaSupported ?? undefined,
        mfaEnforced: data.entity.mfaEnforced ?? undefined,
        ssoEnforced: data.entity.ssoEnforced ?? undefined,
        approvedForUse: data.entity.approvedForUse ?? undefined,
        entitySourceTypeName: data.entity.entitySourceTypeName ?? undefined,
        entityRelationshipStateName: data.entity.entityRelationshipStateName ?? undefined,
        entitySecurityQuestionnaireStatusName: data.entity.entitySecurityQuestionnaireStatusName ?? undefined,
        statusPageURL: data.entity.statusPageURL ?? undefined,
        internalOwner: normalized.internalOwner as ResponsibilitySelection,
        reviewedBy: normalized.reviewedBy as ResponsibilitySelection,
      }
      form.reset(newValues)
      // eslint-disable-next-line @eslint-react/set-state-in-effect
      setInitialValues(newValues)
    }
  }, [data?.entity, form])

  const onSubmit = async (values: VendorFormValues) => {
    try {
      const changedFields = Object.entries(values).reduce<Record<string, unknown>>((acc, [key, value]) => {
        const initialValue = initialValues[key as keyof VendorFormValues]
        if (JSON.stringify(value) !== JSON.stringify(initialValue)) {
          acc[key] = value
        }
        return acc
      }, {})

      const { internalOwner, reviewedBy, ...rest } = changedFields
      const input: UpdateEntityInput = {
        ...rest,
        ...(internalOwner ? buildResponsibilityPayload('internalOwner', internalOwner as ResponsibilitySelection, { mode: 'update' }) : {}),
        ...(reviewedBy ? buildResponsibilityPayload('reviewedBy', reviewedBy as ResponsibilitySelection, { mode: 'update' }) : {}),
      } as UpdateEntityInput

      if (Object.keys(input).length === 0) {
        setIsEditing(false)
        return
      }

      await updateEntity({ updateEntityId: vendorId, input })

      successNotification({
        title: 'Vendor updated',
        description: 'The vendor was successfully updated.',
      })

      setIsEditing(false)
    } catch {
      errorNotification({ title: 'Failed to update vendor' })
    }
  }

  const handleCancel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    form.reset(initialValues as VendorFormValues)
    setIsEditing(false)
  }

  const handleEdit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setIsEditing(true)
  }

  const handleUpdateField = async (input: UpdateEntityInput, options?: { throwOnError?: boolean }) => {
    try {
      await updateEntity({ updateEntityId: vendorId, input })
      successNotification({
        title: 'Vendor updated',
        description: 'The vendor was successfully updated.',
      })
    } catch (error) {
      errorNotification({ title: 'Failed to update vendor' })

      if (options?.throwOnError) {
        throw error
      }
    }
  }

  const handleDeleteVendor = async () => {
    try {
      await deleteEntity({ deleteEntityId: vendorId })
      successNotification({ title: 'Vendor deleted successfully.' })
      router.push('/registry/vendors')
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({ title: 'Error', description: errorMessage })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const queryClient = useQueryClient()

  const memoizedSections = useMemo(() => {
    if (!associationsData?.entity) return {}
    return {
      assets: associationsData.entity.assets,
      scans: associationsData.entity.scans,
      campaigns: associationsData.entity.campaigns,
      identityHolders: associationsData.entity.identityHolders,
      controls: associationsData.entity.controls,
      subcontrols: associationsData.entity.subcontrols,
      policies: associationsData.entity.internalPolicies,
    }
  }, [associationsData?.entity])

  const memoizedCenterNode = useMemo(() => {
    if (!data?.entity) return null
    return {
      node: data.entity,
      type: ObjectAssociationNodeEnum.ENTITY,
    }
  }, [data?.entity])

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: vendorId,
    handleUpdateField: (input: UpdateEntityInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: [{ queryKey: ['entities'], dataRootField: 'entity', exact: false }],
    invalidateQueryKeys: [['entities']],
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.entity.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.entity.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.entity.sectionKeyToInvalidateQueryKey,
  })

  const vendor = data?.entity
  const canEditVendor = canEdit(permission?.roles)

  if (isLoading) {
    return null
  }

  if (isError || !vendor) {
    return <div className="p-4 text-red-500">Vendor not found</div>
  }

  const mainContent = (
    <div className="space-y-6">
      <VendorDetailHeader
        vendor={vendor}
        isEditing={isEditing}
        canEditVendor={canEditVendor}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onDeleteClick={() => setIsDeleteDialogOpen(true)}
        permissionRoles={permission?.roles}
        handleUpdateField={handleUpdateField}
        onMergeComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['entities', vendorId] })
          queryClient.invalidateQueries({ queryKey: ['entities'] })
        }}
      />

      <VendorDetailTabs vendor={vendor} associations={associationsData} isEditing={isEditing} canEdit={canEditVendor} handleUpdateField={handleUpdateField} />
    </div>
  )

  const sidebarContent = (
    <>
      {memoizedCenterNode && <ObjectAssociationSwitch sections={memoizedSections} centerNode={memoizedCenterNode} canEdit={canEditVendor} onRemoveAssociation={handleRemoveAssociation} />}
      <VendorPropertiesSidebar data={vendor} isEditing={isEditing} handleUpdate={handleUpdateField} canEdit={canEditVendor} />
    </>
  )

  return (
    <>
      <title>{`${currentOrganization?.node?.displayName ?? 'Openlane'} | Vendors - ${vendor.displayName || vendor.name}`}</title>
      <FormProvider {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <SlideBarLayout
            sidebarTitle="Details"
            sidebarContent={sidebarContent}
            slideOpen={isEditing}
            minWidth={430}
            collapsedContentClassName="pr-6"
            collapsedButtonClassName="-translate-x-4"
            hasScrollbar={hasScrollbar}
          >
            {mainContent}
          </SlideBarLayout>
        </form>
      </FormProvider>

      <CancelDialog isOpen={navGuard.active} onConfirm={navGuard.accept} onCancel={navGuard.reject} />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteVendor}
        title="Delete Vendor"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{vendor.name}</b> from the organization.
          </>
        }
      />

      <EvidenceDetailsSheet />
      <AssetDetailsSheet queryParamKey="assetId" />
    </>
  )
}

export default VendorDetailPage
