'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ArrowUpDown } from 'lucide-react'
import SetObjectAssociationRisksDialog from '../../modal/set-object-association-modal'
import AssociatedObjectsAccordion from '@/components/pages/protected/risks/accordion/associated-objects-accordion.tsx'

const AssociationCard: React.FC = () => {
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
            <SetObjectAssociationRisksDialog />
          </div>
        </div>
        <AssociatedObjectsAccordion />
      </div>
    </Card>
  )
}

export default AssociationCard
