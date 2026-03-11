'use client'

import React, { useState } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { type UpdateEntityInput, type EntityQuery, EntityEntityStatus, EntityFrequency } from '@repo/codegen/src/schema'
import { ResponsibilityField } from '@/components/shared/crud-base/form-fields/responsibility-field'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { useCreatableEnumOptions } from '@/lib/graphql-hooks/custom-type-enum'
import { formatDate } from '@/utils/date'

interface VendorPropertiesSidebarProps {
  data: EntityQuery['entity']
  isEditing: boolean
  handleUpdate: (input: UpdateEntityInput) => Promise<void>
  canEdit: boolean
}

const VendorPropertiesSidebar: React.FC<VendorPropertiesSidebarProps> = ({ data, isEditing, handleUpdate, canEdit: canEditVendor }) => {
  const [internalEditing, setInternalEditing] = useState<string | null>(null)

  const { enumOptions: environmentOptions, onCreateOption: createEnvironment } = useCreatableEnumOptions({ field: 'environment' })
  const { enumOptions: scopeOptions, onCreateOption: createScope } = useCreatableEnumOptions({ field: 'scope' })

  const entityStatusOptions = Object.values(EntityEntityStatus).map((value) => ({
    value,
    label: getEnumLabel(value),
  }))

  const reviewFrequencyOptions = Object.values(EntityFrequency).map((value) => ({
    value,
    label: getEnumLabel(value),
  }))

  const sharedFieldProps = {
    isEditing,
    isEditAllowed: canEditVendor,
    isCreate: false,
    data,
    internalEditing,
    setInternalEditing,
    handleUpdate,
  }

  return (
    <Card className="p-4 bg-card rounded-xl shadow-xs">
      <h3 className="text-lg font-medium mb-4">Properties</h3>
      <div className="space-y-3">
        <ResponsibilityField
          name="internalOwner"
          fieldBaseName="internalOwner"
          label="Owner"
          tooltipContent="The internal owner responsible for the vendor"
          isEditing={isEditing}
          isEditAllowed={canEditVendor}
          isCreate={false}
          internalEditing={internalEditing}
          setInternalEditing={setInternalEditing}
          handleUpdate={(input) => handleUpdate(input as UpdateEntityInput)}
        />

        <ResponsibilityField
          name="reviewedBy"
          fieldBaseName="reviewedBy"
          label="Reviewer"
          tooltipContent="The person or group who reviews the vendor"
          isEditing={isEditing}
          isEditAllowed={canEditVendor}
          isCreate={false}
          internalEditing={internalEditing}
          setInternalEditing={setInternalEditing}
          handleUpdate={(input) => handleUpdate(input as UpdateEntityInput)}
        />

        <SelectField name="status" label="Status" options={entityStatusOptions} {...sharedFieldProps} />

        <SelectField name="environmentName" label="Environment" options={environmentOptions} onCreateOption={createEnvironment} {...sharedFieldProps} />

        <SelectField name="scopeName" label="Scope" options={scopeOptions} onCreateOption={createScope} {...sharedFieldProps} />

        <SelectField name="reviewFrequency" label="Review Frequency" options={reviewFrequencyOptions} {...sharedFieldProps} />

        <TextField name="nextReviewAt" label="Next Review" type="date" {...sharedFieldProps} />

        <div className="pt-2 border-t space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Updated</span>
            <span>{formatDate(data?.updatedAt)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last Reviewed</span>
            <span>{formatDate(data?.lastReviewedAt)}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default VendorPropertiesSidebar
