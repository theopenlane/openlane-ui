'use client'

import React from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'

type TObjectAssociationControlsChipsProps = {
  form: UseFormReturn<CreateEvidenceFormData>
  // suggestedControlsMap: { id: string; refCode: string; referenceFramework: string | null }[]
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
}

const ObjectAssociationControlsChips = ({
  form,
  // suggestedControlsMap,
  evidenceControls,
  setEvidenceControls,
  evidenceSubcontrols,
  setEvidenceSubcontrols,
}: TObjectAssociationControlsChipsProps) => {
  const handleRemove2 = (id: string, refCode: string, isSubcontrol = false) => {
    if (isSubcontrol) {
      setEvidenceSubcontrols((prev) => {
        const newSubcontrols = prev?.filter((subcontrol) => subcontrol.refCode !== refCode) ?? null
        form.setValue('subcontrolIDs', newSubcontrols?.map((c) => c.id) ?? [])
        return newSubcontrols
      })
    } else {
      setEvidenceControls((prev) => {
        const newControls = prev?.filter((control) => control.refCode !== refCode) ?? null
        form.setValue('controlIDs', newControls?.map((c) => c.id) ?? [])
        return newControls
      })
    }
  }

  // const handleAdd = (id: string, isSubcontrol = false) => {
  //   console.log(id, isSubcontrol)
  // }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {evidenceControls &&
          evidenceControls.map(({ id, refCode, referenceFramework }, i) => (
            <ControlChip
              key={i}
              control={{
                id,
                refCode: refCode,
                referenceFramework: referenceFramework,
                __typename: 'Control',
              }}
              removable
              onRemove={() => handleRemove2(id, refCode)}
            />
          ))}

        {evidenceSubcontrols &&
          evidenceSubcontrols.map(({ id, refCode, referenceFramework }, i) => (
            <ControlChip
              key={i}
              control={{
                id,
                refCode: refCode,
                referenceFramework: referenceFramework,
                __typename: 'Subcontrol',
              }}
              removable
              onRemove={() => handleRemove2(id, refCode, true)}
            />
          ))}
        {/* {(form.getValues('controlIDs') || []).map((id, i) => (
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
        ))} */}
        {(form.getValues('controlIDs') || []).length === 0 && (form.getValues('subcontrolIDs') || []).length === 0 && (
          <div className="flex gap-2 items-center text-sm leading-5 font-sans font-normal">
            <TriangleAlert height={12} width={12} />
            You haven&apos;t linked any controls to this evidence, ensure at least one control is linked for proper tracking of evidence
          </div>
        )}
      </div>

      <div className="w-full my-2 border-t border color-logo-bg " />
      <div className="text-base font-medium py-2">Suggested</div>
      {/* <div className="flex flex-wrap gap-2">
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
      </div> */}
    </div>
  )
}

export default ObjectAssociationControlsChips
