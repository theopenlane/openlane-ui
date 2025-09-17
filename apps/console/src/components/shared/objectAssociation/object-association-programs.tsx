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
  const [idsMap, setIdsMap] = useState<TObjectAssociationMap>(initialData?.programIDs ? { programIDs: [...initialData.programIDs] } : { programIDs: [] })
  const [refMap, setRefMap] = useState<TObjectAssociationMap>(initialData?.programDisplayIDs ? { programIDs: [...initialData.programDisplayIDs] } : { programIDs: [] })
  const handleSave = (newIds: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => {
    setIdsMap(newIds)
    setRefMap(newRefCodes)
    if (onIdChange) {
      onIdChange(newIds)
    }
  }

  const handleRemove = (id: string) => {
    const idx = idsMap.programIDs?.indexOf(id)
    if (idx === undefined || idx === -1) return

    const newIds = idsMap.programIDs?.filter((x) => x !== id) || []
    const newRefCodes = refMap.programIDs?.filter((_, i) => i !== idx) || []

    setIdsMap({ programIDs: newIds })
    setRefMap({ programIDs: newRefCodes })

    if (onIdChange) {
      onIdChange({ programIDs: newIds })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {idsMap.programIDs?.map((id, i) => (
          <ControlChip
            key={id}
            control={{
              id,
              refCode: refMap.programIDs?.[i] || id,
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
