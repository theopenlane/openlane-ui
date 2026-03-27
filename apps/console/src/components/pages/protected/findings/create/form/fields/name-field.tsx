'use client'

import React from 'react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { type UpdateFindingInput } from '@repo/codegen/src/schema'

type NameFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdateField?: (input: UpdateFindingInput) => Promise<void>
  initialValue?: string
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  className?: string
  error?: string
  badge?: React.ReactNode
}

const NameField: React.FC<NameFieldProps> = ({ isEditing, isEditAllowed = true, handleUpdateField, initialValue, internalEditing, setInternalEditing, className, error, badge }) => {
  return (
    <div className={className}>
      <div className="flex items-center mb-1">
        <span className="font-medium">Display Name</span>
        <SystemTooltip icon={<InfoIcon size={14} className="mx-2 mt-1" />} content={<p>Provide a descriptive name for the finding</p>} />
        {badge}
      </div>
      <TextField
        name="displayName"
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
