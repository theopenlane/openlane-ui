import useEscapeKey from '@/hooks/useEscapeKey'
import type { ControlByIdNode } from '@/lib/graphql-hooks/control'
import type { SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import React, { useState } from 'react'
import MappedCategoriesDialog from '../../mapped-categories-dialog'
import { Property } from './property'

export const MappedCategories = ({
  isEditing,
  data,
  activeField,
  setActiveField,
  fieldId,
}: {
  isEditing: boolean
  data?: ControlByIdNode | SubcontrolByIdNode
  activeField?: string | null
  setActiveField?: (field: string | null) => void
  fieldId?: string
}) => {
  const [internalEditing, setInternalEditing] = useState(false)
  const resolvedFieldId = fieldId ?? 'mappedCategories'
  const isControlled = activeField !== undefined && setActiveField !== undefined
  const isActive = isControlled ? activeField === resolvedFieldId : internalEditing
  const editing = isEditing || isActive

  const handleClick = () => {
    if (!isEditing) {
      if (isControlled) {
        setActiveField?.(resolvedFieldId)
      } else {
        setInternalEditing(true)
      }
    }
  }

  useEscapeKey(() => {
    if (isActive) {
      if (isControlled) {
        setActiveField?.(null)
      } else {
        setInternalEditing(false)
      }
    }
  })

  if (editing) {
    return (
      <MappedCategoriesDialog
        onClose={() => {
          if (isControlled) {
            setActiveField?.(null)
          } else {
            setInternalEditing(false)
          }
        }}
      />
    )
  }

  return (
    <div onDoubleClick={handleClick} className="cursor-pointer ">
      <Property label="Mapped categories" value={(data?.mappedCategories ?? []).join(',\n')} onPencilClick={handleClick} />
    </div>
  )
}
