'use client'

import React, { useState } from 'react'
import { ArrowRightLeft } from 'lucide-react'
import { Button } from '@theopenlane/ui/button'
import { MergeRecordsSheet } from './merge-records-sheet'
import type { MergeableTypeName } from '@repo/codegen/src/merge-fields.generated'
import type { MergeConfig } from './types'
import MenuItem from '@/components/shared/menu/menu-item'

type Props<TRecord extends object, TUpdateInput, TEntity extends MergeableTypeName> = {
  primaryId: string
  config: MergeConfig<TRecord, TUpdateInput, TEntity>
  onMergeComplete?: () => void
}

export const MergeMenuItem = <TRecord extends object, TUpdateInput, TEntity extends MergeableTypeName>({ primaryId, config, onMergeComplete }: Props<TRecord, TUpdateInput, TEntity>) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <MenuItem icon={<ArrowRightLeft size={16} strokeWidth={2} />} onSelect={() => setOpen(true)}>
        Merge with…
      </MenuItem>
      <MergeRecordsSheet open={open} onOpenChange={setOpen} config={config} primaryId={primaryId} onMergeComplete={onMergeComplete} />
    </>
  )
}

export const MergeHeaderButton = <TRecord extends object, TUpdateInput, TEntity extends MergeableTypeName>({ primaryId, config, onMergeComplete }: Props<TRecord, TUpdateInput, TEntity>) => {
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
