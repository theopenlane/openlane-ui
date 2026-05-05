'use client'

import React from 'react'
import { type InternalPolicyByIdFragment } from '@repo/codegen/src/schema'
import { getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { fmtArr, fmtBool, fmtDate, fmtEnum, fmtStr, norm } from './formatters'
import { type HistoryNode } from './types'

type FieldsDiffProps = {
  history: HistoryNode
  current: InternalPolicyByIdFragment
}

type FieldDef = {
  label: string
  format: (h: HistoryNode, c: InternalPolicyByIdFragment) => { was: string; now: string; equal: boolean }
}

const eqStr = (a: unknown, b: unknown): boolean => norm(a) === norm(b)
const eqBool = (a: boolean | null | undefined, b: boolean | null | undefined): boolean => (a == null ? null : a) === (b == null ? null : b)
const eqDate = (a: unknown, b: unknown): boolean => String(norm(a) ?? '') === String(norm(b) ?? '')
const eqArr = (a: readonly string[] | null | undefined, b: readonly string[] | null | undefined): boolean => {
  const aa = [...(a ?? [])].sort()
  const bb = [...(b ?? [])].sort()
  return aa.length === bb.length && aa.every((v, i) => v === bb[i])
}

const FIELDS: FieldDef[] = [
  { label: 'Name', format: (h, c) => ({ was: fmtStr(h.name), now: fmtStr(c.name), equal: eqStr(h.name, c.name) }) },
  { label: 'Revision', format: (h, c) => ({ was: fmtStr(h.revision), now: fmtStr(c.revision), equal: eqStr(h.revision, c.revision) }) },
  { label: 'Status', format: (h, c) => ({ was: fmtEnum(h.status, getEnumLabel), now: fmtEnum(c.status, getEnumLabel), equal: eqStr(h.status, c.status) }) },
  { label: 'Approval required', format: (h, c) => ({ was: fmtBool(h.approvalRequired), now: fmtBool(c.approvalRequired), equal: eqBool(h.approvalRequired, c.approvalRequired) }) },
  { label: 'Review due', format: (h, c) => ({ was: fmtDate(h.reviewDue), now: fmtDate(c.reviewDue), equal: eqDate(h.reviewDue, c.reviewDue) }) },
  {
    label: 'Review frequency',
    format: (h, c) => ({ was: fmtEnum(h.reviewFrequency, getEnumLabel), now: fmtEnum(c.reviewFrequency, getEnumLabel), equal: eqStr(h.reviewFrequency, c.reviewFrequency) }),
  },
  { label: 'Approver', format: (h, c) => ({ was: fmtStr(h.approverID), now: fmtStr(c.approver?.id), equal: eqStr(h.approverID, c.approver?.id) }) },
  { label: 'Delegate', format: (h, c) => ({ was: fmtStr(h.delegateID), now: fmtStr(c.delegate?.id), equal: eqStr(h.delegateID, c.delegate?.id) }) },
  { label: 'Kind', format: (h, c) => ({ was: fmtStr(h.internalPolicyKindName), now: fmtStr(c.internalPolicyKindName), equal: eqStr(h.internalPolicyKindName, c.internalPolicyKindName) }) },
  { label: 'Tags', format: (h, c) => ({ was: fmtArr(h.tags), now: fmtArr(c.tags), equal: eqArr(h.tags, c.tags) }) },
]

const FieldsDiff: React.FC<FieldsDiffProps> = ({ history, current }) => {
  const changed = FIELDS.map((f) => ({ label: f.label, ...f.format(history, current) })).filter((r) => !r.equal)

  if (changed.length === 0) {
    return <div className="text-sm text-muted-foreground">No field changes detected.</div>
  }

  return (
    <div className="rounded-md border border-border">
      <div className="grid grid-cols-[140px_1fr_1fr] gap-2 border-b border-border px-3 py-2 text-xs uppercase text-muted-foreground">
        <span>Field</span>
        <span>This version</span>
        <span>Current</span>
      </div>
      {changed.map((row) => (
        <div key={row.label} className="grid grid-cols-[140px_1fr_1fr] gap-2 border-b border-border px-3 py-2 text-sm last:border-b-0">
          <span className="font-medium">{row.label}</span>
          <span className="bg-red-500/10 px-1 rounded line-through">{row.was}</span>
          <span className="bg-green-500/10 px-1 rounded">{row.now}</span>
        </div>
      ))}
    </div>
  )
}

export default FieldsDiff
