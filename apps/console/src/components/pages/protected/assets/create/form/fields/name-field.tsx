'use client'

import React from 'react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { UpdateAssetInput } from '@repo/codegen/src/schema'

type NameFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdateField?: (input: UpdateAssetInput) => Promise<void>
  initialValue?: string
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  className?: string
  error?: string
}

const NameField: React.FC<NameFieldProps> = ({ isEditing, isEditAllowed = true, handleUpdateField, initialValue, internalEditing, setInternalEditing, className, error }) => {
  return (
    <div className={className}>
      <div className="flex items-center mb-1">
        <span className="font-medium">Name</span>
        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide a descriptive name of the asset</p>} />
      </div>
      <TextField
        name="name"
        label=""
        isEditing={isEditing}
        isEditAllowed={isEditAllowed}
        initialValue={initialValue}
        handleUpdate={handleUpdateField}
        internalEditing={internalEditing}
        setInternalEditing={setInternalEditing}
        error={error}
      />
    </div>
  )
}

export default NameField
