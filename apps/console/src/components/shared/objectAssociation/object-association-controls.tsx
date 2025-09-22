'use client'

import React from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

type ObjectAssociationControlsProps = {
  controlsRefMap: string[]
  setControlsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  frameworksMap: Record<string, string>
  setFrameworksMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
  subcontrolsRefMap: string[]
  setSubcontrolsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  subcontrolFrameworksMap: Record<string, string>
  setSubcontrolsFrameworksMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
  form: UseFormReturn<CreateEvidenceFormData>
}

const ObjectAssociationControls = ({
  controlsRefMap,
  setControlsRefMap,
  frameworksMap,
  setFrameworksMap,
  subcontrolsRefMap,
  setSubcontrolsRefMap,
  subcontrolFrameworksMap,
  setSubcontrolsFrameworksMap,
  form,
}: ObjectAssociationControlsProps) => {
  const handleRemove = (id: string, isSubcontrol = false) => {
    if (isSubcontrol) {
      const idx = form.getValues('subcontrolIDs')?.indexOf(id)
      if (idx === undefined || idx === -1) return

      const newIds = form.getValues('subcontrolIDs')?.filter((x) => x !== id) || []
      const newRefCodes = subcontrolsRefMap?.filter((_, i) => i !== idx) || []
      const newFrameworks = Object.fromEntries(Object.entries(subcontrolFrameworksMap).filter(([key]) => key !== id))

      form.setValue('subcontrolIDs', newIds)
      setSubcontrolsRefMap(newRefCodes)
      setSubcontrolsFrameworksMap(newFrameworks)
    } else {
      const idx = form.getValues('controlIDs')?.indexOf(id)
      if (idx === undefined || idx === -1) return

      const newIds = form.getValues('controlIDs')?.filter((x) => x !== id) || []
      const newRefCodes = controlsRefMap?.filter((_, i) => i !== idx) || []
      const newFrameworks = Object.fromEntries(Object.entries(frameworksMap).filter(([key]) => key !== id))

      form.setValue('controlIDs', newIds)
      setControlsRefMap(newRefCodes)
      setFrameworksMap(newFrameworks)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {(form.getValues('controlIDs') || []).map((id, i) => (
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

        {(form.getValues('subcontrolIDs') || []).map((id, i) => (
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
    </div>
  )
}

export default ObjectAssociationControls
