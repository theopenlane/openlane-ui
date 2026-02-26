'use client'

import React from 'react'
import { SystemTooltip } from '@repo/ui/system-tooltip'
import { InfoIcon } from 'lucide-react'
import { TextField } from '@/components/shared/crud-base/form-fields/text-field'
import { InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { UpdateScanInput } from '@repo/codegen/src/schema'

type TargetFieldProps = {
  isEditing: boolean
  isEditAllowed?: boolean
  handleUpdateField?: (input: UpdateScanInput) => Promise<void>
  initialValue?: string
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  className?: string
  error?: string
}

const TargetField: React.FC<TargetFieldProps> = ({ isEditing, isEditAllowed = true, handleUpdateField, initialValue, internalEditing, setInternalEditing, className, error }) => {
  return (
    <div className={className}>
      <div className="flex items-center mb-1">
        <span className="font-medium">Target</span>
        <SystemTooltip icon={<InfoIcon size={14} className="mx-1 mt-1" />} content={<p>The domain name, IP address, or codebase being scanned</p>} />
      </div>
      <TextField
        name="target"
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

export default TargetField
