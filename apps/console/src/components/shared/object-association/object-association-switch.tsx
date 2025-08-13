import React, { useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Expand, LayoutList, List } from 'lucide-react'
import ObjectAssociationGraph from '@/components/shared/object-association/object-association-graph.tsx'
import { SetObjectAssociationDialog } from '@/components/pages/protected/controls/set-object-association-modal.tsx'
import { Button } from '@repo/ui/button'
import { ObjectAssociationNodeEnum, Section, TCenterNode } from '@/components/shared/object-association/types/object-association-types.ts'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion.tsx'
import SetObjectAssociationPoliciesDialog from '@/components/pages/protected/policies/modal/set-object-association-modal.tsx'
import SetObjectAssociationProceduresDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'
import SetObjectAssociationRisksDialog from '@/components/pages/protected/risks/modal/set-object-association-modal'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import Graph from '@/assets/Graph.tsx'

type TObjectAssociationSwitchProps = {
  sections: Section
  centerNode: TCenterNode
  canEdit: boolean
}

const ObjectAssociationSwitch: React.FC<TObjectAssociationSwitchProps> = ({ sections, centerNode, canEdit }) => {
  const [isGraphView, setIsGraphView] = useState<boolean>(true)
  const [toggleAll, setToggleAll] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const handleAssociationDialog = () => {
    if (!canEdit) {
      return
    }

    switch (centerNode.type) {
      case ObjectAssociationNodeEnum.CONTROL:
        return <SetObjectAssociationDialog />
      case ObjectAssociationNodeEnum.SUBCONTROL:
        return <SetObjectAssociationDialog />
      case ObjectAssociationNodeEnum.POLICY:
        return <SetObjectAssociationPoliciesDialog policyId={centerNode?.node.id} />
      case ObjectAssociationNodeEnum.PROCEDURE:
        return <SetObjectAssociationProceduresDialog procedureId={centerNode?.node.id} />
      case ObjectAssociationNodeEnum.RISKS:
        return <SetObjectAssociationRisksDialog riskId={centerNode?.node.id} />
    }
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-xs p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Associated Objects</h2>
          </div>
          {!isGraphView ? (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" className="h-8 !px-2" variant="outline" onClick={() => setIsGraphView(true)}>
                    <div className="flex items-center h-full">
                      <Graph size={20} className="cursor-pointer hover:opacity-80" />
                      <div className="border-r h-full"></div>
                      <LayoutList size={15} className="ml-1" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Graph View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" className="h-8 !px-2" variant="outline" onClick={() => setIsGraphView(false)}>
                    <div className="flex items-center h-full">
                      <Graph size={20} className="cursor-pointer hover:opacity-80" />
                      <div className="border-r h-full"></div>
                      <LayoutList size={15} className="ml-1" />
                    </div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>List View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {!isGraphView && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" className="h-8 !px-2" variant="outline" onClick={() => setToggleAll((prevState) => !prevState)}>
                  <div className="flex">
                    <List size={16} />
                    {!toggleAll ? <ChevronsDownUp size={16} /> : <ChevronsUpDown size={16} />}
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent> {toggleAll ? 'Collapse associated objects' : 'Expand associated objects'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {handleAssociationDialog()}
      </div>

      {!isGraphView ? (
        <AssociatedObjectsAccordion sections={sections} toggleAll={toggleAll} />
      ) : (
        <ObjectAssociationGraph closeFullScreen={() => setIsFullscreen(false)} centerNode={centerNode} sections={sections} isFullscreen={isFullscreen} />
      )}
      <div className="flex items-center justify-end">
        {isGraphView && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" className="h-8 !px-2" variant="outline" onClick={() => setIsFullscreen((prevState) => !prevState)}>
                  <div className="flex">{<Expand size={16} />}</div>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fullscreen Graph View</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  )
}

export default ObjectAssociationSwitch
