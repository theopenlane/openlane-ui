'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Stamp, CircleArrowRight } from 'lucide-react'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'

type TAuthorityCardProps = {
  inputClassName?: string
}

const AuthorityCard: React.FC<TAuthorityCardProps> = ({ inputClassName }) => {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <h3 className="text-lg font-medium mb-2">Authority</h3>
      <div className="grid grid-cols-[min-content_250px] gap-y-4 gap-x-6 items-center">
        {/* Stakeholder */}
        <div className={`flex gap-2 items-center w-32 shrink-0 ${inputClassName ?? ''}`}>
          <Stamp size={16} className="text-brand" />
          <span className="text-sm">Stakeholder</span>
        </div>
        <div className="w-50 min-w-0">
          <ResponsibilityField
            name="stakeholder"
            fieldBaseName="stakeholder"
            label=""
            isCreate={true}
            internalEditing={null}
            setInternalEditing={() => {}}
            isEditing={false}
            isEditAllowed={true}
            groupOnly={true}
          />
        </div>

        {/* Delegate */}
        <div className={`flex gap-2 items-center w-32 shrink-0 ${inputClassName ?? ''}`}>
          <CircleArrowRight size={16} className="text-brand" />
          <span className="text-sm">Delegate</span>
        </div>
        <div className="w-50 min-w-0">
          <ResponsibilityField
            name="delegate"
            fieldBaseName="delegate"
            label=""
            groupOnly={true}
            isCreate={true}
            internalEditing={null}
            setInternalEditing={() => {}}
            isEditing={false}
            isEditAllowed={true}
          />
        </div>
      </div>
    </Card>
  )
}

export default AuthorityCard
