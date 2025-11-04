'use client'

import React, { useState } from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import AddToOrganizationDialog from '@/components/pages/protected/standards/add-to-organization-dialog'
import { useGetControlsByRefCode } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolsByRefCode } from '@/lib/graphql-hooks/subcontrol'

type TObjectAssociationControlsChipsProps = {
  form: UseFormReturn<CreateEvidenceFormData>
  suggestedControlsMap: { id: string; refCode: string; referenceFramework: string | null; source: string; typeName: 'Control' | 'Subcontrol' }[]
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
}

enum ItemType {
  Control = 'Control',
  Subcontrol = 'Subcontrol',
}

const ObjectAssociationControlsChips = ({ form, suggestedControlsMap, evidenceControls, setEvidenceControls, evidenceSubcontrols, setEvidenceSubcontrols }: TObjectAssociationControlsChipsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [standardName, setStandardName] = useState<string | null>(null)
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string; typeName: ItemType }[]>([])
  const [controlRefCodes, setControlRefCodes] = useState<string[]>([])
  const [subcontrolRefCodes, setSubcontrolRefCodes] = useState<string[]>([])

  const { data: refcodeData } = useGetControlsByRefCode({
    refCodeIn: controlRefCodes,
    enabled: controlRefCodes.length > 0,
  })

  const { data: subcontrolRefcodeData } = useGetSubcontrolsByRefCode({
    refCodeIn: subcontrolRefCodes,
    enabled: subcontrolRefCodes.length > 0,
  })

  const controlExists = (refcodeData?.controls?.edges?.length ?? 0) > 0
  const subcontrolExists = (subcontrolRefcodeData?.subcontrols?.edges?.length ?? 0) > 0
  const handleRemove = (id: string, refCode: string, isSubcontrol = false) => {
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

  const handleAdd = (id: string, isSubcontrol = false, refCode: string, source: string, referenceFramework: string | null) => {
    const newRefCodes = [refCode]
    if (source === 'SUGGESTED') {
      setStandardName(referenceFramework)
      setSelectedControls([{ id, refCode, typeName: isSubcontrol ? ItemType.Subcontrol : ItemType.Control }])
      if (isSubcontrol) {
        setSubcontrolRefCodes(newRefCodes)
        console.log('subcontrolExists', subcontrolExists)
      } else {
        setControlRefCodes(newRefCodes)
        console.log('controlExists', controlExists)
      }
      //if non existent, call dialog and add it
    } else console.log('Adding not suggested item...', { id, isSubcontrol, refCode, source, referenceFramework })
  }

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
              onRemove={() => handleRemove(id, refCode)}
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
              onRemove={() => handleRemove(id, refCode, true)}
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
          .filter((c) => {
            const inControls = evidenceControls?.some((item) => item.refCode === c.refCode)
            const inSubcontrols = evidenceSubcontrols?.some((item) => item.refCode === c.refCode)
            return !inControls && !inSubcontrols
          })
          .map(({ id, refCode, referenceFramework, typeName, source }) => (
            <ControlChip
              key={id}
              control={{
                id,
                refCode,
                referenceFramework,
                __typename: typeName,
              }}
              canAdd
              onAdd={() => handleAdd(id, typeName === ItemType.Control ? false : true, refCode, source, referenceFramework)}
            />
          ))}
      </div>
      <AddToOrganizationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} selectedControls={selectedControls.length > 0 ? selectedControls : []} standardName={standardName ?? undefined} />
    </div>
  )
}

export default ObjectAssociationControlsChips
