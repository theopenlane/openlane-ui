'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent } from '@repo/ui/tabs'
import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import ImplementationTab from '@/components/pages/protected/controls/tabs/implementation/implementation-tab'
import EvidenceTab from '@/components/pages/protected/controls/tabs/evidence/evidence-tab'
import LinkedControlsTab from '@/components/pages/protected/controls/tabs/linked-controls/linked-controls-tab'
import GuidanceTab from '@/components/pages/protected/controls/tabs/guidance/guidance-tab'
import DocumentationTab from '@/components/pages/protected/controls/tabs/documentation/documentation-tab'
import ActivityTab from '@/components/pages/protected/controls/tabs/activity/activity-tab'
import ScrollableTabsList from '@/components/pages/protected/controls/tabs/scrollable-tabs-list'
import ControlTabsList from '@/components/pages/protected/controls/tabs/control-tabs-list'
import { useGetControlAssociationsById, type ControlByIdNode } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolAssociationsById, type SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import { buildControlEvidenceData, buildSubcontrolEvidenceData } from '@/components/pages/protected/controls/evidence-data'

type ControlTabsProps = {
  kind: 'control'
  control: ControlByIdNode
}

type SubcontrolTabsProps = {
  kind: 'subcontrol'
  subcontrol: SubcontrolByIdNode
}

type TabsProps = ControlTabsProps | SubcontrolTabsProps
type ControlTabValue = 'implementation' | 'evidence' | 'linked-controls' | 'guidance' | 'documentation' | 'activity'

const DEFAULT_TAB: ControlTabValue = 'implementation'
const TAB_QUERY_PARAM = 'tab'
const ALL_TABS: ControlTabValue[] = ['implementation', 'evidence', 'linked-controls', 'guidance', 'documentation', 'activity']

