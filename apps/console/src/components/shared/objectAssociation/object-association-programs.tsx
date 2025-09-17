import React from 'react'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import { ProgramSelectionDialog } from './object-association-programs-dialog'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'

type ObjectAssociationProgramsProps = {
  onIdChange?: (updatedMap: TObjectAssociationMap) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  idsMap: TObjectAssociationMap
  setIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  refMap: TObjectAssociationMap
  setRefMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
}

const ObjectAssociationPrograms: React.FC<ObjectAssociationProgramsProps> = ({ onIdChange, open, setOpen, idsMap, setIdsMap, refMap, setRefMap }: ObjectAssociationProgramsProps) => {
  const handleSave = (newIds: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => {
    console.log('obj', { newIds: newIds, newRefCodes: newRefCodes })
    setIdsMap(newIds)
    setRefMap({ programDisplayIDs: newRefCodes.programIDs })
    if (onIdChange) {
      onIdChange(newIds)
    }
  }

  const handleRemove = (id: string) => {
    const idx = idsMap.programIDs?.indexOf(id)
    if (idx === undefined || idx === -1) return

    const newIds = idsMap.programIDs?.filter((x) => x !== id) || []
    const newRefCodes = refMap.programDisplayIDs?.filter((_, i) => i !== idx) || []

    setIdsMap({ programIDs: newIds })
    setRefMap({ programDisplayIDs: newRefCodes })

    if (onIdChange) {
      onIdChange({ programIDs: newIds })
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {idsMap.programIDs?.map((id, i) => <ControlChip key={id} control={{ id, refCode: refMap.programDisplayIDs?.[i] ?? id }} hideStandard removable onRemove={() => handleRemove(id)} />)}
      </div>

      <ProgramSelectionDialog open={open} onClose={() => setOpen(false)} initialData={idsMap} initialRefCodes={refMap} onSave={handleSave} />
    </div>
  )
}

export default ObjectAssociationPrograms
