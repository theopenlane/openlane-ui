'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ArrowUpDown } from 'lucide-react'
import SetObjectAssociationDialog from '@/components/pages/protected/procedures/modal/set-object-association-modal.tsx'
import AssociatedObjectsAccordion from '@/components/pages/protected/procedures/accordion/associated-objects-accordion.tsx'

type TAssociationCardProps = {
  isEditable: boolean
}

const AssociationCard: React.FC<TAssociationCardProps> = ({ isEditable }) => {
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
            <SetObjectAssociationDialog isEditable={isEditable} />
          </div>
        </div>
        <AssociatedObjectsAccordion />
      </div>
    </Card>
  )
}

export default AssociationCard
