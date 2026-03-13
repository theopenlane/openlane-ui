'use client'

import React from 'react'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'

const StepOwnership: React.FC = () => {
  return (
    <div className="space-y-4">
      <ResponsibilityField
        name="internalOwner"
        fieldBaseName="internalOwner"
        label="Owner"
        tooltipContent="The owner responsible for the vendor"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <ResponsibilityField
        name="reviewedBy"
        fieldBaseName="reviewedBy"
        label="Reviewer"
        tooltipContent="The person or group who reviews the vendor"
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
