'use client'

import React from 'react'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'

const StepOwnership: React.FC = () => {
  return (
    <div className="space-y-4">
      <ResponsibilityField
        name="businessOwner"
        fieldBaseName="businessOwner"
        label="Business Owner"
        tooltipContent="The business owner responsible for this platform"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <ResponsibilityField
        name="technicalOwner"
        fieldBaseName="technicalOwner"
        label="Technical Owner"
        tooltipContent="The technical owner responsible for this platform"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <ResponsibilityField
        tooltipContent="The internal owner responsible for this platform"
        isEditing={true}
        isEditAllowed={true}
        isCreate={true}
        internalEditing={null}
        setInternalEditing={() => {}}
      />

      <ResponsibilityField
        name="securityOwner"
        fieldBaseName="securityOwner"
        label="Security Owner"
        tooltipContent="The security owner responsible for this platform"
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
