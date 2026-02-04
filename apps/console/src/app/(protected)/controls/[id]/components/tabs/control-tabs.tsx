'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs'
import type { Control } from '@repo/codegen/src/schema'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import ImplementationTab from './implementation-tab'
import ObjectivesTab from './objectives-tab'
import EvidenceTab from './evidence-tab'
import LinkedControlsTab from './linked-controls-tab'
import GuidanceTab from './guidance-tab'
import DocumentationTab from './documentation-tab'

type EvidenceFormData = {
  displayID?: string
  controlID: string
  controlRefCodes: string[]
  referenceFramework: Record<string, string>
  programDisplayIDs: string[]
  objectAssociations: {
    controlIDs: string[]
    programIDs: string[]
    controlObjectiveIDs: string[]
  }
  objectAssociationsDisplayIDs: string[]
}

type ControlTabsProps = {
  control: Control
  evidenceFormData: EvidenceFormData
}

const ControlTabs: React.FC<ControlTabsProps> = ({ control, evidenceFormData }) => {
  const [activeTab, setActiveTab] = useState('implementation')
  const tabsScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const subcontrolIds = useMemo(() => (control.subcontrols?.edges ?? []).map((edge) => edge?.node?.id).filter((id): id is string => !!id), [control.subcontrols?.edges])

  useEffect(() => {
    const container = tabsScrollRef.current
    if (!container) return

    const updateScrollState = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }

    updateScrollState()

    const onScroll = () => updateScrollState()
    container.addEventListener('scroll', onScroll)

    const resizeObserver = new ResizeObserver(() => updateScrollState())
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', onScroll)
      resizeObserver.disconnect()
    }
  }, [])

  const scrollTabs = (direction: 'left' | 'right') => {
    const container = tabsScrollRef.current
    if (!container) return
    const delta = Math.round(container.clientWidth * 0.7)
    const offset = direction === 'left' ? -delta : delta
    container.scrollBy({ left: offset, behavior: 'smooth' })
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} variant="underline">
      <div className="relative">
        {canScrollLeft && (
          <Button type="button" variant="secondary" onClick={() => scrollTabs('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0" aria-label="Scroll tabs left">
            <ArrowLeft size={16} />
          </Button>
        )}
        <div ref={tabsScrollRef} className=" relative overflow-x-auto overflow-y-hidden no-scrollbar pr-10 pb-1 mb-1">
          <TabsList className="w-max gap-2">
            <TabsTrigger className="px-0" value="implementation">
              Implementations
            </TabsTrigger>
            <TabsTrigger value="objectives">Objectives</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
            <TabsTrigger value="linked-controls">Linked Controls</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0.5 left-0.5 h-px shadow-[inset_0_-1px_0_0_var(--color-border)]" />
        {canScrollRight && (
          <Button type="button" variant="secondary" onClick={() => scrollTabs('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 p-0" aria-label="Scroll tabs right">
            <ArrowRight size={16} />
          </Button>
        )}
      </div>

      <TabsContent value="implementation" className="space-y-6">
        <ImplementationTab />
      </TabsContent>

      <TabsContent value="objectives" className="space-y-6">
        <ObjectivesTab />
      </TabsContent>

      <TabsContent value="evidence" className="space-y-6">
        <EvidenceTab
          evidenceFormData={evidenceFormData}
          subcontrolIds={subcontrolIds}
          exampleEvidence={control.exampleEvidence as string | { documentationType: string; description: string }[] | null}
        />
      </TabsContent>

      <TabsContent value="linked-controls" className="space-y-6">
        <LinkedControlsTab controlId={control.id} subcontrols={control.subcontrols?.edges || []} refCode={control.refCode} referenceFramework={control.referenceFramework} />
      </TabsContent>

      <TabsContent value="guidance" className="space-y-6">
        <GuidanceTab
          implementationGuidance={control.implementationGuidance as { referenceId: string; guidance: string[] }[] | null}
          controlQuestions={control.controlQuestions as string[] | null}
          assessmentMethods={control.assessmentMethods as { id: string; method: string }[] | string[] | null}
          assessmentObjectives={control.assessmentObjectives as { id: string; objective: string }[] | string[] | null}
        />
      </TabsContent>

      <TabsContent value="documentation" className="space-y-6">
        <DocumentationTab controlId={control.id} subcontrolIds={subcontrolIds} />
      </TabsContent>
    </Tabs>
  )
}

export default ControlTabs
