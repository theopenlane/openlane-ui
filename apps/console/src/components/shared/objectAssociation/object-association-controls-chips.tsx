'use client'

import React, { useState } from 'react'
import ControlChip from '@/components/pages/protected/controls/map-controls/shared/control-chip'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { TriangleAlert } from 'lucide-react'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'
import { useGetControlsByRefCode } from '@/lib/graphql-hooks/controls'
import { useGetSubcontrolsByRefCode } from '@/lib/graphql-hooks/subcontrol'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useCloneControls } from '@/lib/graphql-hooks/standards'
import { useNotification } from '@/hooks/useNotification'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'

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
  const [selectedControls, setSelectedControls] = useState<{ id: string; refCode: string; typeName: ItemType }[]>([])
  const [pendingAdd, setPendingAdd] = useState<{
    id: string
    isSubcontrol: boolean
    refCode: string
    referenceFramework: string | null
  } | null>(null)
  const [controlRefCodes, setControlRefCodes] = useState<string[]>([])
  const [subcontrolRefCodes, setSubcontrolRefCodes] = useState<string[]>([])
  const { mutateAsync: cloneControls } = useCloneControls()
  const { successNotification, errorNotification } = useNotification()
  const queryClient = useQueryClient()

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

  const addEvidenceControl = (id: string, isSubcontrol: boolean, refCode: string, referenceFramework: string | null) => {
    if (isSubcontrol) {
      setEvidenceSubcontrols((prev) => {
        const updatedSubcontrols = [...(prev ?? []), { __typename: ItemType.Subcontrol, id, referenceFramework, refCode }]
        const currentIds = form.getValues('subcontrolIDs') ?? []
        const updatedIds = currentIds.includes(id) ? currentIds : [...currentIds, id]
        form.setValue('subcontrolIDs', updatedIds, { shouldValidate: true, shouldDirty: true })
        return updatedSubcontrols
      })
    } else {
      setEvidenceControls((prev) => {
        const updatedControls = [...(prev ?? []), { __typename: ItemType.Control, id, referenceFramework, refCode }]
        const currentIds = form.getValues('controlIDs') ?? []
        const updatedIds = currentIds.includes(id) ? currentIds : [...currentIds, id]
        form.setValue('controlIDs', updatedIds, { shouldValidate: true, shouldDirty: true })
        return updatedControls
      })
    }
  }

  const handleAdd = (id: string, isSubcontrol = false, refCode: string, source: string, referenceFramework: string | null) => {
    const newRefCodes = [refCode]

    if (source === 'SUGGESTED') {
      const typeName = isSubcontrol ? ItemType.Subcontrol : ItemType.Control
      setSelectedControls([{ id, refCode, typeName }])
      setPendingAdd({ id, isSubcontrol, refCode, referenceFramework })

      if (isSubcontrol) {
        setSubcontrolRefCodes(newRefCodes)
      } else {
        setControlRefCodes(newRefCodes)
      }

      if ((isSubcontrol && !subcontrolExists) || (!isSubcontrol && !controlExists)) {
        setIsDialogOpen(false)
        requestAnimationFrame(() => setIsDialogOpen(true))
        return
      }
    }
    addEvidenceControl(id, isSubcontrol, refCode, referenceFramework)
  }

  const handleConfirmAdd = async () => {
    if (!pendingAdd) return

    const { id, isSubcontrol, refCode, referenceFramework } = pendingAdd

    try {
      await cloneControls({
        input: {
          programID: undefined,
          controlIDs: [id],
        },
      })

      addEvidenceControl(id, isSubcontrol, refCode, referenceFramework)

      queryClient.invalidateQueries({ queryKey: ['controls'] })
      queryClient.invalidateQueries({ queryKey: ['subcontrols'] })

      successNotification({ title: 'Controls added to organization successfully!' })
      setIsDialogOpen(false)
      setPendingAdd(null) // clear pending
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
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
      <ConfirmationDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmAdd}
        title={`Clone ${selectedControls[0]?.refCode}?`}
        description={
          <>
            This {selectedControls[0]?.typeName === ItemType.Control ? 'Control' : 'Subcontrol'} (<b>{selectedControls[0]?.refCode}</b>) is not in your organization, would you like to add it now?
          </>
        }
        confirmationText="Remove"
        confirmationTextVariant="destructive"
      />
    </div>
  )
}

export default ObjectAssociationControlsChips
