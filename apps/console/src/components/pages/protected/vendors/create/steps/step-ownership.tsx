'use client'

import React from 'react'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'

const StepOwnership: React.FC = () => {
  return (
    <div className="space-y-4">
      <ResponsibilityField
        name="internalOwner"
        fieldBaseName="internalOwner"
        label="Internal Owner"
        tooltipContent="The internal owner responsible for the vendor"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <ResponsibilityField
        name="reviewedBy"
        fieldBaseName="reviewedBy"
        label="Reviewed By"
        tooltipContent="The person or group who reviewed the vendor"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />
    </div>
  )
}

export default StepOwnership
