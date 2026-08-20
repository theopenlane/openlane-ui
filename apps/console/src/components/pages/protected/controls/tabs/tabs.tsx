'use client'

import React, { useCallback, useEffect, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Tabs, TabsContent } from '@repo/ui/tabs'
import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import ImplementationTab, { useHasImplementationData } from '@/components/pages/protected/controls/tabs/implementation/implementation-tab'
import EvidenceTab from '@/components/pages/protected/controls/tabs/evidence/evidence-tab'
import LinkedControlsTab from '@/components/pages/protected/controls/tabs/linked-controls/linked-controls-tab'
import GuidanceTab from '@/components/pages/protected/controls/tabs/guidance/guidance-tab'
import DocumentationTab from '@/components/pages/protected/controls/tabs/documentation/documentation-tab'
import ActivityTab from '@/components/pages/protected/controls/tabs/activity/activity-tab'
import AssetsScansTab from '@/components/pages/protected/controls/tabs/assets-scans/assets-scans-tab'
import FindingsRisksTab from '@/components/pages/protected/controls/tabs/findings-risks/findings-risks-tab'
import ReviewsTab from '@/components/pages/protected/controls/tabs/reviews/reviews-tab'
import ScrollableTabsList from '@/components/pages/protected/controls/tabs/scrollable-tabs-list'
import ControlTabsList from '@/components/pages/protected/controls/tabs/control-tabs-list'
import { useGetControlAssociationsById, type ControlByIdNode } from '@/lib/graphql-hooks/control'
import { type SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import { useMappedEntityRefs } from '@/lib/graphql-hooks/use-mapped-entity-refs'
import { buildControlEvidenceData, buildSubcontrolEvidenceData } from '@/components/pages/protected/controls/evidence-data'
import { type UpdateSubcontrolInput, type UpdateControlInput } from '@repo/codegen/src/schema.ts'
import { useSuggestedPolicies } from '@/components/pages/protected/controls/suggested-policies'

type ControlTabsProps = {
  kind: 'control'
  control: ControlByIdNode
  isEditing: boolean
  data?: ControlByIdNode
  handleUpdate?: (val: UpdateControlInput) => void
  canEdit: boolean
}

type SubcontrolTabsProps = {
  kind: 'subcontrol'
  subcontrol: SubcontrolByIdNode
  isEditing: boolean
  data?: SubcontrolByIdNode
  handleUpdate?: (val: UpdateSubcontrolInput) => void
  canEdit: boolean
}

type TabsProps = ControlTabsProps | SubcontrolTabsProps
type ControlTabValue = 'implementation' | 'evidence' | 'linked-controls' | 'guidance' | 'documentation' | 'assets-scans' | 'findings-risks' | 'reviews' | 'activity'

const DEFAULT_TAB: ControlTabValue = 'implementation'
const TAB_QUERY_PARAM = 'tab'
const ALL_TABS: ControlTabValue[] = ['implementation', 'linked-controls', 'evidence', 'guidance', 'documentation', 'assets-scans', 'findings-risks', 'reviews', 'activity']

const ControlDetailsTabs: React.FC<TabsProps> = (props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isSubcontrol = props.kind === 'subcontrol'
  const control = props.kind === 'control' ? props.control : undefined
  const subcontrol = props.kind === 'subcontrol' ? props.subcontrol : undefined
  const { data: controlAssociationsData } = useGetControlAssociationsById(isSubcontrol ? undefined : control?.id)

  const subcontrolIds = useMemo(() => {
    if (isSubcontrol && subcontrol) return [subcontrol.id]
    return (control?.subcontrols?.edges ?? []).map((edge) => edge?.node?.id).filter((id): id is string => Boolean(id))
  }, [isSubcontrol, control?.subcontrols?.edges, subcontrol])

  const { mappedControlRefs, mappedSubcontrolRefs } = useMappedEntityRefs(isSubcontrol ? undefined : control?.id, subcontrolIds)

  const evidenceRequests = isSubcontrol ? (subcontrol as { evidenceRequests?: unknown } | undefined)?.evidenceRequests : (control as { evidenceRequests?: unknown } | undefined)?.evidenceRequests
  const refCode = (isSubcontrol ? subcontrol?.refCode : control?.refCode) ?? ''

  const docsControl = !isSubcontrol && control ? { controlId: control.id, refCode: control.refCode, referenceFramework: control.referenceFramework, source: control.source } : undefined

  const { data: suggestedPolicies } = useSuggestedPolicies(docsControl)
  const documentationAlertCount = suggestedPolicies && !suggestedPolicies.dismissed ? suggestedPolicies.suggestions.length : 0

  const testingProcedures = useMemo(() => {
    const raw = (isSubcontrol ? subcontrol?.testingProcedures : control?.testingProcedures) as
      { referenceId: string; procedures: string[] } | { referenceId: string; procedures: string[] }[] | null | undefined
    if (!raw) return null
    if (Array.isArray(raw)) return raw
    return [raw]
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

  // tabs that only list associated records are hidden when there are none.
  // Subcontrol associations carry a subset of the collections, hence the shape
  const associations = controlAssociationsData?.control as Record<string, { totalCount?: number | null } | undefined> | undefined
  const associationCount = (...names: string[]) => names.reduce((total, name) => total + (associations?.[name]?.totalCount ?? 0), 0)

  const hasAssetsScans = associationCount('assets', 'scans') > 0
  const hasFindingsRisks = associationCount('findings', 'risks', 'vulnerabilities') > 0
  const hasReviews = associationCount('reviews') > 0

  const { hasData: hasImplementationData, isLoading: isImplementationDataLoading } = useHasImplementationData({ publicRepresentation: props.data?.publicRepresentation })

  const hiddenTabs = useMemo(() => {
    const hidden = new Set<ControlTabValue>()
    if (!hasGuidanceData) hidden.add('guidance')
    if (!hasAssetsScans) hidden.add('assets-scans')
    if (!hasFindingsRisks) hidden.add('findings-risks')
    if (!hasReviews) hidden.add('reviews')
    // hiding it while the queries are still in flight would flash the tab away and move the default tab
    if (!hasImplementationData && !isImplementationDataLoading) hidden.add('implementation')
    return hidden
  }, [hasGuidanceData, hasAssetsScans, hasFindingsRisks, hasReviews, hasImplementationData, isImplementationDataLoading])

  const availableTabs = useMemo<ControlTabValue[]>(() => ALL_TABS.filter((tab) => !hiddenTabs.has(tab)), [hiddenTabs])

  const tabParamValue = searchParams.get(TAB_QUERY_PARAM)
  // the default tab may be hidden for this control, so fall back to the first shown
  const fallbackTab = availableTabs.includes(DEFAULT_TAB) ? DEFAULT_TAB : (availableTabs[0] ?? DEFAULT_TAB)
  const requestedTab = tabParamValue && availableTabs.includes(tabParamValue as ControlTabValue) ? (tabParamValue as ControlTabValue) : fallbackTab
  const activeTab = requestedTab

  const updateTabParam = useCallback(
    (tab: ControlTabValue) => {
      const nextParams = new URLSearchParams(searchParams.toString())

      if (tab === fallbackTab) {
        nextParams.delete(TAB_QUERY_PARAM)
      } else {
        nextParams.set(TAB_QUERY_PARAM, tab)
      }

      const query = nextParams.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams, fallbackTab],
  )

  useEffect(() => {
    const expectedParam = activeTab === fallbackTab ? null : activeTab
    if (tabParamValue !== expectedParam) {
      updateTabParam(activeTab)
    }
  }, [activeTab, tabParamValue, updateTabParam, fallbackTab])

  const evidenceFormData = useMemo<TFormEvidenceData>(() => {
    if (isSubcontrol) {
      return buildSubcontrolEvidenceData(subcontrol ?? null)
    }

    return buildControlEvidenceData(control ?? null, controlAssociationsData)
  }, [isSubcontrol, subcontrol, control, controlAssociationsData])

  const handleTabChange = (nextTab: string) => {
    if (!availableTabs.includes(nextTab as ControlTabValue)) {
      updateTabParam(fallbackTab)
      return
    }

    updateTabParam(nextTab as ControlTabValue)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} variant="underline">
      <div className="mb-6">
        <ScrollableTabsList>
          <ControlTabsList visibleTabs={availableTabs} badges={{ documentation: documentationAlertCount }} />
        </ScrollableTabsList>
      </div>

      {hasImplementationData && (
        <TabsContent value="implementation" className="space-y-6">
          <ImplementationTab isEditing={props.isEditing} data={props.data} canEdit={props.canEdit} />
        </TabsContent>
      )}

      <TabsContent value="evidence" className="space-y-6">
        <EvidenceTab
          docsControl={docsControl}
          evidenceFormData={evidenceFormData}
          subcontrolIds={subcontrolIds}
          evidenceRequests={evidenceRequests as { documentationType?: string; description?: string }[] | null}
          mappedControlRefs={mappedControlRefs}
          mappedSubcontrolRefs={mappedSubcontrolRefs}
        />
      </TabsContent>

      <TabsContent value="linked-controls" className="space-y-6">
        <LinkedControlsTab
          controlId={isSubcontrol ? undefined : control?.id}
          subcontrolId={isSubcontrol ? subcontrol?.id : undefined}
          parentControlId={isSubcontrol ? (subcontrol?.control?.id ?? undefined) : undefined}
          refCode={refCode}
          canEdit={props.canEdit}
          frameworkControl={
            !isSubcontrol && control && control.referenceFramework && control.referenceFramework !== 'CUSTOM'
              ? { id: control.id, refCode: control.refCode, referenceFramework: control.referenceFramework }
              : undefined
          }
        />
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
        <DocumentationTab
          suggestedPolicies={suggestedPolicies}
          controlId={isSubcontrol ? (subcontrol?.control?.id ?? '') : (control?.id ?? '')}
          subcontrolIds={subcontrolIds}
          canEdit={props.canEdit}
          isSubcontrol={isSubcontrol}
          mappedControlRefs={mappedControlRefs}
          mappedSubcontrolRefs={mappedSubcontrolRefs}
        />
      </TabsContent>

      {hasAssetsScans && (
        <TabsContent value="assets-scans" className="space-y-6">
          <AssetsScansTab controlId={isSubcontrol ? (subcontrol?.control?.id ?? '') : (control?.id ?? '')} subcontrolIds={subcontrolIds} />
        </TabsContent>
      )}

      {hasFindingsRisks && (
        <TabsContent value="findings-risks" className="space-y-6">
          <FindingsRisksTab controlId={isSubcontrol ? (subcontrol?.control?.id ?? '') : (control?.id ?? '')} subcontrolIds={subcontrolIds} />
        </TabsContent>
      )}

      {hasReviews && (
        <TabsContent value="reviews" className="space-y-6">
          <ReviewsTab controlId={isSubcontrol ? (subcontrol?.control?.id ?? '') : (control?.id ?? '')} subcontrolIds={subcontrolIds} />
        </TabsContent>
      )}

      <TabsContent value="activity" className="space-y-6">
        <ActivityTab controlId={isSubcontrol ? undefined : control?.id} subcontrolIds={subcontrolIds} />
      </TabsContent>
    </Tabs>
  )
}

export default ControlDetailsTabs
