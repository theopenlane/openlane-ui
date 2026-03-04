'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ArrowUpDown } from 'lucide-react'
import SetObjectAssociationProceduresDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'
import AssociatedObjectsAccordion from '@/components/pages/protected/procedures/accordion/associated-objects-accordion.tsx'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap.ts'

type AssociationCardProps = {
  associations: TObjectAssociationMap
  initialAssociations: TObjectAssociationMap
  associationRefCodes: TObjectAssociationMap
  onAssociationsChange: (newAssociations: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => void
}

const AssociationCard: React.FC<AssociationCardProps> = ({ associations, initialAssociations, associationRefCodes, onAssociationsChange }) => {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4">
        {/* Association */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <ArrowUpDown size={16} className="text-brand" />
            <span>Association</span>
          </div>

          <div className="flex gap-2">
            <SetObjectAssociationProceduresDialog
              associations={associations}
              initialAssociations={initialAssociations}
              associationRefCodes={associationRefCodes}
              onAssociationsChange={onAssociationsChange}
            />
          </div>
        </div>
        <AssociatedObjectsAccordion associationRefCodes={associationRefCodes} />
      </div>
    </Card>
  )
}

export default AssociationCard
