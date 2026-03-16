'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import { Input } from '@repo/ui/input'
import { Check, X, Plus, SearchIcon, Link, MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import type { EntityQuery, GetEntityAssociationsQuery } from '@repo/codegen/src/schema'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { useSmartRouter } from '@/hooks/useSmartRouter'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { formatDateSince } from '@/utils/date'
import AddDomainDialog from './add-domain-dialog'
import LinkSystemDialog from './link-system-dialog'
import AddAssetDialog from './add-asset-dialog'

interface OverviewTabProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  isEditing: boolean
  canEdit: boolean
}

type SubTab = 'domains' | 'security' | 'platform'

const OverviewTab: React.FC<OverviewTabProps> = ({ vendor, associations, canEdit }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('domains')

  return (
    <div className="space-y-6">
      {vendor.description && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Description</p>
          <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: vendor.description }} />
        </div>
      )}

      {vendor.tags && vendor.tags.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-3">Provided Services</p>
          <div className="flex flex-wrap gap-2">
            {vendor.tags.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <Tabs value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as SubTab)} variant="solid">
        <TabsList className="w-fit">
          <TabsTrigger value="domains" className="whitespace-nowrap">
            Domains
          </TabsTrigger>
          <TabsTrigger value="security" className="whitespace-nowrap">
            Security Settings
          </TabsTrigger>
          <TabsTrigger value="platform" className="whitespace-nowrap">
            Platform
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains">
          <DomainsSection domains={vendor.domains ?? []} vendorId={vendor.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection vendor={vendor} />
        </TabsContent>

        <TabsContent value="platform">
          <SystemSection vendor={vendor} associations={associations} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface DomainsSectionProps {
  domains: string[]
  vendorId: string
  canEdit: boolean
}

const DomainsSection: React.FC<DomainsSectionProps> = ({ domains, vendorId, canEdit }) => {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const updateEntityMutation = useUpdateEntity()
  const { successNotification, errorNotification } = useNotification()

  const handleRemoveDomain = async (domainToRemove: string) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          domains: domains.filter((d) => d !== domainToRemove),
        },
      })
      successNotification({
        title: 'Domain removed',
        description: `${domainToRemove} has been removed.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Domains</h3>
        {canEdit && (
          <Button type="button" variant="secondary" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setShowAddDialog(true)}>
            Add Domain
          </Button>
        )}
      </div>
      {domains.length > 0 ? (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div key={domain} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
              {domain}
              {canEdit && (
                <button type="button" onClick={() => handleRemoveDomain(domain)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No domains configured</p>
      )}
      {showAddDialog && <AddDomainDialog vendorId={vendorId} existingDomains={domains} onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

const SecuritySection: React.FC<{ vendor: EntityQuery['entity'] }> = ({ vendor }) => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
      <div className="space-y-3">
        <SecurityCard label="Single Sign-On (SSO)">
          <StatusBadge label="Enforced" enabled={vendor.ssoEnforced ?? false} />
        </SecurityCard>
        <SecurityCard label="Multi-Factor Authentication (MFA)">
          <StatusBadge label="Supported" enabled={vendor.mfaSupported ?? false} />
          <StatusBadge label="Enforced" enabled={vendor.mfaEnforced ?? false} />
        </SecurityCard>
        <SecurityCard label="SOC 2 Compliance">
          <StatusBadge label="Compliant" enabled={vendor.hasSoc2 ?? false} />
          {vendor.soc2PeriodEnd && <span className="text-xs text-muted-foreground">Period ends: {vendor.soc2PeriodEnd}</span>}
        </SecurityCard>
      </div>
    </div>
  )
}

const SecurityCard: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
    <span className="text-sm font-medium">{label}</span>
    <div className="flex items-center gap-3">{children}</div>
  </div>
)

const StatusBadge: React.FC<{ label: string; enabled: boolean }> = ({ label, enabled }) => (
  <div className="flex items-center gap-1">
    {enabled ? <Check size={14} className="text-green-500" /> : <X size={14} className="text-destructive" />}
    <span className="text-sm">{label}</span>
  </div>
)

interface SystemSectionProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  canEdit: boolean
}

const SystemSection: React.FC<SystemSectionProps> = ({ vendor, associations, canEdit }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showAddAssetDialog, setShowAddAssetDialog] = useState(false)
  const updateEntityMutation = useUpdateEntity()
  const { successNotification, errorNotification } = useNotification()
  const smartRouter = useSmartRouter()

  const integrations = associations?.entity?.integrations?.edges?.map((e) => e?.node).filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? []
  const assets = associations?.entity?.assets?.edges?.map((e) => e?.node).filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? []

  const filteredIntegrations = integrations.filter((i) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return i.name.toLowerCase().includes(q) || i.kind?.toLowerCase().includes(q)
  })

  const linkedIntegrationIds = integrations.map((i) => i.id)
  const linkedAssetIds = assets.map((a) => a.id)

  const handleUnlinkSystem = async (integrationId: string, integrationName: string) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendor.id,
        input: {
          removeIntegrationIDs: [integrationId],
        },
      })
      successNotification({
        title: 'System unlinked',
        description: `${integrationName} has been unlinked.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleRemoveAsset = async (assetId: string, assetName: string) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendor.id,
        input: {
          removeAssetIDs: [assetId],
        },
      })
      successNotification({
        title: 'Asset removed',
        description: `${assetName} has been removed.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 my-2">
          <Input
            className="bg-transparent w-[280px]"
            icon={<SearchIcon size={16} />}
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            variant="searchTable"
            iconPosition="left"
          />
          <div className="grow flex flex-row items-center gap-2 justify-end">
            {canEdit && (
              <Button type="button" icon={<Link size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setShowLinkDialog(true)}>
                Link System
              </Button>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">System Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Environment</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Connection Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Last Synced</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filteredIntegrations.length > 0 ? (
                filteredIntegrations.map((integration) => (
                  <tr key={integration.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-sm">{integration.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{integration.environmentName ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{integration.integrationType ? getEnumLabel(integration.integrationType) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">—</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDateSince(integration.updatedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="secondary" size="sm" className="size-8 p-0">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEdit && (
                            <DropdownMenuItem onClick={() => handleUnlinkSystem(integration.id, integration.name)} className="text-destructive">
                              Unlink System
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No systems linked
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Assets</h3>
          {canEdit && (
            <Button type="button" variant="secondary" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setShowAddAssetDialog(true)}>
              Add New Asset
            </Button>
          )}
        </div>
        {assets.length > 0 ? (
          <div className="space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => smartRouter.replace({ assetId: asset.id })}
              >
                <span>{asset.displayName || asset.name}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveAsset(asset.id, asset.displayName || asset.name)
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No assets configured</p>
        )}
      </div>

      {showLinkDialog && <LinkSystemDialog vendorId={vendor.id} linkedIntegrationIds={linkedIntegrationIds} onClose={() => setShowLinkDialog(false)} />}
      {showAddAssetDialog && <AddAssetDialog vendorId={vendor.id} linkedAssetIds={linkedAssetIds} onClose={() => setShowAddAssetDialog(false)} />}
    </div>
  )
}

export default OverviewTab
