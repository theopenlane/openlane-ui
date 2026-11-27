'use client'

import React, { useRef, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { type TAssociationUpdateInput, type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type SearchableItem } from '@/components/shared/searchable-item-select/searchable-item-select'

export type TLinkPickerProps = {
  labelId: string
  selectedIds: string[]
  onSelectedIdsChange: (ids: string[]) => void
  knownItems: SearchableItem[]
}

export type TLinkField<TKey extends string> = {
  key: TKey
  label: string
  linked: SearchableItem[]
  renderPicker: (props: TLinkPickerProps) => React.ReactNode
}

type TLinkRecordsDialogProps<TKey extends string> = {
  title: string
  fields: TLinkField<TKey>[]
  onOpenChange: (open: boolean) => void
  onSave: (input: TAssociationUpdateInput<TKey>) => Promise<void>
}

const LinkRecordsDialog = <TKey extends string>({ title, fields, onOpenChange, onSave }: TLinkRecordsDialogProps<TKey>) => {
  const [initial] = useState<TObjectAssociationMap<TKey>>(() => Object.fromEntries(fields.map(({ key, linked }) => [key, linked.map(({ id }) => id)])) as TObjectAssociationMap<TKey>)
  const [selected, setSelected] = useState(initial)
  const [isSaving, setIsSaving] = useState(false)
  const isSavingRef = useRef(false)

  const handleSave = async () => {
    if (isSavingRef.current) return
    const input = getAssociationInput(initial, selected)
    if (Object.keys(input).length === 0) {
      onOpenChange(false)
      return
    }
    isSavingRef.current = true
    setIsSaving(true)
    try {
      await onSave(input)
      onOpenChange(false)
    } catch {
      return
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 space-y-4">
          {fields.map(({ key, label, linked, renderPicker }) => {
            const labelId = `link-records-${key}`
            return (
              <div key={key} className="space-y-1.5">
                <p id={labelId} className="text-sm font-medium">
                  {label}
                </p>
                {renderPicker({ labelId, selectedIds: selected[key] ?? [], onSelectedIdsChange: (ids) => setSelected((current) => ({ ...current, [key]: ids })), knownItems: linked })}
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <SaveButton type="button" onClick={handleSave} disabled={isSaving} isSaving={isSaving} />
          <CancelButton disabled={isSaving} onClick={() => onOpenChange(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default LinkRecordsDialog
