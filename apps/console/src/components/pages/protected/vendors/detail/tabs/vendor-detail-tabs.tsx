'use client'

import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import DetailTabs from '@/components/shared/detail-tabs/detail-tabs'
import { useDetailTabs, type TDetailTab } from '@/components/shared/detail-tabs/use-detail-tabs'
import OverviewTab from './overview/overview-tab'
import DocumentsTab from './documents/documents-tab'
import ContactsTab from './contacts/contacts-tab'
import RiskReviewTab from './risk-review/risk-review-tab'
import DirectoryTab from './directory/directory-tab'
import ActivityTab from './activity/activity-tab'
import type { EntityQuery, GetEntityAssociationsQuery, UpdateEntityInput } from '@repo/codegen/src/schema'
import { type TPersistOptions } from '@/components/shared/crud-base/persist-form-field'

type VendorTabValue = 'overview' | 'documents' | 'contacts' | 'risk-review' | 'directory' | 'activity'

const VENDOR_TABS: TDetailTab<VendorTabValue>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'documents', label: 'Documents' },
  { value: 'contacts', label: 'Contacts' },
  { value: 'risk-review', label: 'Risk Review' },
  { value: 'directory', label: 'Directory' },
  { value: 'activity', label: 'Activity' },
]

const NO_TABS: ReadonlySet<VendorTabValue> = new Set()
const DIRECTORY_TAB_ONLY: ReadonlySet<VendorTabValue> = new Set(['directory'])

interface VendorDetailTabsProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateEntityInput, options?: TPersistOptions) => Promise<void>
}

const VendorDetailTabs: React.FC<VendorDetailTabsProps> = ({ vendor, associations, isEditing, canEdit: canEditVendor, handleUpdateField }) => {
  const hasDirectoryGroups = (vendor.integrations?.edges ?? []).some((edge) => (edge?.node?.directoryGroups?.totalCount ?? 0) > 0)
  const tabs = useDetailTabs({ page: 'vendor', tabs: VENDOR_TABS, defaultTab: 'overview', unavailableTabs: hasDirectoryGroups ? NO_TABS : DIRECTORY_TAB_ONLY })

  return (
    <DetailTabs state={tabs}>
      <TabsContent value="overview" className="space-y-6">
        <OverviewTab vendor={vendor} associations={associations} isEditing={isEditing} canEdit={canEditVendor} handleUpdateField={handleUpdateField} />
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <DocumentsTab vendorId={vendor.id} canEdit={canEditVendor} logoFileId={vendor.logoFileID} />
      </TabsContent>

      <TabsContent value="contacts" className="space-y-6">
        <ContactsTab vendorId={vendor.id} canEdit={canEditVendor} vendorName={vendor.name ?? ''} />
      </TabsContent>

      <TabsContent value="risk-review" className="space-y-6">
        <RiskReviewTab vendor={vendor} handleUpdateField={handleUpdateField} canEdit={canEditVendor} isEditing={isEditing} />
      </TabsContent>

      {hasDirectoryGroups && (
        <TabsContent value="directory" className="space-y-6">
          <DirectoryTab vendor={vendor} />
        </TabsContent>
      )}

      <TabsContent value="activity" className="space-y-6">
        <ActivityTab vendorId={vendor.id} />
      </TabsContent>
    </DetailTabs>
  )
}

export default VendorDetailTabs
