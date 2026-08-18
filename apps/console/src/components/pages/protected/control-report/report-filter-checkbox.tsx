'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { type ReportFilterId, type ReportFilterOption } from './report-filter-options'

type ReportFilterCheckboxProps = {
  option: ReportFilterOption
  checked: boolean
  onToggle: (id: ReportFilterId) => void
}

const ReportFilterCheckbox: React.FC<ReportFilterCheckboxProps> = ({ option, checked, onToggle }) => (
  <label className="flex items-center gap-2 text-sm cursor-pointer">
    <Checkbox checked={checked} onCheckedChange={() => onToggle(option.id)} />
    {option.label}
  </label>
)

export default ReportFilterCheckbox
