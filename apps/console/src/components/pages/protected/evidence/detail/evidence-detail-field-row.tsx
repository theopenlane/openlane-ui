'use client'

import React from 'react'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { type EvidenceEditableField } from '@/components/pages/protected/evidence/evidence-sheet-config'

type TEvidenceDetailFieldRowProps = {
  icon: React.ReactNode
  label: string
  field: EvidenceEditableField
  isEditing: boolean
  editField: EvidenceEditableField | null
  editAllowed: boolean
  onEdit: (field: EvidenceEditableField) => void
  triggerRef?: React.RefObject<HTMLDivElement | null>
  editControl: React.ReactNode
  children: React.ReactNode
}

const EvidenceDetailFieldRow: React.FC<TEvidenceDetailFieldRowProps> = ({ icon, label, field, isEditing, editField, editAllowed, onEdit, triggerRef, editControl, children }) => {
  const isInlineEditing = editField === field
  const showEditControl = isEditing || isInlineEditing

  const handleEdit = () => {
    if (editAllowed) onEdit(field)
  }

  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-sm w-45">
        <span className="text-accent-secondary">{icon}</span>
        {label}
      </div>
      <div ref={isInlineEditing ? triggerRef : undefined} className="text-sm text-right w-62.5">
        {showEditControl ? (
          editControl
        ) : (
          <HoverPencilWrapper
            showPencil={editAllowed}
            pencilClass="!absolute !-right-5"
            className={`relative w-62.5 justify-end ${editAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onPencilClick={handleEdit}
          >
            <div className="flex justify-end items-center gap-2 w-full" onDoubleClick={handleEdit}>
              {children}
            </div>
          </HoverPencilWrapper>
        )}
      </div>
    </div>
  )
}

export default EvidenceDetailFieldRow
