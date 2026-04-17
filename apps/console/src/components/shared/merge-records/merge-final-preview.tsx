'use client'

import React from 'react'
import { Badge } from '@repo/ui/badge'
import { MergeValueDisplay } from './merge-value-display'
import { isEmptyValue } from './use-merge-resolution'
import type { ResolvedField } from './use-merge-resolution'

type Props<TRecord> = {
  resolvedFields: ResolvedField<TRecord>[]
}

export const MergeFinalPreview = <TRecord,>({ resolvedFields }: Props<TRecord>) => {
  const previewFields = resolvedFields.filter((rf) => !isEmptyValue(rf.resolvedValue))

  if (previewFields.length === 0) {
    return <p className="text-sm text-muted-foreground">No data to preview yet.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {previewFields.map((rf) => {
        const sourceBadge = rf.kind === 'merged-array' && rf.arrayStrategy === 'union' ? 'Merged' : rf.kind === 'merged-map' ? 'Merged' : rf.chosenSource === 'primary' ? 'Primary' : 'Secondary'
        return (
          <div key={rf.field.key} className="flex items-start justify-between gap-4 border-b last:border-b-0 pb-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">{rf.field.label}</span>
                <Badge variant="outline" className="text-[10px]">
                  {sourceBadge}
                </Badge>
              </div>
              <MergeValueDisplay field={rf.field} value={rf.resolvedValue} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
