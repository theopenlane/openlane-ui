'use client'

import React from 'react'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { ControlSelectionDialog } from './object-association-control-dialog'

type ObjectAssociationControlsProps = {
  onIdChange?: (updatedMap: TObjectAssociationMap) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  idsMap: TObjectAssociationMap
  setIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  refMap: string[]
  setRefMap: React.Dispatch<React.SetStateAction<string[]>>
}

const ObjectAssociationControls = ({ onIdChange, open, setOpen, idsMap, setIdsMap, refMap, setRefMap }: ObjectAssociationControlsProps) => {
  const handleSave = (newIds: TObjectAssociationMap, newRefCodes: string[]) => {
    setIdsMap(newIds)
    setRefMap(newRefCodes || [])
    if (onIdChange) {
      onIdChange(newIds)
    }
  }

  const handleRemove = (id: string) => {
    const idx = idsMap.controlIDs?.indexOf(id)
    if (idx === undefined || idx === -1) return

    const newIds = idsMap.controlIDs?.filter((x) => x !== id) || []
    const newRefCodes = refMap?.filter((_, i) => i !== idx) || []

    setIdsMap({ controlIDs: newIds })
    setRefMap(newRefCodes)

    if (onIdChange) {
      onIdChange({ controlIDs: newIds })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {idsMap.controlIDs?.map((id, i) => (
          <ControlChip
            key={id}
            control={{
              id,
              refCode: refMap[i] || id,
            }}
            hideStandard
            removable
            onRemove={() => handleRemove(id)}
          />
        ))}
      </div>

      <ControlSelectionDialog open={open} onClose={() => setOpen(false)} initialData={idsMap} initialRefCodes={refMap} onSave={handleSave} />
    </div>
  )
}

export default ObjectAssociationControls
