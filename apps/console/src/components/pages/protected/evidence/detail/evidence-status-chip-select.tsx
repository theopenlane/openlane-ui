'use client'

import React from 'react'
import { type EvidenceEvidenceStatus } from '@repo/codegen/src/schema'
import { Badge, badgeVariants } from '@repo/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { cn } from '@repo/ui/lib/utils'
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
    <Select value={status ?? undefined} onValueChange={(value) => onChange(value as EvidenceEvidenceStatus)}>
      <SelectTrigger
        aria-label="Evidence status"
        className={cn(badgeVariants({ variant: 'secondary' }), 'w-fit h-auto gap-1 font-medium shadow-none cursor-pointer focus:ring-0 [&>svg]:opacity-100')}
        style={status ? getEvidenceStatusStyle(status) : undefined}
      >
        {label}
      </SelectTrigger>
      <SelectContent>
        {EvidenceStatusOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default EvidenceStatusChipSelect
