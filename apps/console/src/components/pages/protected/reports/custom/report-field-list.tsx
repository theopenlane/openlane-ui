'use client'

import React from 'react'
import { Checkbox } from '@repo/ui/checkbox'
import { Separator } from '@repo/ui/separator'

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

const ReportFieldList: React.FC<TReportFieldListProps> = ({ options, selected, onToggle, className }) => {
  const chosen = options.filter((option) => selected.has(option.path))
  const available = options.filter((option) => !selected.has(option.path))
  const dividerIndex = chosen.length > 0 && available.length > 0 ? chosen.length : -1

  return (
    <div className={className}>
      {[...chosen, ...available].map((option, index) => (
        <React.Fragment key={option.path}>
          {index === dividerIndex && <Separator separatorClass="my-0" />}
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <Checkbox checked={selected.has(option.path)} onCheckedChange={() => onToggle(option.path)} />
            <span className="truncate">{option.label}</span>
          </label>
        </React.Fragment>
      ))}
    </div>
  )
}

export default ReportFieldList
