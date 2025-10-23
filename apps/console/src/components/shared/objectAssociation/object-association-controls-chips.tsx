'use client'

import React from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'

type TObjectAssociationControlsChipsProps = {
  controlsRefMap: string[]
  setControlsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  frameworksMap: Record<string, string>
  setFrameworksMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
  subcontrolsRefMap: string[]
  setSubcontrolsRefMap: React.Dispatch<React.SetStateAction<string[]>>
  subcontrolFrameworksMap: Record<string, string>
  setSubcontrolsFrameworksMap: React.Dispatch<React.SetStateAction<Record<string, string>>>
  form: UseFormReturn<CreateEvidenceFormData>
  suggestedControlsMap: { id: string; refCode: string; referenceFramework: string | null }[]
}

const ObjectAssociationControlsChips = ({
  controlsRefMap,
  setControlsRefMap,
  frameworksMap,
  setFrameworksMap,
  subcontrolsRefMap,
  setSubcontrolsRefMap,
  subcontrolFrameworksMap,
  setSubcontrolsFrameworksMap,
  form,
  suggestedControlsMap,
}: TObjectAssociationControlsChipsProps) => {
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

  const handleAdd = (id: string, isSubcontrol = false) => {
    console.log(id, isSubcontrol)
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
              __typename: 'Control',
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
              __typename: 'Subcontrol',
            }}
            removable
            onRemove={() => handleRemove(id, true)}
          />
        ))}
        {(form.getValues('controlIDs') || []).length === 0 && (form.getValues('subcontrolIDs') || []).length === 0 && (
          <div className="flex gap-2 items-center text-sm leading-5 font-sans font-normal">
            <TriangleAlert height={12} width={12} />
            You haven&apos;t linked any controls to this evidence, ensure at least one control is linked for proper tracking of evidence
          </div>
        )}
      </div>

      <div className="w-full my-2 border-t border color-logo-bg " />
      <div className="text-base font-medium py-2">Suggested</div>
      <div className="flex flex-wrap gap-2">
        {suggestedControlsMap
          .filter((c) => !controlsRefMap.includes(c.refCode) && !subcontrolsRefMap.includes(c.refCode))
          .map(({ id, refCode, referenceFramework }) => (
            <ControlChip
              key={id}
              control={{
                id,
                refCode,
                referenceFramework,
                __typename: referenceFramework ? 'Control' : 'Subcontrol',
              }}
              canAdd
              onAdd={() => handleAdd(id, !referenceFramework)}
            />
          ))}
      </div>
    </div>
  )
}

export default ObjectAssociationControlsChips
