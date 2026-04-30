'use client'

import React from 'react'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { fmtArr, fmtBool, fmtDate, fmtEnum, fmtStr } from './formatters'
import { type HistoryNode } from './types'

type FieldsSummaryProps = {
  history: HistoryNode
}

const FieldsSummary: React.FC<FieldsSummaryProps> = ({ history }) => {
  const rows: Array<[string, string]> = [
    ['Name', fmtStr(history.name)],
    ['Revision', fmtStr(history.revision)],
    ['Status', fmtEnum(history.status, getEnumLabel)],
    ['Approval required', fmtBool(history.approvalRequired)],
    ['Review due', fmtDate(history.reviewDue)],
    ['Review frequency', fmtEnum(history.reviewFrequency, getEnumLabel)],
    ['Approver', fmtStr(history.approverID)],
    ['Delegate', fmtStr(history.delegateID)],
    ['Kind', fmtStr(history.internalPolicyKindName)],
    ['Environment', fmtStr(history.environmentName)],
    ['Scope', fmtStr(history.scopeName)],
    ['Tags', fmtArr(history.tags)],
  ]

  return (
    <div className="rounded-md border border-border">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[160px_1fr] gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0">
          <span className="text-muted-foreground">{label}</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  )
}

export default FieldsSummary
