'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BreadcrumbContext } from '@/providers/BreadcrumbContext'
import { usePlatform, useDeletePlatform } from '@/lib/graphql-hooks/platform'
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
import { Trash2, MoreHorizontal, NetworkIcon, Laptop, Building2, User, Users } from 'lucide-react'
import Menu from '@/components/shared/menu/menu'
import SlideBarLayout from '@/components/shared/slide-bar/slide-bar'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { useState } from 'react'
import { type Platform, PlatformPlatformStatus } from '@repo/codegen/src/schema'
import PlatformAssetsTable from './platform-assets-table'
import PlatformVendorsTable from './platform-vendors-table'
import PlatformGraph from './platform-graph'
import Skeleton from '@/components/shared/skeleton/skeleton'

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

  const { data, isLoading } = usePlatform(platformId)
  const { data: permission } = useAccountRoles(ObjectTypes.PLATFORM, platformId)
  const { mutateAsync: deletePlatform } = useDeletePlatform()

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground w-36 shrink-0">{label}</span>
        <div className="flex items-center gap-1.5">
          {icon}
          <span>{name || email}</span>
          {name && email && <span className="text-muted-foreground text-xs">({email})</span>}
        </div>
      </div>
    )
  }

  const sidebarContent = (
    <div className="space-y-4">
      {platform.businessPurpose && (
        <Card>
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Business Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{platform.businessPurpose}</p>
          </CardContent>
        </Card>
      )}
      {platform.dataFlowSummary && (
        <Card>
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Data Flow Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{platform.dataFlowSummary}</p>
          </CardContent>
        </Card>
      )}
      {platform.trustBoundaryDescription && (
        <Card>
          <CardHeader className="pb-2 p-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trust Boundary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{platform.trustBoundaryDescription}</p>
          </CardContent>
        </Card>
      )}

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
        <CardContent className="p-0 pb-2">
          <PlatformGraph platform={platform} inScopeAssets={inScopeAssets} outOfScopeAssets={outOfScopeAssets} inScopeVendors={inScopeVendors} outOfScopeVendors={outOfScopeVendors} />
        </CardContent>
      </Card>
    </div>
  )

  const mainContent = (
    <div className="flex flex-col gap-6 pb-10">
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
    </>
  )
}

export default PlatformDetailPage
