'use client'

import React, { use, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { SquarePlus, User, Users, Network } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Badge } from '@repo/ui/badge'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { Callout } from '@/components/shared/callout/callout'
import { usePlatformsWithFilter, useCreatePlatform, useUpdatePlatform } from '@/lib/graphql-hooks/platform'
import { type Platform, PlatformPlatformStatus, type CreatePlatformInput } from '@repo/codegen/src/schema'
import { StepDialog } from '@/components/shared/crud-base/step-dialog'
import { createPlatformSteps } from '../create/steps/platform-create-steps'
import useFormSchema, { type EditPlatformFormData } from '../hooks/use-form-schema'
import { buildResponsibilityPayload } from '@/components/shared/crud-base/form-fields/responsibility-field-utils'
import { toHumanLabel } from '@/utils/strings'
import { CustomEnumChipCell } from '@/components/shared/crud-base/columns/custom-enum-chip-cell'
import usePlateEditor from '@/components/shared/plate/usePlateEditor'
import { type Value } from 'platejs'
import { objectType } from '../table/types'
import Skeleton from '@/components/shared/skeleton/skeleton'

const STATUS_VARIANT: Record<PlatformPlatformStatus, 'green' | 'secondary'> = {
  [PlatformPlatformStatus.ACTIVE]: 'green',
  [PlatformPlatformStatus.INACTIVE]: 'secondary',
  [PlatformPlatformStatus.RETIRED]: 'secondary',
}

const PlatformsDashboardPage: React.FC = () => {
  const { setCrumbs } = use(BreadcrumbContext)
  const { form } = useFormSchema()
  const plateEditorHelper = usePlateEditor()
  const [showCreate, setShowCreate] = useState(false)

  const { data: session } = useSession()
  const { platformsNodes, isLoading, isSuccess } = usePlatformsWithFilter({})
  const { mutateAsync: createPlatform, isPending: isCreatePending } = useCreatePlatform()
  const { mutateAsync: updatePlatform, isPending: isUpdatePending } = useUpdatePlatform()

  const pendingLinksRef = useRef<{
    assetIDs?: string[]
    entityIDs?: string[]
    outOfScopeAssetIDs?: string[]
    outOfScopeVendorIDs?: string[]
  }>({})

  useEffect(() => {
    setCrumbs([
      { label: 'Home', href: '/dashboard' },
      { label: 'Registry', href: '/registry/platforms' },
      { label: 'Platforms', href: '/registry/platforms' },
    ])
  }, [setCrumbs])

  const createMutation = useMemo(
    () => ({
      mutateAsync: async (input: CreatePlatformInput) => {
        const result = await createPlatform({ input })
        const newId = result.createPlatform?.platform?.id
        const links = pendingLinksRef.current

        if (newId && (links.assetIDs?.length || links.entityIDs?.length || links.outOfScopeAssetIDs?.length || links.outOfScopeVendorIDs?.length)) {
          await updatePlatform({
            updatePlatformId: newId,
            input: {
              addAssetIDs: links.assetIDs?.length ? links.assetIDs : undefined,
              addEntityIDs: links.entityIDs?.length ? links.entityIDs : undefined,
              addOutOfScopeAssetIDs: links.outOfScopeAssetIDs?.length ? links.outOfScopeAssetIDs : undefined,
              addOutOfScopeVendorIDs: links.outOfScopeVendorIDs?.length ? links.outOfScopeVendorIDs : undefined,
            },
          })
        }

        pendingLinksRef.current = {}
        return result
      },
      isPending: isCreatePending || isUpdatePending,
    }),
    [createPlatform, updatePlatform, isCreatePending, isUpdatePending],
  )

  const buildPayload = async (data: EditPlatformFormData): Promise<CreatePlatformInput> => {
    const { businessOwner, technicalOwner, platformOwner, entityIDs, outOfScopeVendorIDs, assetIDs, outOfScopeAssetIDs, ...rest } = data

    // Stash relationship IDs — will be applied via follow-up update after creation
    pendingLinksRef.current = {
      assetIDs: assetIDs?.length ? assetIDs : undefined,
      entityIDs: entityIDs?.length ? entityIDs : undefined,
      outOfScopeAssetIDs: outOfScopeAssetIDs?.length ? outOfScopeAssetIDs : undefined,
      outOfScopeVendorIDs: outOfScopeVendorIDs?.length ? outOfScopeVendorIDs : undefined,
    }

    const [businessPurpose, dataFlowSummary, trustBoundaryDescription] = await Promise.all([
      rest.businessPurpose ? plateEditorHelper.convertToHtml(rest.businessPurpose as Value) : undefined,
      rest.dataFlowSummary ? plateEditorHelper.convertToHtml(rest.dataFlowSummary as Value) : undefined,
      rest.trustBoundaryDescription ? plateEditorHelper.convertToHtml(rest.trustBoundaryDescription as Value) : undefined,
    ])
    return {
      name: rest.name,
      description: rest.description || undefined,
      status: rest.status,
      scopeName: rest.scopeName,
      environmentName: rest.environmentName,
      containsPii: rest.containsPii,
      businessPurpose,
      dataFlowSummary,
      trustBoundaryDescription,
      platformOwnerID: platformOwner?.type === 'user' ? platformOwner.value : (session?.user?.id ?? undefined),
      ...buildResponsibilityPayload('businessOwner', businessOwner, { mode: 'create' }),
      ...buildResponsibilityPayload('technicalOwner', technicalOwner, { mode: 'create' }),
    } as CreatePlatformInput
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton width="12rem" height="2rem" />
          <Skeleton width="8rem" height="2.25rem" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} width="100%" height="12rem" />
          ))}
        </div>
      </div>
    )
  }

  const hasNoPlatforms = isSuccess && !platformsNodes.length

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-semibold">Platforms</h2>
        <Button icon={<SquarePlus />} iconPosition="left" onClick={() => setShowCreate(true)}>
          Create Platform
        </Button>
      </div>

      {hasNoPlatforms ? (
        <Callout variant="info" title="No platforms yet">
          Each platform represents a top-level system (e.g. a product or service) and defines its audit scope. Create your first platform to begin organizing assets, vendors, and ownership.
        </Callout>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformsNodes.map((platform) => (
            <PlatformCard key={platform.id} platform={platform as unknown as Platform} />
          ))}
        </div>
      )}

      {showCreate && (
        <StepDialog<EditPlatformFormData, CreatePlatformInput, unknown>
          objectType={objectType}
          form={form}
          steps={createPlatformSteps()}
          title="Create Platform"
          dialogClassName="sm:max-w-2xl"
          createMutation={createMutation as { mutateAsync: (input: CreatePlatformInput) => Promise<unknown>; isPending: boolean }}
          buildPayload={buildPayload}
          onClose={() => {
            setShowCreate(false)
            form.reset()
          }}
        />
      )}
    </div>
  )
}

