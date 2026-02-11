import { Archive, Circle, FilePen } from 'lucide-react'
import { ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'

export const ControlObjectiveIconMapper: Record<ControlObjectiveObjectiveStatus, React.ReactNode> = {
  [ControlObjectiveObjectiveStatus.DRAFT]: <FilePen height={16} width={16} />,
  [ControlObjectiveObjectiveStatus.ACTIVE]: <Circle height={16} width={16} />,
  [ControlObjectiveObjectiveStatus.ARCHIVED]: <Archive height={16} width={16} />,
}

// Status options for select dropdowns
export const ControlObjectiveStatusOptions = Object.values(ControlObjectiveObjectiveStatus).map((status) => ({
  label: getEnumLabel(status),
  value: status,
}))

// Status options for table filters
export const ControlObjectiveStatusFilterOptions = Object.entries(ControlObjectiveObjectiveStatus).map(([key, value]) => ({
  label: key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase()),
  value,
}))
