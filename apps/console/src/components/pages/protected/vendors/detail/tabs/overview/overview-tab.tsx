'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { EntityQuery, GetEntityAssociationsQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import DescriptionField from '@/components/pages/protected/vendors/create/form/fields/description-field'
import DomainsSection from './domains-section'
import SecuritySection from './security-section'
import DependenciesSection from './dependencies-section'

interface OverviewTabProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
}

type SubTab = 'domains' | 'security' | 'dependencies'

const OverviewTab: React.FC<OverviewTabProps> = ({ vendor, associations, isEditing, canEdit, handleUpdateField }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('domains')

  return (
    <div className="space-y-6">
      <DescriptionField isEditing={isEditing} isCreate={false} initialValue={typeof vendor.description === 'string' ? vendor.description : null} isFormInitialized />

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
          <SecuritySection vendor={vendor} isEditing={isEditing} canEdit={canEdit} handleUpdateField={handleUpdateField} />
        </TabsContent>

        <TabsContent value="dependencies">
          <DependenciesSection vendor={vendor} associations={associations} canEdit={canEdit} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default OverviewTab
