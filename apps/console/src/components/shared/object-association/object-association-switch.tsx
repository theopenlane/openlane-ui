import React, { useMemo, useState } from 'react'
import { ChevronsDownUp, ChevronsUpDown, Expand, LayoutList, List, StretchVertical } from 'lucide-react'
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
import { cn } from '@repo/ui/lib/utils'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Checkbox } from '@repo/ui/checkbox'

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
  const [hiddenStates, setHiddenStates] = useState<{ [key: string]: boolean }>({})

  const sectionList = useMemo(() => {
    return Object.fromEntries(Object.entries(sections).map(([key, value]) => [key, { ...value, hidden: hiddenStates[key] ?? false }]))
  }, [sections, hiddenStates])

  const visibleSections = useMemo(() => {
    return Object.fromEntries(Object.entries(sectionList).filter(([, value]) => value && !value.hidden))
  }, [sectionList])

  const handleAssociationDialog = () => {
    if (!canEdit) {
      return
    }

    switch (centerNode.type) {
      case ObjectAssociationNodeEnum.CONTROL:
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

  const handleToggleSection = (sectionKey: string, hidden: boolean) => {
    setHiddenStates((prev) => ({ ...prev, [sectionKey]: hidden }))
  }

  return (
    <div className="rounded-lg border bg-card shadow-xs p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Associated Objects</h2>
          </div>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div onClick={() => setIsGraphView((prevState) => !prevState)} className="flex items-center h-8 border rounded-md cursor-pointer overflow-hidden">
                  <div className={cn('pb-1 pt-1 pl-2 pr-2 flex-1 flex items-center justify-center h-full', isGraphView && 'bg-secondary')}>
                    <Graph size={15} />
                  </div>
                  <div className="border-r h-full"></div>
                  <div className={cn('pb-1 pt-1 pl-2 pr-2 flex-1 flex items-center justify-center h-full', !isGraphView && 'bg-secondary')}>
                    <LayoutList size={15} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{isGraphView ? 'List View' : 'Graph View'}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {!isGraphView && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" className="h-8 px-2!" variant="secondary" onClick={() => setToggleAll((prevState) => !prevState)}>
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
        </div>
        {handleAssociationDialog()}
      </div>

      {!isGraphView ? (
        <AssociatedObjectsAccordion sections={sections} toggleAll={toggleAll} />
      ) : (
        <ObjectAssociationGraph
          controlId={controlId}
          closeFullScreen={() => setIsFullscreen(false)}
          centerNode={centerNode}
          sections={visibleSections}
          isFullscreen={isFullscreen}
          menu={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" className="h-8 px-2!" variant="secondary" onFocus={(e) => e.preventDefault()}>
                  <StretchVertical size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border shadow-md p-2 z-99999" align="start">
                {Object.keys(sectionList).map((sectionKey) => (
                  <div key={sectionKey} className="flex items-center gap-x-2 p-1">
                    <Checkbox className="h-4 w-4" stroke={2} checked={!sectionList[sectionKey]?.hidden} onCheckedChange={(checked) => handleToggleSection(sectionKey, !checked)} />
                    <span className="text-sm capitalize">{sectionKey}</span>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      )}
      <div className="flex items-center justify-end gap-2">
        {isGraphView && (
          <>
            <DropdownMenu>
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" className="h-8 px-2!" variant="secondary" onFocus={(e) => e.preventDefault()}>
                        <StretchVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Show/Hide Object Associations</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <DropdownMenuContent className="border shadow-md p-2" align="start">
                {Object.keys(sectionList).map((sectionKey) => (
                  <div key={sectionKey} className="flex items-center gap-x-2 p-1">
                    <Checkbox className="h-4 w-4" stroke={2} checked={!sectionList[sectionKey]?.hidden} onCheckedChange={(checked) => handleToggleSection(sectionKey, !checked)} />
                    <span className="text-sm capitalize">{sectionKey}</span>
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" className="h-8 px-2!" variant="secondary" onClick={() => setIsFullscreen((prevState) => !prevState)}>
                    <div className="flex">{<Expand size={16} />}</div>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen Graph View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}
      </div>
    </div>
  )
}

export default ObjectAssociationSwitch
