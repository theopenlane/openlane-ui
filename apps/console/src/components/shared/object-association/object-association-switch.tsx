import React, { useState } from 'react'
import { ChevronsDownUp, LayoutList, List, Share2 } from 'lucide-react'
import ObjectAssociationGraph from '@/components/shared/object-association/object-association-graph.tsx'
import { SetObjectAssociationDialog } from '@/components/pages/protected/controls/set-object-association-modal.tsx'
import { Button } from '@repo/ui/button'
import { ObjectAssociationNodeEnum, Section, TCenterNode } from '@/components/shared/object-association/types/object-association-types.ts'
import AssociatedObjectsAccordion from '@/components/shared/object-association/associated-objects-accordion.tsx'
import SetObjectAssociationPoliciesDialog from '@/components/pages/protected/policies/modal/set-object-association-modal.tsx'
import SetObjectAssociationProceduresDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'
import SetObjectAssociationRisksDialog from '@/components/pages/protected/risks/modal/set-object-association-modal'

type TObjectAssociationSwitchProps = {
  sections: Section
  centerNode: TCenterNode
  canEdit: boolean
}

const ObjectAssociationSwitch: React.FC<TObjectAssociationSwitchProps> = ({ sections, centerNode, canEdit }) => {
  const [isGraphView, setIsGraphView] = useState<boolean>(true)
  const [toggleAll, setToggleAll] = useState<boolean>(false)

  const handleAssociationDialog = () => {
    if (!canEdit) {
      return
    }

    switch (centerNode.type) {
      case ObjectAssociationNodeEnum.CONTROL:
        return (
          <div className="mt-5">
            <SetObjectAssociationDialog />
          </div>
        )
      case ObjectAssociationNodeEnum.SUBCONTROL:
        return (
          <div className="mt-5">
            <SetObjectAssociationDialog />
          </div>
        )
      case ObjectAssociationNodeEnum.POLICY:
        return (
          <div className="mt-5">
            <SetObjectAssociationPoliciesDialog policyId={centerNode?.node.id} />
          </div>
        )
      case ObjectAssociationNodeEnum.PROCEDURE:
        return (
          <div className="mt-5">
            <SetObjectAssociationProceduresDialog procedureId={centerNode?.node.id} />
          </div>
        )
      case ObjectAssociationNodeEnum.RISKS:
        return (
          <div className="mt-5">
            <SetObjectAssociationRisksDialog riskId={centerNode?.node.id} />
          </div>
        )
    }
  }

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Associated Objects</h2>
          {!isGraphView && (
            <Button type="button" className="h-8 !px-2" variant="outline" onClick={() => setToggleAll((prevState) => !prevState)}>
              <div className="flex">
                <List size={16} />
                <ChevronsDownUp size={16} />
              </div>
            </Button>
          )}
        </div>

        {!isGraphView ? (
          <Share2 size={20} className="cursor-pointer hover:opacity-80" onClick={() => setIsGraphView(true)} />
        ) : (
          <LayoutList size={20} className="cursor-pointer hover:opacity-80" onClick={() => setIsGraphView(false)} />
        )}
      </div>

      {!isGraphView ? <AssociatedObjectsAccordion sections={sections} toggleAll={toggleAll} /> : <ObjectAssociationGraph centerNode={centerNode} sections={sections} />}

      {handleAssociationDialog()}
    </div>
  )
}

export default ObjectAssociationSwitch
