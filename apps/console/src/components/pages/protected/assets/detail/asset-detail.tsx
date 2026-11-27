'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigationGuard } from 'nextjs-nav-guard'
import { type FieldErrors, FormProvider } from 'react-hook-form'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { TabsContent } from '@repo/ui/tabs'
import { type UpdateAssetInput } from '@repo/codegen/src/schema'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { useDeleteAsset, useGetAssetAssociations, useUpdateAsset } from '@/lib/graphql-hooks/asset'
import { useAssetRelationships, useAssetVendors } from '@/lib/graphql-hooks/asset-detail'
import { useGetCurrentUser } from '@/lib/graphql-hooks/user'
import { useAccountRoles, useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useModuleAccess } from '@/lib/subscription-plan/hooks/use-module-access'
import { canDelete, canEdit, hasPermission } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { useQueryErrorNotification } from '@/hooks/useQueryErrorNotification'
import { useNotification } from '@/hooks/useNotification'
import { useOrganization } from '@/hooks/useOrganization'
import { useDirtyInput } from '@/hooks/useDirtyInput'
import { useAssociationRemoval } from '@/hooks/useAssociationRemoval'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import CancelDialog from '@/components/shared/cancel-dialog/cancel-dialog'
import AIChat from '@/components/shared/ai-suggetions/chat'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { useDetailTabs } from '@/components/shared/detail-tabs/use-detail-tabs'
import ObjectAssociationSwitch from '@/components/shared/object-association/object-association-switch'
import { ObjectAssociationNodeEnum } from '@/components/shared/object-association/types/object-association-types'
import { ASSET_ASSOCIATION_SECTIONS, ASSOCIATION_REMOVAL_CONFIG, buildAssociationSections } from '@/components/shared/object-association/object-association-config'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { ASSETS_HREF, normalizeAssetData } from '../asset-display'
import useFormSchema, { type AssetFormData } from '../hooks/use-form-schema'
import { ASSET_UPDATE_FIELDS, toAssetInlineInput } from '../hooks/asset-update-fields'
import { useAssetEnumOptions } from '../hooks/use-asset-enum-options'
import { type TAssetSectionProps } from './asset-field-props'
import AssetDetailHeader from './asset-detail-header'
import AssetDialogs from './asset-dialogs'
import AssetPropertiesCard from './asset-properties-card'
import AssetQuickActions, { type TAssetDialog } from './asset-quick-actions'
import AssetSourceCard from './asset-source-card'
import { ASSET_TABS, type TAssetTabValue } from './tabs/asset-tab-values'
import AssetOverviewTab from './tabs/overview/asset-overview-tab'
import { type TReadinessAction } from './tabs/overview/readiness-checks'
import { useAssetReadiness } from './tabs/overview/use-asset-readiness'
import AssetExposureTab from './tabs/exposure/asset-exposure-tab'
import { useExposureView } from './tabs/exposure/use-exposure-view'
import { useAssetExposure } from './tabs/exposure/use-asset-exposure'
import AssetVendorTab from './tabs/vendor/asset-vendor-tab'
import AssetHistoryTab from './tabs/history/asset-history-tab'

const AssetRelationshipsTab = dynamic(() => import('./tabs/relationships/asset-relationships-tab'), { loading: () => <Skeleton height={320} className="w-full rounded-lg" /> })

const CACHE_TARGETS = [{ queryKey: ['assets'], dataRootField: 'asset', exact: false }]

type TAssetDetailProps = {
  asset: TAssetSectionProps['asset']
  title: string
}

