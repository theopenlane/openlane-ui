'use client'

import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@repo/ui/select'
import { useUserSelect } from '@/lib/graphql-hooks/member'

const UNASSIGNED = 'unassigned'

type Props = {
  value?: string | null
  onAssign: (userId: string | null) => void
  disabled?: boolean
  trigger?: React.ReactNode
  className?: string
}

const AssigneeSelect: React.FC<Props> = ({ value, onAssign, disabled, trigger, className }) => {
  const { userOptions } = useUserSelect({})
  const selectedLabel = userOptions.find((option) => option.value === value)?.label

  return (
    <Select value={value ?? UNASSIGNED} disabled={disabled} onValueChange={(next) => onAssign(next === UNASSIGNED ? null : next)}>
      <SelectTrigger className={className}>{trigger ?? selectedLabel ?? 'Unassigned'}</SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {userOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export default AssigneeSelect
