'use client'

import React, { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import ScrollableTabsList from '@/components/pages/protected/controls/tabs/scrollable-tabs-list'
import OverviewTab from './overview/overview-tab'
import DocumentsTab from './documents/documents-tab'
import AssessmentsTab from './assessments/assessments-tab'
import HistoryTab from './history/history-tab'
import LinkedAccountsTab from './linked-accounts/linked-accounts-tab'
import type { IdentityHolderQuery, UpdateIdentityHolderInput } from '@repo/codegen/src/schema'

type PersonnelTabValue = 'overview' | 'documents' | 'linked-accounts' | 'assessments' | 'history'

const DEFAULT_TAB: PersonnelTabValue = 'overview'
const TAB_QUERY_PARAM = 'tab'
const ALL_TABS: PersonnelTabValue[] = ['overview', 'documents', 'linked-accounts', 'assessments', 'history']

interface PersonnelDetailTabsProps {
  personnel: IdentityHolderQuery['identityHolder']
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateIdentityHolderInput) => Promise<void>
}

const PersonnelDetailTabs: React.FC<PersonnelDetailTabsProps> = ({ personnel, isEditing, canEdit: canEditPersonnel, handleUpdateField }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const activeTab = tabParamValue && ALL_TABS.includes(tabParamValue as PersonnelTabValue) ? (tabParamValue as PersonnelTabValue) : DEFAULT_TAB

  const updateTabParam = useCallback(
    (tab: PersonnelTabValue) => {
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
    if (!ALL_TABS.includes(nextTab as PersonnelTabValue)) {
      updateTabParam(DEFAULT_TAB)
      return
    }
    updateTabParam(nextTab as PersonnelTabValue)
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
            <TabsTrigger value="linked-accounts">Linked Accounts</TabsTrigger>
            <TabsTrigger value="assessments">Assessments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </ScrollableTabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab personnel={personnel} isEditing={isEditing} canEdit={canEditPersonnel} handleUpdateField={handleUpdateField} />
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <DocumentsTab personnelId={personnel.id} canEdit={canEditPersonnel} />
      </TabsContent>

      <TabsContent value="linked-accounts" className="space-y-6">
        <LinkedAccountsTab personnelId={personnel.id} />
      </TabsContent>

      <TabsContent value="assessments" className="space-y-6">
        <AssessmentsTab personnelId={personnel.id} />
      </TabsContent>

      <TabsContent value="history" className="space-y-6">
        <HistoryTab personnel={personnel} />
      </TabsContent>
    </Tabs>
  )
}

export default PersonnelDetailTabs
