'use client'

import React, { useMemo, useState } from 'react'
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
import { useGetControlAssociationsById, type ControlByIdNode } from '@/lib/graphql-hooks/controls'
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

const ControlDetailsTabs: React.FC<TabsProps> = (props) => {
  const [activeTab, setActiveTab] = useState('implementation')
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

  const evidenceFormData = useMemo<TFormEvidenceData>(() => {
    if (isSubcontrol) {
      return buildSubcontrolEvidenceData(subcontrol ?? null, subcontrolAssociationsData)
    }

    return buildControlEvidenceData(control ?? null, controlAssociationsData)
  }, [isSubcontrol, subcontrol, control, subcontrolAssociationsData, controlAssociationsData])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
      <ScrollableTabsList>
        <ControlTabsList />
      </ScrollableTabsList>

      <TabsContent value="implementation" className="space-y-6">
        <ImplementationTab />
      </TabsContent>

      <TabsContent value="evidence" className="space-y-6">
        <EvidenceTab evidenceFormData={evidenceFormData} subcontrolIds={subcontrolIds} evidenceRequests={evidenceRequests as { documentationType?: string; description?: string }[] | null} />
      </TabsContent>

      <TabsContent value="linked-controls" className="space-y-6">
        <LinkedControlsTab controlId={isSubcontrol ? undefined : control?.id} subcontrolId={isSubcontrol ? subcontrol?.id : undefined} refCode={refCode} />
      </TabsContent>

      <TabsContent value="guidance" className="space-y-6">
        <GuidanceTab
          implementationGuidance={(isSubcontrol ? subcontrol?.implementationGuidance : control?.implementationGuidance) as { referenceId: string; guidance: string[] }[] | null}
          controlQuestions={(isSubcontrol ? subcontrol?.controlQuestions : control?.controlQuestions) as string[] | null}
          assessmentMethods={(isSubcontrol ? subcontrol?.assessmentMethods : control?.assessmentMethods) as { id: string; type: 'EXAMINE' | 'INTERVIEW' | 'TEST'; method: string }[] | null}
          assessmentObjectives={(isSubcontrol ? subcontrol?.assessmentObjectives : control?.assessmentObjectives) as { class: string; id: string; objective: string }[] | null}
          testingProcedures={testingProcedures}
          references={references}
          refCode={refCode}
          controlId={control?.id}
          subcontrolId={subcontrol?.id}
          isSubcontrol={isSubcontrol}
        />
      </TabsContent>

      <TabsContent value="documentation" className="space-y-6">
        <DocumentationTab controlId={isSubcontrol ? subcontrol?.control?.id ?? '' : control?.id ?? ''} subcontrolIds={subcontrolIds} />
      </TabsContent>

      <TabsContent value="activity" className="space-y-6">
        <ActivityTab controlId={isSubcontrol ? subcontrol?.control?.id ?? '' : control?.id ?? ''} subcontrolIds={subcontrolIds} />
      </TabsContent>
    </Tabs>
  )
}

export default ControlDetailsTabs
