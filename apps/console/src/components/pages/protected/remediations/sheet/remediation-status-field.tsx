'use client'

import React, { useState } from 'react'
import { Select, SelectTrigger, SelectValue } from '@repo/ui/select'
import { type RemediationRemediationStatus } from '@repo/codegen/src/schema'
import { HoverPencilWrapper } from '@/components/shared/hover-pencil-wrapper/hover-pencil-wrapper'
import { RemediationStatusIconLabel, RemediationStatusSelectContent } from '@/components/shared/enum-mapper/remediation-enum'

export type TRemediationStatusFieldProps = {
  status?: RemediationRemediationStatus | null
  onStatusChange?: (status: RemediationRemediationStatus) => Promise<void>
}

const RemediationStatusField: React.FC<TRemediationStatusFieldProps> = ({ status, onStatusChange }) => {
  const [isInlineEditing, setIsInlineEditing] = useState(false)
  const [pendingStatus, setPendingStatus] = useState<RemediationRemediationStatus | null>(null)
  const shownStatus = pendingStatus ?? status
  const editable = !!onStatusChange && !pendingStatus

  const startInlineEdit = () => {
    if (editable) setIsInlineEditing(true)
  }

  const saveStatus = async (next: RemediationRemediationStatus) => {
    if (!onStatusChange) return
    setPendingStatus(next)
    try {
      await onStatusChange(next)
    } finally {
      setPendingStatus(null)
    }
  }

  if (isInlineEditing) {
    return (
      <Select
        defaultOpen
        value={shownStatus ?? undefined}
        onOpenChange={(open) => {
          if (!open) setIsInlineEditing(false)
        }}
        onValueChange={(next) => saveStatus(next as RemediationRemediationStatus)}
      >
        <SelectTrigger className="h-8 w-auto min-w-40" aria-label="Status">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <RemediationStatusSelectContent />
      </Select>
    )
  }

  if (!shownStatus && !onStatusChange) {
    return null
  }

  return (
    <HoverPencilWrapper showPencil={editable} onPencilClick={startInlineEdit} pencilAriaLabel="Edit status">
      <div onDoubleClick={startInlineEdit} className="flex min-h-6 items-center">
        {shownStatus ? <RemediationStatusIconLabel status={shownStatus} /> : <span className="italic">Status not set</span>}
      </div>
    </HoverPencilWrapper>
  )
}

export default RemediationStatusField
