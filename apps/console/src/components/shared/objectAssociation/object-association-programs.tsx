import React from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'

type ObjectAssociationProgramsProps = {
  refMap: string[]
  setRefMap: React.Dispatch<React.SetStateAction<string[]>>
  form: UseFormReturn<CreateEvidenceFormData>
}

const ObjectAssociationPrograms: React.FC<ObjectAssociationProgramsProps> = ({ refMap, setRefMap, form }: ObjectAssociationProgramsProps) => {
  const handleRemove = (id: string) => {
    const idx = form.getValues('programIDs')?.indexOf(id)
    if (idx === undefined || idx === -1) return

    const newIds = form.getValues('programIDs')?.filter((x) => x !== id) || []
    const newRefCodes = refMap.filter((_, i) => i !== idx) || []

    form.setValue('programIDs', newIds)
    setRefMap(newRefCodes)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {(form.getValues('programIDs') || []).map((id, i) => (
          <ControlChip key={id} control={{ id, refCode: refMap[i] ?? id }} hideStandard removable onRemove={() => handleRemove(id)} />
        ))}
      </div>
    </div>
  )
}

export default ObjectAssociationPrograms
