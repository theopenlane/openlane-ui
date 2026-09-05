'use client'

import React, { useEffect, useMemo, useState } from 'react'
import type { RowDragDropConfig } from '@repo/ui/data-table'
import { MergeRecordsSheet } from './merge-records-sheet'
import { useMergeMode } from './merge-mode-context'
import { ROW_ACTIONS_COLUMN_ID, SELECT_COLUMN_ID } from '@repo/ui/pinned-columns'
import type { MergeConfig } from './types'

type MergePair = { dropId: number; primaryId: string; secondaryId: string; secondaryLabel: string }

const MERGE_MODE_HIDDEN_COLUMN_IDS = [SELECT_COLUMN_ID, ROW_ACTIONS_COLUMN_ID] as const

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
  const { active: mergeMode, registerAvailability } = useMergeMode()

  useEffect(() => {
    registerAvailability(enabled)
    return () => registerAvailability(false)
  }, [enabled, registerAvailability])

  const rowDragDrop = useMemo<RowDragDropConfig<TRow> | undefined>(() => {
    if (!enabled) return undefined
    return {
      getRowId: (row) => row.id,
      getRowLabel,
      dropHint: `Drop onto another ${config.labelSingular} to merge into it`,
      exclusive: mergeMode,
      exclusiveHiddenColumnIds: MERGE_MODE_HIDDEN_COLUMN_IDS,
      onDrop: (source, target) => {
        if (source.id === target.id) return
        setPair((prev) => ({ dropId: (prev?.dropId ?? 0) + 1, primaryId: target.id, secondaryId: source.id, secondaryLabel: getRowLabel(source) }))
        setOpen(true)
      },
    }
  }, [enabled, getRowLabel, config.labelSingular, mergeMode])

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