const PlatformCard: React.FC<{ platform: Platform }> = ({ platform }) => {
  const plateEditorHelper = usePlateEditor()

  const ownerName = platform.platformOwner?.displayName ?? platform.businessOwnerUser?.displayName ?? platform.businessOwnerGroup?.name ?? platform.businessOwner ?? null

  const ownerIcon = platform.businessOwnerGroup ? <Users size={14} className="text-muted-foreground shrink-0" /> : <User size={14} className="text-muted-foreground shrink-0" />

  return (
    <Card className="flex flex-col gap-0 p-0 overflow-hidden hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between p-5 pb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <Network size={18} className="text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate leading-tight">{platform.name}</p>
            {platform.displayID && <p className="text-xs text-muted-foreground">{platform.displayID}</p>}
          </div>
        </div>
        {platform.status && (
          <Badge variant={STATUS_VARIANT[platform.status as PlatformPlatformStatus] ?? 'secondary'} className="shrink-0 text-xs">
            {toHumanLabel(platform.status)}
          </Badge>
        )}
      </div>

      {platform.businessPurpose && (
        <div className="px-5 pb-3">
          <div className="text-sm text-muted-foreground line-clamp-2 prose prose-sm dark:prose-invert max-w-none">{plateEditorHelper.convertToReadOnly(platform.businessPurpose)}</div>
        </div>
      )}

      <CardContent className="px-5 pb-4 pt-0 space-y-3 mt-auto">
        <div className="flex flex-wrap gap-1.5">
          {platform.environmentName && <CustomEnumChipCell value={platform.environmentName} field="environment" />}
          {platform.scopeName && <CustomEnumChipCell value={platform.scopeName} field="scope" />}
          {platform.containsPii && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <div className="shrink-0 w-2 h-2 rounded-full bg-red-500" />
              PII
            </Badge>
          )}
        </div>

        {ownerName && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground truncate">
            {ownerIcon}
            <span className="truncate">Owner: {ownerName}</span>
          </div>
        )}

        <Link href={`/registry/platforms/${platform.id}`} className="block">
          <Button variant="secondary" className="w-full" size="md">
            View Platform
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export default PlatformsDashboardPage
