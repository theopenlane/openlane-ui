'use client'

import React from 'react'
import { InfoIcon } from 'lucide-react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type UpdateSystemDetailInput } from '@repo/codegen/src/schema'

type NameFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdateField?: (input: UpdateSystemDetailInput) => Promise<void>
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
        <span className="font-medium">System Name</span>
        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>Provide the primary name for this system detail record</p>} />
      </div>
      <TextField
        name="systemName"
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
