'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { usePlatform, useUpdatePlatform, useDeletePlatform } from '@/lib/graphql-hooks/platform'
import { useNotification } from '@/hooks/useNotification'
import { useAccountRoles } from '@/lib/query-hooks/permissions'
import { canEdit, canDelete } from '@/lib/authz/utils'
import { useHasScrollbar } from '@/hooks/useHasScrollbar'
import { ObjectTypes } from '@repo/codegen/src/type-names'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { Pencil, Trash2, MoreHorizontal, NetworkIcon, Laptop, Building2, User, Users } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { type Platform, PlatformPlatformStatus, type UpdatePlatformInput } from '@repo/codegen/src/schema'
import PlatformAssetsTable from './platform-assets-table'
import PlatformVendorsTable from './platform-vendors-table'
import PlatformGraph from './platform-graph'
import Skeleton from '@/components/shared/skeleton/skeleton'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import useFormSchema, { type EditPlatformFormData } from '../hooks/use-form-schema'
import { buildResponsibilityPayload, normalizeResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { type Value } from 'platejs'
import { StepDialog } from '@/components/shared/crud-base/step-dialog'
import { createPlatformSteps } from '../create/steps/platform-create-steps'
import { useQueryClient } from '@tanstack/react-query'

interface PlatformDetailPageProps {
  platformId: string
}

const STATUS_VARIANT: Record<PlatformPlatformStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [PlatformPlatformStatus.ACTIVE]: 'default',
  [PlatformPlatformStatus.INACTIVE]: 'secondary',
  [PlatformPlatformStatus.RETIRED]: 'destructive',
}

