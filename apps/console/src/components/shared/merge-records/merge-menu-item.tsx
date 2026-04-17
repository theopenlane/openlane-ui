'use client'

import React, { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { MergeRecordsSheet } from './merge-records-sheet'
import type { MergeConfig } from './types'

type Props<TRecord, TUpdateInput> = {
  primaryId: string
  config: MergeConfig<TRecord, TUpdateInput>
  onMergeComplete?: () => void
}

export const MergeMenuItem = <TRecord, TUpdateInput>({ primaryId, config, onMergeComplete }: Props<TRecord, TUpdateInput>) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex items-center space-x-2 px-1 bg-transparent cursor-pointer">
        <ArrowRightLeft size={16} strokeWidth={2} />
        <span>Merge with…</span>
      </button>
      <MergeRecordsSheet open={open} onOpenChange={setOpen} config={config} primaryId={primaryId} onMergeComplete={onMergeComplete} />
    </>
  )
}

export const MergeHeaderButton = <TRecord, TUpdateInput>({ primaryId, config, onMergeComplete }: Props<TRecord, TUpdateInput>) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button icon={<ArrowRightLeft size={16} />} iconPosition="left" variant="secondary" onClick={() => setOpen(true)}>
        Merge
      </Button>
      <MergeRecordsSheet open={open} onOpenChange={setOpen} config={config} primaryId={primaryId} onMergeComplete={onMergeComplete} />
    </>
  )
}
