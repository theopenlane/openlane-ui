'use client'

import React, { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import ScrollableTabsList from '@/components/pages/protected/controls/tabs/scrollable-tabs-list'
import OverviewTab from './overview/overview-tab'
import DocumentsTab from './documents/documents-tab'
import ContactsTab from './contacts/contacts-tab'
import RiskReviewTab from './risk-review/risk-review-tab'
import type { EntityQuery, GetEntityAssociationsQuery, UpdateEntityInput } from '@repo/codegen/src/schema'

type VendorTabValue = 'overview' | 'documents' | 'contacts' | 'risk-review'

const DEFAULT_TAB: VendorTabValue = 'overview'
const TAB_QUERY_PARAM = 'tab'
const ALL_TABS: VendorTabValue[] = ['overview', 'documents', 'contacts', 'risk-review']

interface VendorDetailTabsProps {
  vendor: EntityQuery['entity']
  associations?: GetEntityAssociationsQuery
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateEntityInput) => Promise<void>
}

const VendorDetailTabs: React.FC<VendorDetailTabsProps> = ({ vendor, associations, isEditing, canEdit: canEditVendor, handleUpdateField }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const requestedTab = tabParamValue && ALL_TABS.includes(tabParamValue as VendorTabValue) ? (tabParamValue as VendorTabValue) : DEFAULT_TAB
  const activeTab = requestedTab

  const updateTabParam = useCallback(
    (tab: VendorTabValue) => {
      const nextParams = new URLSearchParams(searchParams.toString())

      if (tab === DEFAULT_TAB) {
        nextParams.delete(TAB_QUERY_PARAM)
      } else {
        nextParams.set(TAB_QUERY_PARAM, tab)
      }

      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const expectedParam = activeTab === DEFAULT_TAB ? null : activeTab
    if (tabParamValue !== expectedParam) {
      updateTabParam(activeTab)
    }
  }, [activeTab, tabParamValue, updateTabParam])

  const handleTabChange = (nextTab: string) => {
    if (!ALL_TABS.includes(nextTab as VendorTabValue)) {
      updateTabParam(DEFAULT_TAB)
      return
    }
    updateTabParam(nextTab as VendorTabValue)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
      <div className="mb-6">
        <ScrollableTabsList>
          <TabsList className="w-max gap-2">
            <TabsTrigger value="overview" className="px-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="risk-review">Risk Review</TabsTrigger>
          </TabsList>
        </ScrollableTabsList>
      </div>

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
    </Tabs>
  )
}

export default VendorDetailTabs