const ControlDetailsTabs: React.FC<TabsProps> = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSubcontrol = props.kind === 'subcontrol'
  const control = props.kind === 'control' ? props.control : undefined
  const subcontrol = props.kind === 'subcontrol' ? props.subcontrol : undefined
  const { data: controlAssociationsData } = useGetControlAssociationsById(isSubcontrol ? undefined : control?.id)
  const { data: subcontrolAssociationsData } = useGetSubcontrolAssociationsById(isSubcontrol ? subcontrol?.id : undefined)

  const subcontrolIds = useMemo(() => {
    if (isSubcontrol && subcontrol) return [subcontrol.id]
    return (control?.subcontrols?.edges ?? []).map((edge) => edge?.node?.id).filter((id): id is string => Boolean(id))
  }, [isSubcontrol, control?.subcontrols?.edges, subcontrol])

  const evidenceRequests = isSubcontrol ? (subcontrol as { evidenceRequests?: unknown } | undefined)?.evidenceRequests : (control as { evidenceRequests?: unknown } | undefined)?.evidenceRequests
  const refCode = (isSubcontrol ? subcontrol?.refCode : control?.refCode) ?? ''

  const testingProcedures = useMemo(() => {
    const raw = (isSubcontrol ? subcontrol?.testingProcedures : control?.testingProcedures) as
      | { referenceId: string; procedures: string[] }
      | { referenceId: string; procedures: string[] }[]
      | null
      | undefined
    if (!raw) return null
    if (Array.isArray(raw)) return raw.flatMap((p) => p?.procedures ?? [])
    return raw.procedures ?? []
  }, [isSubcontrol, subcontrol?.testingProcedures, control?.testingProcedures])

  const references = (isSubcontrol ? subcontrol?.references : control?.references) as { name: string; url?: string }[] | null | undefined
  const implementationGuidance = (isSubcontrol ? subcontrol?.implementationGuidance : control?.implementationGuidance) as { referenceId: string; guidance: string[] }[] | null
  const controlQuestions = (isSubcontrol ? subcontrol?.controlQuestions : control?.controlQuestions) as string[] | null
  const assessmentMethods = (isSubcontrol ? subcontrol?.assessmentMethods : control?.assessmentMethods) as { id: string; type: 'EXAMINE' | 'INTERVIEW' | 'TEST'; method: string }[] | null
  const assessmentObjectives = (isSubcontrol ? subcontrol?.assessmentObjectives : control?.assessmentObjectives) as { class: string; id: string; objective: string }[] | null

  const hasGuidanceData = useMemo(
    () =>
      Boolean(
        implementationGuidance?.length ||
          controlQuestions?.some((question) => question.trim().length > 0) ||
          assessmentMethods?.length ||
          assessmentObjectives?.length ||
          testingProcedures?.length ||
          references?.some((reference) => reference.name.trim().length > 0),
      ),
    [implementationGuidance, controlQuestions, assessmentMethods, assessmentObjectives, testingProcedures, references],
  )

  const availableTabs = useMemo<ControlTabValue[]>(() => (hasGuidanceData ? ALL_TABS : ALL_TABS.filter((tab) => tab !== 'guidance')), [hasGuidanceData])

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  const requestedTab = tabParamValue && availableTabs.includes(tabParamValue as ControlTabValue) ? (tabParamValue as ControlTabValue) : DEFAULT_TAB
  const activeTab = requestedTab

  const updateTabParam = useCallback(
    (tab: ControlTabValue) => {
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

  const evidenceFormData = useMemo<TFormEvidenceData>(() => {
    if (isSubcontrol) {
      return buildSubcontrolEvidenceData(subcontrol ?? null, subcontrolAssociationsData)
    }

    return buildControlEvidenceData(control ?? null, controlAssociationsData)
  }, [isSubcontrol, subcontrol, control, subcontrolAssociationsData, controlAssociationsData])

  const handleTabChange = (nextTab: string) => {
    if (!availableTabs.includes(nextTab as ControlTabValue)) {
      updateTabParam(DEFAULT_TAB)
      return
    }

    updateTabParam(nextTab as ControlTabValue)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
      <div className="mb-6">
        <ScrollableTabsList>
          <ControlTabsList includeGuidance={hasGuidanceData} />
        </ScrollableTabsList>
      </div>

      <TabsContent value="implementation" className="space-y-6">
        <ImplementationTab />
      </TabsContent>

      <TabsContent value="evidence" className="space-y-6">
        <EvidenceTab evidenceFormData={evidenceFormData} subcontrolIds={subcontrolIds} evidenceRequests={evidenceRequests as { documentationType?: string; description?: string }[] | null} />
      </TabsContent>

      <TabsContent value="linked-controls" className="space-y-6">
        <LinkedControlsTab controlId={isSubcontrol ? undefined : control?.id} subcontrolId={isSubcontrol ? subcontrol?.id : undefined} refCode={refCode} />
      </TabsContent>

      {hasGuidanceData && (
        <TabsContent value="guidance" className="space-y-6">
          <GuidanceTab
            implementationGuidance={implementationGuidance}
            controlQuestions={controlQuestions}
            assessmentMethods={assessmentMethods}
            assessmentObjectives={assessmentObjectives}
            testingProcedures={testingProcedures}
            references={references}
            refCode={refCode}
            controlId={control?.id}
            subcontrolId={subcontrol?.id}
            isSubcontrol={isSubcontrol}
          />
        </TabsContent>
      )}

      <TabsContent value="documentation" className="space-y-6">
        <DocumentationTab controlId={isSubcontrol ? subcontrol?.control?.id ?? '' : control?.id ?? ''} subcontrolIds={subcontrolIds} />
      </TabsContent>

      <TabsContent value="activity" className="space-y-6">
        <ActivityTab controlId={isSubcontrol ? undefined : control?.id} subcontrolIds={subcontrolIds} />
      </TabsContent>
    </Tabs>
  )
}

export default ControlDetailsTabs
