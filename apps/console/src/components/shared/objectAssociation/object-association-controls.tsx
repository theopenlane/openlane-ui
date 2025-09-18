'use client'

import React from 'react'
import { TObjectAssociationMap } from './types/TObjectAssociationMap'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { ControlSelectionDialog } from './object-association-control-dialog'

type ObjectAssociationControlsProps = {
  onIdChange?: (updatedMap: TObjectAssociationMap) => void
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  controlIdsMap: TObjectAssociationMap
  setControlIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  subcontrolIdsMap: TObjectAssociationMap
  setSubcontrolIdsMap: React.Dispatch<React.SetStateAction<TObjectAssociationMap>>
  controlsRefMap: string[]
  setControlsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  frameworksMap: Record<string, string>
  setFrameworksMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
  subcontrolsRefMap: string[]
  setSubcontrolsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  subcontrolFrameworksMap: Record<string, string>
  setSubcontrolsFrameworksMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
}

const ObjectAssociationControls = ({
  onIdChange,
  open,
  setOpen,
  controlIdsMap,
  subcontrolIdsMap,
  setSubcontrolIdsMap,
  setControlIdsMap,
  controlsRefMap,
  setControlsRefMap,
  frameworksMap,
  setFrameworksMap,
  subcontrolsRefMap,
  setSubcontrolsRefMap,
  subcontrolFrameworksMap,
  setSubcontrolsFrameworksMap,
}: ObjectAssociationControlsProps) => {
  const handleSave = (newIds: TObjectAssociationMap, newRefCodes: string[], frameworks: Record<string, string>) => {
    setControlIdsMap(newIds)
    setControlsRefMap(newRefCodes || [])
    setFrameworksMap((prev) => ({
      ...(prev || {}),
      ...(frameworks || {}),
    }))
    if (onIdChange) {
      onIdChange(newIds)
    }
  }

  const handleRemove = (id: string, isSubcontrol = false) => {
    if (isSubcontrol) {
      const idx = subcontrolIdsMap.subcontrolIDs?.indexOf(id)
      if (idx === undefined || idx === -1) return

      const newIds = subcontrolIdsMap.subcontrolIDs?.filter((x) => x !== id) || []
      const newRefCodes = subcontrolsRefMap?.filter((_, i) => i !== idx) || []
      const newFrameworks = Object.fromEntries(Object.entries(subcontrolFrameworksMap).filter(([key]) => key !== id))

      setSubcontrolIdsMap({ subcontrolIDs: newIds })
      setSubcontrolsRefMap(newRefCodes)
      setSubcontrolsFrameworksMap(newFrameworks)
    } else {
      const idx = controlIdsMap.controlIDs?.indexOf(id)
      if (idx === undefined || idx === -1) return

      const newIds = controlIdsMap.controlIDs?.filter((x) => x !== id) || []
      const newRefCodes = controlsRefMap?.filter((_, i) => i !== idx) || []
      const newFrameworks = Object.fromEntries(Object.entries(frameworksMap).filter(([key]) => key !== id))

      setControlIdsMap({ controlIDs: newIds })
      setControlsRefMap(newRefCodes)
      setFrameworksMap(newFrameworks)

      if (onIdChange) {
        onIdChange({ controlIDs: newIds })
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {controlIdsMap.controlIDs?.map((id, i) => (
          <ControlChip
            key={id}
            control={{
              id,
              refCode: controlsRefMap[i] || id,
              referenceFramework: frameworksMap[id] || '',
            }}
            removable
            onRemove={() => handleRemove(id)}
          />
        ))}

        {subcontrolIdsMap.subcontrolIDs?.map((id, i) => (
          <ControlChip
            key={id}
            control={{
              id,
              refCode: subcontrolsRefMap[i] || id,
              referenceFramework: subcontrolFrameworksMap[id] || '',
            }}
            removable
            onRemove={() => handleRemove(id, true)}
          />
        ))}
      </div>

      <ControlSelectionDialog
        open={open}
        onClose={() => setOpen(false)}
        initialFramework={frameworksMap}
        initialControlData={controlIdsMap}
        initialControlRefCodes={controlsRefMap}
        onSave={handleSave}
      />
    </div>
  )
}

export default ObjectAssociationControls
