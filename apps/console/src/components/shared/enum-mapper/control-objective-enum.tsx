import { Archive, Circle, FilePen } from 'lucide-react'
import { ControlObjectiveControlSource, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema.ts'
import React from 'react'
import { enumToOptions } from '@/components/shared/enum-mapper/common-enum'

export const ControlObjectiveIconMapper: Record<ControlObjectiveObjectiveStatus, React.ReactNode> = {
  [ControlObjectiveObjectiveStatus.DRAFT]: <FilePen height={16} width={16} />,
  [ControlObjectiveObjectiveStatus.ACTIVE]: <Circle height={16} width={16} />,
  [ControlObjectiveObjectiveStatus.ARCHIVED]: <Archive height={16} width={16} />,
}

export const ControlObjectiveStatusOptions = enumToOptions(ControlObjectiveObjectiveStatus)

export const ControlObjectiveSourceOptions = enumToOptions(ControlObjectiveControlSource)

export const ControlObjectiveStatusFilterOptions = enumToOptions(ControlObjectiveObjectiveStatus)
