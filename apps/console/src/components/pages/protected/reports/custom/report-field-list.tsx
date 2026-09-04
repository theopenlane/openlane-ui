'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'

export type TReportFieldOption = {
  path: string
  label: string
}

type TReportFieldListProps = {
  options: TReportFieldOption[]
  selected: Set<string>
  onToggle: (path: string) => void
  className?: string
}

const ReportFieldList: React.FC<TReportFieldListProps> = ({ options, selected, onToggle, className }) => (
  <div className={className}>
    {options.map((option) => (
      <label key={option.path} className="flex items-center gap-2 cursor-pointer text-sm">
        <Checkbox checked={selected.has(option.path)} onCheckedChange={() => onToggle(option.path)} />
        <span className="truncate">{option.label}</span>
      </label>
    ))}
  </div>
)

export default ReportFieldList
