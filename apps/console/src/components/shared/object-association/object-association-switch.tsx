import React, { useRef, useState } from 'react'
import { ArrowLeft, ChevronsDownUp, ChevronsUpDown, Expand, LayoutList, List, Waypoints } from 'lucide-react'
import ObjectAssociationGraph from '@/components/shared/object-association/object-association-graph.tsx'
import { SetObjectAssociationDialog } from '@/components/pages/protected/controls/set-object-association-modal.tsx'
import { Button } from '@repo/ui/button'
import { ObjectAssociationNodeEnum, Section, TCenterNode } from '@/components/shared/object-association/types/object-association-types.ts'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion.tsx'
import SetObjectAssociationPoliciesDialog from '@/components/pages/protected/policies/modal/set-object-association-modal.tsx'
import SetObjectAssociationProceduresDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'
import SetObjectAssociationRisksDialog from '@/components/pages/protected/risks/modal/set-object-association-modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { cn } from '@repo/ui/lib/utils'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'

type TObjectAssociationSwitchProps = {
  controlId?: string
  sections: Section
  centerNode: TCenterNode
  canEdit: boolean
}

const ObjectAssociationSwitch: React.FC<TObjectAssociationSwitchProps> = ({ sections, centerNode, canEdit, controlId }) => {
  const [isGraphView, setIsGraphView] = useState<boolean>(true)
  const [toggleAll, setToggleAll] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const clearGroupRef = useRef<(() => void) | null>(null)

  const handleAssociationDialog = () => {
    if (!canEdit) {
      return
    }

    switch (centerNode.type) {
      case ObjectAssociationNodeEnum.CONTROL:
      case ObjectAssociationNodeEnum.SUBCONTROL:
        return <SetObjectAssociationDialog trigger={<AddAssociationPlusBtn />} />
      case ObjectAssociationNodeEnum.POLICY:
        return <SetObjectAssociationPoliciesDialog policyId={centerNode?.node.id} />
      case ObjectAssociationNodeEnum.PROCEDURE:
        return <SetObjectAssociationProceduresDialog procedureId={centerNode?.node.id} />
      case ObjectAssociationNodeEnum.RISKS:
        return <SetObjectAssociationRisksDialog riskId={centerNode?.node.id} />
    }
  }

  return (
    <div className="rounded-lg border dark:bg-card light:bg-secondary shadow-xs p-4">
      <div className="flex items-center justify-between mb-4">
        {activeGroup ? (
          <button onClick={() => clearGroupRef.current?.()} className="flex items-center gap-1 text-sm text-foreground w-fit">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Associated Objects</h2>
            <div className="flex gap-2">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={() => setIsGraphView((prevState) => !prevState)} className="flex items-center p-1 bg-background border rounded-lg cursor-pointer overflow-hidden">
                      <Button variant={!isGraphView ? 'transparent' : 'secondary'} size="sm" className="mr-1 h-6" style={{ boxShadow: 'none', outline: 'none', border: 'none' }}>
                        <Waypoints size={14} />
                      </Button>
                      <Button variant={isGraphView ? 'transparent' : 'secondary'} size="sm" className="h-6" style={{ boxShadow: 'none', outline: 'none', border: 'none' }}>
                        <LayoutList size={14} />
                      </Button>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{isGraphView ? 'List View' : 'Graph View'}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {!isGraphView && (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button type="button" className="self-center" variant="secondary" onClick={() => setToggleAll((prevState) => !prevState)}>
                        <List size={16} />
                        {!toggleAll ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent> {toggleAll ? 'Collapse associated objects' : 'Expand associated objects'}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </>
        )}
      </div>

      {!isGraphView ? (
        <AssociatedObjectsAccordion sections={sections} toggleAll={toggleAll} />
      ) : (
        <ObjectAssociationGraph
          controlId={controlId}
          closeFullScreen={() => setIsFullscreen(false)}
          centerNode={centerNode}
          sections={sections}
          isFullscreen={isFullscreen}
          onGroupSelect={setActiveGroup}
          clearGroupRef={clearGroupRef}
        />
      )}
      {isGraphView && !activeGroup && (
        <div className="flex items-center justify-between">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" className="h-8 px-2!" variant="secondary" onClick={() => setIsFullscreen((prevState) => !prevState)}>
                  <div className="flex">
                    <Expand size={16} />
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen Graph View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {handleAssociationDialog()}
        </div>
      )}
    </div>
  )
}

export default ObjectAssociationSwitch
