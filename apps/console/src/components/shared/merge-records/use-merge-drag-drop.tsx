'use client'

import React, { useMemo, useState } from 'react'
import type { RowDragDropConfig } from '@repo/ui/data-table'
import { MergeRecordsSheet } from './merge-records-sheet'
import type { MergeConfig } from './types'

type MergePair = { dropId: number; primaryId: string; secondaryId: string; secondaryLabel: string }

type UseMergeDragDropArgs<TRow extends { id: string }, TRecord extends object, TUpdateInput> = {
  config: MergeConfig<TRecord, TUpdateInput>
  enabled: boolean
  getRowLabel: (row: TRow) => string
  onMergeComplete?: (mergedAwayId: string) => void
}

export const useMergeDragDrop = <TRow extends { id: string }, TRecord extends object, TUpdateInput>({
  config,
  enabled,
  getRowLabel,
  onMergeComplete,
}: UseMergeDragDropArgs<TRow, TRecord, TUpdateInput>) => {
  const [pair, setPair] = useState<MergePair | null>(null)
  const [open, setOpen] = useState(false)

  const rowDragDrop = useMemo<RowDragDropConfig<TRow> | undefined>(() => {
    if (!enabled) return undefined
    return {
      getRowId: (row) => row.id,
      getRowLabel,
      dropHint: `Drop onto another ${config.labelSingular} to merge into it`,
      onDrop: (source, target) => {
        if (source.id === target.id) return
        setPair((prev) => ({ dropId: (prev?.dropId ?? 0) + 1, primaryId: target.id, secondaryId: source.id, secondaryLabel: getRowLabel(source) }))
        setOpen(true)
      },
    }
  }, [enabled, getRowLabel, config.labelSingular])

  const mergeSheet = pair ? (
    <MergeRecordsSheet
      key={pair.dropId}
      open={open}
      onOpenChange={setOpen}
      config={config}
      primaryId={pair.primaryId}
      initialSecondaryId={pair.secondaryId}
      initialSecondaryLabel={pair.secondaryLabel}
      onMergeComplete={() => onMergeComplete?.(pair.secondaryId)}
    />
  ) : null

  return { rowDragDrop, mergeSheet }
}
