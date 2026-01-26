import useEscapeKey from '@/hooks/useEscapeKey'
import { Control, Subcontrol } from '@repo/codegen/src/schema'
import React, { useState } from 'react'
import MappedCategoriesDialog from '../../mapped-categories-dialog'
import { Property } from './property'

export const MappedCategories = ({ isEditing, data }: { isEditing: boolean; data?: Control | Subcontrol }) => {
  const [internalEditing, setInternalEditing] = useState(false)
  const editing = isEditing || internalEditing

  const handleClick = () => {
    if (!isEditing) {
      setInternalEditing(true)
    }
  }

  useEscapeKey(() => {
    if (internalEditing) setInternalEditing(false)
  })

  if (editing) {
    return <MappedCategoriesDialog onClose={() => setInternalEditing(false)} />
  }

  return (
    <div onDoubleClick={handleClick} className="cursor-pointer ">
      <Property label="Mapped categories" value={(data?.mappedCategories ?? []).join(',\n')} />
    </div>
  )
}