const AssetDetail: React.FC<TAssetDetailProps> = ({ asset, title }) => {
  const assetId = asset.id
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const { successNotification, errorNotification } = useNotification()
  const { currentOrgId, getOrganizationByID } = useOrganization()
  const organizationName = getOrganizationByID(currentOrgId ?? '')?.node?.displayName
  const { data: userData } = useGetCurrentUser(session?.user?.userId)
  const { hasObjectType } = useModuleAccess()

  const { data: associationsData, error: associationsError } = useGetAssetAssociations(assetId)
  useQueryErrorNotification({ error: associationsError, description: 'Failed to load associated objects' })
  const { data: relationshipsData } = useAssetRelationships(assetId)
  const vendors = useAssetVendors(assetId)
  const exposure = useAssetExposure(assetId)
  const exposureView = useExposureView()
  const readiness = useAssetReadiness({ asset, exposure, vendors })
  const { data: permission } = useAccountRoles(ObjectTypes.ASSET, assetId)
  const { data: orgPermission } = useOrganizationRoles()
  const { mutateAsync: updateAsset, isPending: isSaving } = useUpdateAsset()
  const { mutateAsync: deleteAsset } = useDeleteAsset()
  const { enumOpts, enumCreateHandlers } = useAssetEnumOptions()

  const [isEditing, setIsEditing] = useState(false)
  const [internalEditing, setInternalEditing] = useState<string | null>(null)
  const [dialog, setDialog] = useState<TAssetDialog | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isAskAIOpen, setIsAskAIOpen] = useState(false)
  const [isRailOpen, setIsRailOpen] = useState(true)

  const { form } = useFormSchema()
  const buildDirtyInput = useDirtyInput(form)
  const navGuard = useNavigationGuard({ enabled: form.formState.isDirty })

  const unavailableTabs = useMemo(() => {
    const unavailable = new Set<TAssetTabValue>()
    if (!vendors.hasAccess) unavailable.add('vendor')
    if (!exposure.hasAnyAccess && !exposure.isPending) unavailable.add('exposure')
    return unavailable
  }, [vendors.hasAccess, exposure.hasAnyAccess, exposure.isPending])
  const tabs = useDetailTabs<TAssetTabValue>({ page: 'asset', tabs: ASSET_TABS, defaultTab: 'overview', unavailableTabs })

  const isEditingRef = useRef(isEditing)
  useEffect(() => {
    isEditingRef.current = isEditing
  }, [isEditing])

  useEffect(() => {
    if (!isEditingRef.current) form.reset(normalizeAssetData(asset))
  }, [asset, form])

  const sections = useMemo(() => buildAssociationSections(ASSET_ASSOCIATION_SECTIONS, associationsData?.asset), [associationsData])
  const centerNode = useMemo(() => ({ node: asset, type: ObjectAssociationNodeEnum.ASSET }), [asset])

  const canEditAsset = canEdit(permission?.roles, session)
  const canUploadEvidence = hasObjectType(ObjectTypes.EVIDENCE) && hasPermission(orgPermission?.roles, AccessEnum.CanCreateEvidence, session) && !!associationsData
  const canReview = hasObjectType(ObjectTypes.REVIEW) && hasPermission(orgPermission?.roles, AccessEnum.CanCreateReview, session)
  const canMapControl = canEditAsset && hasObjectType(ObjectTypes.CONTROL) && !!associationsData
  const canLinkExposure = canEditAsset && exposure.hasAnyAccess && !exposure.isTruncated && !exposure.isPending

  const availableActions = useMemo(
    () =>
      new Set<TReadinessAction>([
        'view-exposure',
        'view-vendor',
        ...(canEditAsset ? (['set-owner', 'set-classification', 'set-environment-scope'] as const) : []),
        ...(canReview ? (['mark-reviewed'] as const) : []),
      ]),
    [canEditAsset, canReview],
  )

  const startEditing = () => {
    tabs.onTabChange('overview')
    setInternalEditing(null)
    setIsEditing(true)
  }

  const handleReadinessAction = (action: TReadinessAction) => {
    if (action === 'view-exposure') tabs.onTabChange('exposure')
    else if (action === 'view-vendor') tabs.onTabChange('vendor')
    else setDialog(action)
  }

  const handleUpdateField = async (input: UpdateAssetInput, options?: TPersistOptions) => {
    try {
      await updateAsset({ updateAssetId: assetId, input: toAssetInlineInput(input) })
      successNotification({ title: 'Asset updated' })
    } catch (error) {
      errorNotification({ title: 'Failed to update asset', description: parseErrorMessage(error) })
      if (options?.throwOnError) throw error
    }
  }

  const handleRemoveAssociation = useAssociationRemoval({
    entityId: assetId,
    handleUpdateField: (input: UpdateAssetInput) => handleUpdateField(input, { throwOnError: true }),
    queryClient,
    cacheTargets: CACHE_TARGETS,
    sectionKeyToRemoveField: ASSOCIATION_REMOVAL_CONFIG.asset.sectionKeyToRemoveField,
    sectionKeyToDataField: ASSOCIATION_REMOVAL_CONFIG.asset.sectionKeyToDataField,
    sectionKeyToInvalidateQueryKey: ASSOCIATION_REMOVAL_CONFIG.asset.sectionKeyToInvalidateQueryKey,
  })

  const onSubmit = async (values: AssetFormData) => {
    try {
      const input = await buildDirtyInput<UpdateAssetInput>(values, ASSET_UPDATE_FIELDS)
      if (Object.keys(input).length > 0) {
        await updateAsset({ updateAssetId: assetId, input })
        successNotification({ title: 'Asset updated', description: 'The asset was successfully updated.' })
        form.reset(values)
      } else {
        form.reset()
      }
      setIsEditing(false)
    } catch (error) {
      errorNotification({ title: 'Failed to update asset', description: parseErrorMessage(error) })
    }
  }

  const handleInvalidSubmit = (errors: FieldErrors<AssetFormData>) => {
    tabs.onTabChange('overview')
    errorNotification({ title: 'Asset not saved', description: Object.values(errors)[0]?.message?.toString() ?? 'Fix the highlighted fields and try again.' })
  }

  const discardEdits = () => {
    form.reset(normalizeAssetData(asset))
    setIsEditing(false)
  }

  const handleDelete = async () => {
    try {
      await deleteAsset({ deleteAssetId: assetId })
      queryClient.removeQueries({ queryKey: ['assets', assetId] })
      successNotification({ title: 'Asset deleted successfully.' })
      router.push(ASSETS_HREF)
    } catch (error) {
      errorNotification({ title: 'Failed to delete asset', description: parseErrorMessage(error) })
    } finally {
      setIsDeleteDialogOpen(false)
    }
  }

  const sectionProps: TAssetSectionProps = { asset, isEditing, canEdit: canEditAsset, internalEditing, setInternalEditing, handleUpdate: handleUpdateField }
  const relationships = relationshipsData?.asset ?? undefined

  return (
    <>
      <title>{`${organizationName ?? 'Openlane'} | Assets - ${title}`}</title>
      <FormProvider {...form}>
        <SlideBarLayout
          sidebarTitle="Details"
          sidebarContent={
            <>
              <ObjectAssociationSwitch sections={sections} centerNode={centerNode} canEdit={canEditAsset} onRemoveAssociation={handleRemoveAssociation} />
              <AssetPropertiesCard {...sectionProps} enumOpts={enumOpts} enumCreateHandlers={enumCreateHandlers} relationships={relationships} />
              <AssetSourceCard {...sectionProps} enumOpts={enumOpts} relationships={relationships} />
            </>
          }
          slideOpen={isEditing}
          open={isRailOpen}
          onOpenChange={setIsRailOpen}
          minWidth={430}
          collapsedContentClassName="pr-6"
        >
          <div className="space-y-6 px-2">
            <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}>
              <AssetDetailHeader
                {...sectionProps}
                enumOpts={enumOpts}
                enumCreateHandlers={enumCreateHandlers}
                isSaving={isSaving}
                canDelete={canDelete(permission?.roles)}
                onEdit={(event) => {
                  event.preventDefault()
                  startEditing()
                }}
                onCancel={(event) => {
                  event.preventDefault()
                  discardEdits()
                }}
                onDeleteClick={() => setIsDeleteDialogOpen(true)}
                onAskAI={() => setIsAskAIOpen(true)}
              />
            </form>
            {!isEditing && <AssetQuickActions canUploadEvidence={canUploadEvidence} canMapControl={canMapControl} canLinkExposure={canLinkExposure} canReview={canReview} onOpenDialog={setDialog} />}
            <DetailTabs state={tabs} counts={{ exposure: exposure.totalCount, vendor: vendors.totalCount }}>
              <TabsContent value="overview">
                <AssetOverviewTab
                  {...sectionProps}
                  enumOpts={enumOpts}
                  enumCreateHandlers={enumCreateHandlers}
                  checks={readiness.checks}
                  isReadinessLoading={readiness.isLoading}
                  availableActions={availableActions}
                  onReadinessAction={handleReadinessAction}
                />
              </TabsContent>
              <TabsContent value="relationships">
                <AssetRelationshipsTab asset={asset} canEdit={canEditAsset} handleUpdate={handleUpdateField} />
              </TabsContent>
              <TabsContent value="exposure">
                <AssetExposureTab assetId={assetId} exposure={exposure} view={exposureView} canEdit={canLinkExposure} onLinkExposure={() => setDialog('link-exposure')} />
              </TabsContent>
              <TabsContent value="vendor">
                <AssetVendorTab assetId={assetId} vendors={vendors.vendors} isPending={vendors.isPending} isError={vendors.isError} canEdit={canEditAsset} handleUpdate={handleUpdateField} />
              </TabsContent>
              <TabsContent value="history">
                <AssetHistoryTab asset={asset} exposure={exposure.items} vendors={vendors.vendors} />
              </TabsContent>
            </DetailTabs>
          </div>
        </SlideBarLayout>
      </FormProvider>

      <AssetDialogs asset={asset} exposure={exposure.items} dialog={dialog} onClose={() => setDialog(null)} />

      <CancelDialog
        isOpen={navGuard.active}
        onConfirm={() => {
          discardEdits()
          navGuard.accept()
        }}
        onCancel={navGuard.reject}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Asset"
        description={
          <>
            This action cannot be undone. This will permanently remove <b>{title}</b> from the organization.
          </>
        }
      />

      <AIChat
        open={isAskAIOpen}
        onOpenChange={setIsAskAIOpen}
        providedContext={{
          organization: { organizationName },
          user: { name: userData?.user?.displayName },
          background: `Asset details for the provided request, use this information to answer the user's question or provide suggestions: ${JSON.stringify({
            name: title,
            type: asset.assetType,
            subtype: asset.assetSubtypeName,
            environment: asset.environmentName,
            scope: asset.scopeName,
            criticality: asset.criticalityName,
            dataClassification: asset.assetDataClassificationName,
            securityTier: asset.securityTierName,
            encryptionStatus: asset.encryptionStatusName,
            accessModel: asset.accessModelName,
            containsPii: asset.containsPii,
            vendors: vendors.vendors.map(({ displayName, name }) => displayName || name),
            openExposure: exposure.items.filter(({ isOpen }) => isOpen).length,
          })}`,
        }}
        contextKey={asset.id}
        object={{ type: 'asset', name: title }}
      />
    </>
  )
}

export default AssetDetail
