'use client'

import React, { useState } from 'react'
import { Badge } from '@repo/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { EntityQuery, GetEntityAssociationsQuery } from '@repo/codegen/src/schema'
import DomainsSection from './domains-section'
import SecuritySection from './security-section'
import DependenciesSection from './dependencies-section'

interface OverviewTabProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  isEditing: boolean
  canEdit: boolean
}

type SubTab = 'domains' | 'security' | 'dependencies'

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
          <TabsTrigger value="dependencies" className="whitespace-nowrap">
            Dependencies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="domains">
          <DomainsSection domains={vendor.domains ?? []} vendorId={vendor.id} canEdit={canEdit} />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySection vendor={vendor} />
        </TabsContent>

        <TabsContent value="dependencies">
          <DependenciesSection vendor={vendor} associations={associations} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OverviewTab
