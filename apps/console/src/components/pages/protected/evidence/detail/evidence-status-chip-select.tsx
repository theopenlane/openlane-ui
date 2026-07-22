'use client'

import React from 'react'
import { EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { EVIDENCE_STATUS_STYLES } from '@/components/shared/enum-mapper/evidence-enum'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type TEvidenceStatusChipSelectProps = {
  status?: EvidenceEvidenceStatus | null
  editAllowed: boolean
  onChange: (status: EvidenceEvidenceStatus) => void
}

const statusOptions = enumToOptions(EvidenceEvidenceStatus)

const EvidenceStatusChipSelect: React.FC<TEvidenceStatusChipSelectProps> = ({ status, editAllowed, onChange }) => {
  const style = status ? EVIDENCE_STATUS_STYLES[status] : undefined
  const chipStyle = style ? { backgroundColor: style.bg, color: style.color } : undefined
  const label = getEnumLabel(status ?? undefined) || 'No status'

  if (!editAllowed) {
    return (
      <Badge variant="secondary" className="text-xs font-medium" style={chipStyle}>
        {label}
      </Badge>
    )
  }

  return (
    <Select value={status ?? undefined} onValueChange={(value) => onChange(value as EvidenceEvidenceStatus)}>
      <SelectTrigger
        aria-label="Evidence status"
        className="w-fit h-auto gap-1 rounded-full border-transparent px-2.5 py-0.5 text-xs font-medium shadow-none cursor-pointer focus:ring-0 [&>svg]:opacity-100"
        style={chipStyle}
      >
        {label}
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {getEnumLabel(option.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default EvidenceStatusChipSelect
