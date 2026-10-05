'use client'

import React, { useState } from 'react'
import { TabsContent } from '@repo/ui/tabs'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { useDetailTabs, type TDetailTab } from '@/components/shared/detail-tabs/use-detail-tabs'
import OverviewTab from './overview/overview-tab'
import DocumentsTab from './documents/documents-tab'
import CampaignsTab from './campaigns/campaigns-tab'
import AssessmentsTab from './questionnaires/questionnaires-tab'
import HistoryTab from './history/history-tab'
import LinkedAccountsTab from './linked-accounts/linked-accounts-tab'
import type { IdentityHolderQuery, UpdateIdentityHolderInput } from '@repo/codegen/src/schema'

type PersonnelTabValue = 'overview' | 'documents' | 'linked-accounts' | 'campaigns' | 'assessments' | 'history'

const PERSONNEL_TABS: TDetailTab<PersonnelTabValue>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'documents', label: 'Documents' },
  { value: 'linked-accounts', label: 'Linked Accounts' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'assessments', label: 'Assessments' },
  { value: 'history', label: 'History' },
]

interface PersonnelDetailTabsProps {
  personnel: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateIdentityHolderInput) => Promise<void>
}

const PersonnelDetailTabs: React.FC<PersonnelDetailTabsProps> = ({ personnel, isEditing, canEdit: canEditPersonnel, handleUpdateField }) => {
  const [campaignSearchTerm, setCampaignSearchTerm] = useState('')
  const tabs = useDetailTabs({ page: 'personnel', tabs: PERSONNEL_TABS, defaultTab: 'overview' })

  return (
    <DetailTabs state={tabs}>
      <TabsContent value="overview" className="space-y-6">
        <OverviewTab personnel={personnel} isEditing={isEditing} canEdit={canEditPersonnel} handleUpdateField={handleUpdateField} />
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <DocumentsTab personnelId={personnel.id} canEdit={canEditPersonnel} />
      </TabsContent>

      <TabsContent value="linked-accounts" className="space-y-6">
        <LinkedAccountsTab personnelId={personnel.id} />
      </TabsContent>

      <TabsContent value="campaigns" className="space-y-6">
        <CampaignsTab personnelEmail={personnel.email} searchTerm={campaignSearchTerm} onSearchTermChange={setCampaignSearchTerm} />
      </TabsContent>

      <TabsContent value="assessments" className="space-y-6">
        <AssessmentsTab personnelId={personnel.id} personnelEmail={personnel.email} />
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <HistoryTab personnel={personnel} />
      </TabsContent>
    </DetailTabs>
  )
}

export default PersonnelDetailTabs
