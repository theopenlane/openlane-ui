'use client'

import React, { useMemo, useState } from 'react'
import { Tabs, TabsContent } from '@repo/ui/tabs'
import type { Control, Subcontrol } from '@repo/codegen/src/schema'
import type { TFormEvidenceData } from '@/components/pages/protected/evidence/types/TFormEvidenceData.ts'
import ImplementationTab from '@/components/pages/protected/controls/tabs/implementation-tab'
import ObjectivesTab from '@/components/pages/protected/controls/tabs/objectives-tab'
import EvidenceTab from '@/components/pages/protected/controls/tabs/evidence-tab'
import LinkedControlsTab from '@/components/pages/protected/controls/tabs/linked-controls-tab'
import GuidanceTab from '@/components/pages/protected/controls/tabs/guidance-tab'
import DocumentationTab from '@/components/pages/protected/controls/tabs/documentation-tab'
import ScrollableTabsList from '@/components/pages/protected/controls/tabs/scrollable-tabs-list'
import ControlTabsList from '@/components/pages/protected/controls/tabs/control-tabs-list'
import { useGetControlAssociationsById } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolAssociationsById } from '@/lib/graphql-hooks/subcontrol'
import { buildControlEvidenceData, buildSubcontrolEvidenceData } from '@/components/pages/protected/controls/evidence-data'

type ControlTabsProps = {
  kind: 'control'
  control: Control
}

type SubcontrolTabsProps = {
  kind: 'subcontrol'
  subcontrol: Subcontrol
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

  const exampleEvidence = isSubcontrol ? subcontrol?.exampleEvidence : control?.exampleEvidence
  const refCode = (isSubcontrol ? subcontrol?.refCode : control?.refCode) ?? ''
  const referenceFramework = isSubcontrol ? subcontrol?.referenceFramework : control?.referenceFramework

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

      <TabsContent value="objectives" className="space-y-6">
        <ObjectivesTab />
      </TabsContent>

      <TabsContent value="evidence" className="space-y-6">
        <EvidenceTab evidenceFormData={evidenceFormData} subcontrolIds={subcontrolIds} exampleEvidence={exampleEvidence as string | { documentationType: string; description: string }[] | null} />
      </TabsContent>

      <TabsContent value="linked-controls" className="space-y-6">
        <LinkedControlsTab
          controlId={isSubcontrol ? undefined : control?.id}
          subcontrols={isSubcontrol ? undefined : control?.subcontrols?.edges || []}
          subcontrolId={isSubcontrol ? subcontrol?.id : undefined}
          refCode={refCode}
          referenceFramework={referenceFramework}
        />
      </TabsContent>

      <TabsContent value="guidance" className="space-y-6">
        <GuidanceTab
          implementationGuidance={(isSubcontrol ? subcontrol?.implementationGuidance : control?.implementationGuidance) as { referenceId: string; guidance: string[] }[] | null}
          controlQuestions={(isSubcontrol ? subcontrol?.controlQuestions : control?.controlQuestions) as string[] | null}
          assessmentMethods={(isSubcontrol ? subcontrol?.assessmentMethods : control?.assessmentMethods) as { id: string; method: string }[] | string[] | null}
          assessmentObjectives={(isSubcontrol ? subcontrol?.assessmentObjectives : control?.assessmentObjectives) as { id: string; objective: string }[] | string[] | null}
        />
      </TabsContent>

      <TabsContent value="documentation" className="space-y-6">
        <DocumentationTab controlId={isSubcontrol ? subcontrol?.control?.id ?? '' : control?.id ?? ''} subcontrolIds={subcontrolIds} />
      </TabsContent>
    </Tabs>
  )
}

export default ControlDetailsTabs
