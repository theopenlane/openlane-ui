'use client'

import React from 'react'
import { type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { Badge } from '@repo/ui/badge'
import { ChipSelect } from '@/components/shared/chip-select/chip-select'
import { EvidenceStatusBadge, EvidenceStatusOptions, getEvidenceStatusStyle } from '@/components/shared/enum-mapper/evidence-enum'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

type TEvidenceStatusChipSelectProps = {
  status?: EvidenceEvidenceStatus | null
  editAllowed: boolean
  onChange: (status: EvidenceEvidenceStatus) => void
}

const EvidenceStatusChipSelect: React.FC<TEvidenceStatusChipSelectProps> = ({ status, editAllowed, onChange }) => {
  const label = status ? getEnumLabel(status) : 'No status'

  if (!editAllowed) {
    return status ? (
      <EvidenceStatusBadge status={status} />
    ) : (
      <Badge variant="secondary" className="font-medium">
        {label}
      </Badge>
    )
  }

  return (
    <ChipSelect label="Evidence status" value={status} options={EvidenceStatusOptions} onChange={onChange} className="font-medium" style={status ? getEvidenceStatusStyle(status) : undefined}>
      {label}
    </ChipSelect>
  )
}

export default EvidenceStatusChipSelect