const PlatformDetailPage: React.FC<PlatformDetailPageProps> = ({ platformId }) => {
  const router = useRouter()
  const { setCrumbs } = React.use(BreadcrumbContext)
  const { successNotification, errorNotification } = useNotification()
  const plateEditorHelper = usePlateEditor()
  const { form } = useFormSchema()
  const queryClient = useQueryClient()

  const { data, isLoading } = usePlatform(platformId)
  const { data: permission } = useAccountRoles(ObjectTypes.PLATFORM, platformId)
  const { mutateAsync: deletePlatform } = useDeletePlatform()
  const { mutateAsync: updatePlatformMutation, isPending: isUpdatePending } = useUpdatePlatform()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const platform = data?.platform as Platform | undefined
  const canEditPlatform = canEdit(permission?.roles)
  const canDeletePlatform = canDelete(permission?.roles)

  const hasScrollbar = useHasScrollbar([platform])

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Registry', href: '/registry/platforms' },
      { label: 'Platforms', href: '/registry/platforms' },
      { label: platform?.name ?? '', isLoading },
    ])
  }, [setCrumbs, platform?.name, isLoading])

  useEffect(() => {
    if (isEditOpen && platform) {
      form.reset({
        name: platform.name ?? '',
        status: platform.status,
        businessPurpose: platform.businessPurpose ?? undefined,
        dataFlowSummary: platform.dataFlowSummary ?? undefined,
        trustBoundaryDescription: platform.trustBoundaryDescription ?? undefined,
        scopeName: platform.scopeName,
        environmentName: platform.environmentName,
        containsPii: platform.containsPii ?? false,
        platformOwner: platform.platformOwnerID ? { type: 'user' as const, value: platform.platformOwnerID, displayName: platform.platformOwner?.displayName ?? platform.platformOwnerID } : undefined,
        businessOwner: normalizeResponsibilityField({
          user: platform.businessOwnerUser ? { id: platform.businessOwnerUser.id, displayName: platform.businessOwnerUser.displayName } : null,
          group: platform.businessOwnerGroup ? { id: platform.businessOwnerGroup.id, displayName: platform.businessOwnerGroup.name } : null,
          stringValue: platform.businessOwner,
        }),
        technicalOwner: normalizeResponsibilityField({
          user: platform.technicalOwnerUser ? { id: platform.technicalOwnerUser.id, displayName: platform.technicalOwnerUser.displayName } : null,
          group: platform.technicalOwnerGroup ? { id: platform.technicalOwnerGroup.id, displayName: platform.technicalOwnerGroup.name } : null,
          stringValue: platform.technicalOwner,
        }),
        assetIDs: (platform.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        outOfScopeAssetIDs: (platform.outOfScopeAssets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        entityIDs: (platform.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        outOfScopeVendorIDs: (platform.outOfScopeVendors?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      })
    }
  }, [isEditOpen, platform, form])

  const editMutation = useMemo(
    () => ({
      mutateAsync: async (input: UpdatePlatformInput) => {
        const result = await updatePlatformMutation({ updatePlatformId: platformId, input })
        queryClient.invalidateQueries({ queryKey: ['platform', platformId] })
        return result
      },
      isPending: isUpdatePending,
    }),
    [updatePlatformMutation, platformId, isUpdatePending, queryClient],
  )

  const editBuildPayload = async (data: EditPlatformFormData): Promise<UpdatePlatformInput> => {
    const { businessOwner, technicalOwner, platformOwner, entityIDs, outOfScopeVendorIDs, assetIDs, outOfScopeAssetIDs, ...rest } = data

    // Compute diffs for relationship fields — update uses add*/remove* pattern
    const currentAssetIDs = new Set((platform?.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [])
    const currentOutOfScopeAssetIDs = new Set((platform?.outOfScopeAssets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [])
    const currentEntityIDs = new Set((platform?.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [])
    const currentOutOfScopeVendorIDs = new Set((platform?.outOfScopeVendors?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [])

    const newAssetIDs = new Set(assetIDs ?? [])
    const newOutOfScopeAssetIDs = new Set(outOfScopeAssetIDs ?? [])
    const newEntityIDs = new Set(entityIDs ?? [])
    const newOutOfScopeVendorIDs = new Set(outOfScopeVendorIDs ?? [])

    const addAssetIDs = [...newAssetIDs].filter((id) => !currentAssetIDs.has(id))
    const removeAssetIDs = [...currentAssetIDs].filter((id) => !newAssetIDs.has(id))
    const addOutOfScopeAssetIDs = [...newOutOfScopeAssetIDs].filter((id) => !currentOutOfScopeAssetIDs.has(id))
    const removeOutOfScopeAssetIDs = [...currentOutOfScopeAssetIDs].filter((id) => !newOutOfScopeAssetIDs.has(id))
    const addEntityIDs = [...newEntityIDs].filter((id) => !currentEntityIDs.has(id))
    const removeEntityIDs = [...currentEntityIDs].filter((id) => !newEntityIDs.has(id))
    const addOutOfScopeVendorIDs = [...newOutOfScopeVendorIDs].filter((id) => !currentOutOfScopeVendorIDs.has(id))
    const removeOutOfScopeVendorIDs = [...currentOutOfScopeVendorIDs].filter((id) => !newOutOfScopeVendorIDs.has(id))

    const [businessPurpose, dataFlowSummary, trustBoundaryDescription] = await Promise.all([
      rest.businessPurpose ? plateEditorHelper.convertToHtml(rest.businessPurpose as Value) : undefined,
      rest.dataFlowSummary ? plateEditorHelper.convertToHtml(rest.dataFlowSummary as Value) : undefined,
      rest.trustBoundaryDescription ? plateEditorHelper.convertToHtml(rest.trustBoundaryDescription as Value) : undefined,
    ])
    return {
      name: rest.name,
      status: rest.status,
      scopeName: rest.scopeName,
      environmentName: rest.environmentName,
      containsPii: rest.containsPii,
      businessPurpose,
      dataFlowSummary,
      trustBoundaryDescription,
      platformOwnerID: platformOwner?.type === 'user' ? platformOwner.value : undefined,
      clearPlatformOwner: !platformOwner || platformOwner.type !== 'user' ? true : undefined,
      ...buildResponsibilityPayload('businessOwner', businessOwner, { mode: 'update' }),
      ...buildResponsibilityPayload('technicalOwner', technicalOwner, { mode: 'update' }),
      addAssetIDs: addAssetIDs.length ? addAssetIDs : undefined,
      removeAssetIDs: removeAssetIDs.length ? removeAssetIDs : undefined,
      addOutOfScopeAssetIDs: addOutOfScopeAssetIDs.length ? addOutOfScopeAssetIDs : undefined,
      removeOutOfScopeAssetIDs: removeOutOfScopeAssetIDs.length ? removeOutOfScopeAssetIDs : undefined,
      addEntityIDs: addEntityIDs.length ? addEntityIDs : undefined,
      removeEntityIDs: removeEntityIDs.length ? removeEntityIDs : undefined,
      addOutOfScopeVendorIDs: addOutOfScopeVendorIDs.length ? addOutOfScopeVendorIDs : undefined,
      removeOutOfScopeVendorIDs: removeOutOfScopeVendorIDs.length ? removeOutOfScopeVendorIDs : undefined,
    } as UpdatePlatformInput
  }

  const handleDelete = async () => {
    try {
      await deletePlatform({ deletePlatformId: platformId })
      successNotification({ title: 'Platform deleted', description: 'The platform was successfully deleted.' })
      router.push('/registry/platforms')
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton width="16rem" height="2.5rem" />
        <Skeleton width="100%" height="8rem" />
        <Skeleton width="100%" height="12rem" />
      </div>
    )
  }

  if (!platform) return null

  const inScopeAssets = platform.assets?.edges?.map((e) => e?.node).filter((n): n is NonNullable<typeof n> => n != null) ?? []
  const outOfScopeAssets = platform.outOfScopeAssets?.edges?.map((e) => e?.node).filter((n): n is NonNullable<typeof n> => n != null) ?? []
  const inScopeVendors = platform.entities?.edges?.map((e) => e?.node).filter((n): n is NonNullable<typeof n> => n != null) ?? []
  const outOfScopeVendors = platform.outOfScopeVendors?.edges?.map((e) => e?.node).filter((n): n is NonNullable<typeof n> => n != null) ?? []

  const renderOwner = (label: string, icon: React.ReactNode, name?: string | null, email?: string | null) => {
    if (!name && !email) return null
    return (
      <div className="flex flex-col items-start gap-1 text-sm">
        <span className="text-muted-foreground shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          {icon}
          <span>{name || email}</span>
          {name && email && <span className="text-muted-foreground text-xs">({email})</span>}
        </div>
      </div>
    )
  }

  const renderHtml = (html: string) => {
    return plateEditorHelper.convertToReadOnly(html)
  }

  const sidebarContent = (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3 p-0">
          <CardTitle className="text-sm font-medium">Ownership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {platform.platformOwner && renderOwner('Platform Owner', <User size={14} className="text-muted-foreground" />, platform.platformOwner.displayName, platform.platformOwner.email)}
          {(platform.businessOwnerUser || platform.businessOwnerGroup || platform.businessOwner) &&
            renderOwner(
              'Business Owner',
              platform.businessOwnerGroup ? <Users size={14} className="text-muted-foreground" /> : <User size={14} className="text-muted-foreground" />,
              platform.businessOwnerUser?.displayName ?? platform.businessOwnerGroup?.name ?? platform.businessOwner,
              platform.businessOwnerUser?.email,
            )}
          {(platform.technicalOwnerUser || platform.technicalOwnerGroup || platform.technicalOwner) &&
            renderOwner(
              'Technical Owner',
              platform.technicalOwnerGroup ? <Users size={14} className="text-muted-foreground" /> : <User size={14} className="text-muted-foreground" />,
              platform.technicalOwnerUser?.displayName ?? platform.technicalOwnerGroup?.name ?? platform.technicalOwner,
              platform.technicalOwnerUser?.email,
            )}
          {!platform.platformOwner &&
            !platform.businessOwnerUser &&
            !platform.businessOwnerGroup &&
            !platform.businessOwner &&
            !platform.technicalOwner &&
            !platform.technicalOwnerUser &&
            !platform.technicalOwnerGroup && <p className="text-sm text-muted-foreground">No owners assigned.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3 p-0">
          <CardTitle className="text-sm font-medium flex items-center gap-1.5">
            <NetworkIcon size={14} />
            Graph
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PlatformGraph platform={platform} inScopeAssets={inScopeAssets} outOfScopeAssets={outOfScopeAssets} inScopeVendors={inScopeVendors} outOfScopeVendors={outOfScopeVendors} />
        </CardContent>
      </Card>
    </div>
  )

  const mainContent = (
    <div className="flex flex-col gap-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold truncate">{platform.name}</h1>
              {platform.status && <Badge variant={STATUS_VARIANT[platform.status as PlatformPlatformStatus] ?? 'outline'}>{platform.status}</Badge>}
              {platform.scopeName && (
                <Badge variant="outline" className="text-xs">
                  {platform.scopeName}
                </Badge>
              )}
              {platform.environmentName && (
                <Badge variant="secondary" className="text-xs">
                  {platform.environmentName}
                </Badge>
              )}
              {platform.containsPii && (
                <Badge variant="destructive" className="text-xs">
                  Contains PII
                </Badge>
              )}
            </div>
            {platform.displayID && <span className="text-xs text-muted-foreground">{platform.displayID}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {canEditPlatform && (
            <Button type="button" variant="secondary" className="h-8 px-3 gap-1.5" onClick={() => setIsEditOpen(true)}>
              <Pencil size={14} />
              Edit
            </Button>
          )}
          {canDeletePlatform && (
            <Menu
              trigger={
                <Button type="button" variant="secondary" className="h-8 px-2">
                  <MoreHorizontal size={16} />
                </Button>
              }
              content={
                <button onClick={() => setIsDeleteDialogOpen(true)} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer text-destructive">
                  <Trash2 size={16} strokeWidth={2} />
                  <span>Delete</span>
                </button>
              }
            />
          )}
        </div>
      </div>

      {(platform.businessPurpose || platform.dataFlowSummary || platform.trustBoundaryDescription) && (
        <div className="grid gap-4">
          {platform.businessPurpose && (
            <Card>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Business Purpose</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">{renderHtml(platform.businessPurpose)}</div>
              </CardContent>
            </Card>
          )}
          {platform.dataFlowSummary && (
            <Card>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Data Flow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">{renderHtml(platform.dataFlowSummary)}</div>
              </CardContent>
            </Card>
          )}
          {platform.trustBoundaryDescription && (
            <Card>
              <CardHeader className="p-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trust Boundary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">{renderHtml(platform.trustBoundaryDescription)}</div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Tabs defaultValue="assets">
        <TabsList>
          <TabsTrigger value="assets" className="flex items-center gap-1.5 pl-2">
            <Laptop size={14} />
            Assets
            <Badge variant="secondary" className="ml-1 text-xs">
              {inScopeAssets.length + outOfScopeAssets.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-1.5 pl-2">
            <Building2 size={14} />
            Vendors
            <Badge variant="secondary" className="ml-1 text-xs">
              {inScopeVendors.length + outOfScopeVendors.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="mt-4">
          <PlatformAssetsTable platformId={platformId} inScopeAssets={inScopeAssets} outOfScopeAssets={outOfScopeAssets} canEdit={canEditPlatform} />
        </TabsContent>

        <TabsContent value="vendors" className="mt-4">
          <PlatformVendorsTable platformId={platformId} inScopeVendors={inScopeVendors} outOfScopeVendors={outOfScopeVendors} canEdit={canEditPlatform} />
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <>
      <SlideBarLayout sidebarTitle="Details" sidebarContent={sidebarContent} minWidth={380} collapsedContentClassName="pr-6" collapsedButtonClassName="-translate-x-4" hasScrollbar={hasScrollbar}>
        {mainContent}
      </SlideBarLayout>

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Platform"
        description={`Are you sure you want to delete "${platform.name}"? This action cannot be undone.`}
        onConfirm={() => {
          void handleDelete()
        }}
      />

      {isEditOpen && (
        <StepDialog<EditPlatformFormData, UpdatePlatformInput, unknown>
          objectType={ObjectTypes.PLATFORM}
          form={form}
          steps={createPlatformSteps()}
          title={`Edit ${platform.name}`}
          dialogClassName="sm:max-w-2xl"
          createMutation={editMutation as { mutateAsync: (input: UpdatePlatformInput) => Promise<unknown>; isPending: boolean }}
          buildPayload={editBuildPayload}
          onClose={() => {
            setIsEditOpen(false)
            form.reset()
          }}
        />
      )}
    </>
  )
}

export default PlatformDetailPage
