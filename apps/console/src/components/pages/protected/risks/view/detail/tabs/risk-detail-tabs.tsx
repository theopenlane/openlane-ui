'use client'

import React, { useCallback, useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import ScrollableTabsList from '@/components/pages/protected/controls/tabs/scrollable-tabs-list'
import OverviewTab from './overview/overview-tab'
import RiskReviewTab from './risk-review/risk-review-tab'
import type { GetRiskByIdQuery, GetRiskAssociationsQuery, UpdateRiskInput } from '@repo/codegen/src/schema'
import MitigationTab from './mitigation/mitigation-tab'
import ActivityTab from './activity/activity-tab'

type RiskTabValue = 'overview' | 'mitigation' | 'risk-review' | 'activity'

const DEFAULT_TAB: RiskTabValue = 'overview'
const TAB_QUERY_PARAM = 'tab'
const ALL_TABS: RiskTabValue[] = ['overview', 'mitigation', 'risk-review', 'activity']

interface RiskDetailTabsProps {
  risk: GetRiskByIdQuery['risk']
  associations?: GetRiskAssociationsQuery
  isEditing: boolean
  canEdit: boolean
  handleUpdateField: (input: UpdateRiskInput) => Promise<void>
}

const RiskDetailTabs: React.FC<RiskDetailTabsProps> = ({ risk, associations, isEditing, canEdit: canEditRisk, handleUpdateField }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const requestedTab = tabParamValue && ALL_TABS.includes(tabParamValue as RiskTabValue) ? (tabParamValue as RiskTabValue) : DEFAULT_TAB
  const activeTab = requestedTab

  const updateTabParam = useCallback(
    (tab: RiskTabValue) => {
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
    if (!ALL_TABS.includes(nextTab as RiskTabValue)) {
      updateTabParam(DEFAULT_TAB)
      return
    }
    updateTabParam(nextTab as RiskTabValue)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
      <div className="mb-6">
        <ScrollableTabsList>
          <TabsList className="w-max gap-2">
            <TabsTrigger value="overview" className="px-0">
              Overview
            </TabsTrigger>
            <TabsTrigger value="mitigation">Mitigation</TabsTrigger>
            <TabsTrigger value="risk-review">Risk Review</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </ScrollableTabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        <OverviewTab risk={risk} isEditing={isEditing} canEdit={canEditRisk} />
      </TabsContent>

      <TabsContent value="mitigation" className="space-y-6">
        <MitigationTab risk={risk} editAllowed={canEditRisk} associations={associations} isEditing={isEditing} />
      </TabsContent>

      <TabsContent value="risk-review" className="space-y-6">
        <RiskReviewTab risk={risk} handleUpdateField={handleUpdateField} canEdit={canEditRisk} isEditing={isEditing} />
      </TabsContent>

      <TabsContent value="activity" className="space-y-6">
        <ActivityTab riskId={risk?.id} />
      </TabsContent>
    </Tabs>
  )
}

export default RiskDetailTabs
