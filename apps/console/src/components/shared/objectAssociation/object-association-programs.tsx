import React, { useState } from 'react'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { ProgramSelectionDialog } from './object-association-programs-dialog'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'

type ObjectAssociationProgramsProps = {
  onIdChange?: (updatedMap: TObjectAssociationMap) => void
  initialData?: TObjectAssociationMap
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const ObjectAssociationPrograms: React.FC<ObjectAssociationProgramsProps> = ({ onIdChange, initialData, open, setOpen }: ObjectAssociationProgramsProps) => {
  const [idsMap, setIdsMap] = useState<TObjectAssociationMap>(initialData?.controlIDs ? { controlIDs: [...initialData.controlIDs] } : { controlIDs: [] })
  const [refMap, setRefMap] = useState<TObjectAssociationMap>(initialData?.controlRefCodes ? { controlIDs: [...initialData.controlRefCodes] } : { controlIDs: [] })
  const handleSave = (newIds: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => {
    setIdsMap(newIds)
    setRefMap(newRefCodes)
    if (onIdChange) {
      onIdChange(newIds)
    }
  }

  const handleRemove = (id: string) => {
    const idx = idsMap.controlIDs?.indexOf(id)
    if (idx === undefined || idx === -1) return

    const newIds = idsMap.controlIDs?.filter((x) => x !== id) || []
    const newRefCodes = refMap.controlIDs?.filter((_, i) => i !== idx) || []

    setIdsMap({ controlIDs: newIds })
    setRefMap({ controlIDs: newRefCodes })

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
              refCode: refMap.controlIDs?.[i] || id,
            }}
            hideStandard
            removable
            onRemove={() => handleRemove(id)}
          />
        ))}
      </div>

      <ProgramSelectionDialog open={open} onClose={() => setOpen(false)} initialData={idsMap} initialRefCodes={refMap} onSave={handleSave} />
    </div>
  )
}

export default ObjectAssociationPrograms
