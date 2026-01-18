'use client'

import { useGetControlAssociationsById, useUpdateControl } from '@/lib/graphql-hooks/controls'
import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { useGetSubcontrolAssociationsById } from '@/lib/graphql-hooks/subcontrol'
import { useUpdateSubcontrol } from '@/lib/graphql-hooks/subcontrol'
import AddAssociationBtn from '@/components/shared/object-association/add-association-btn.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

export function SetObjectAssociationDialog() {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const isControl = subcontrolId ? false : !!id
  const isSubcontrol = !!subcontrolId

  const { mutateAsync: updateControl } = useUpdateControl()
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()

  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [saveEnabled, setSaveEnabled] = useState(false)

  const { errorNotification, successNotification } = useNotification()
  const { data: controlAssociationsData } = useGetControlAssociationsById(id)
  const { data: subcontrolAssociationsData } = useGetSubcontrolAssociationsById(isSubcontrol ? subcontrolId : null)

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (isControl && controlAssociationsData?.control) {
      return {
        programIDs: (controlAssociationsData.control.programs?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        taskIDs: (controlAssociationsData.control.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        riskIDs: (controlAssociationsData.control.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        procedureIDs: (controlAssociationsData.control.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        internalPolicyIDs: (controlAssociationsData.control.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      }
    }

    if (!isControl && subcontrolAssociationsData?.subcontrol) {
      return {
        taskIDs: (subcontrolAssociationsData.subcontrol.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        riskIDs: (subcontrolAssociationsData.subcontrol.risks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        procedureIDs: (subcontrolAssociationsData.subcontrol.procedures?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
        internalPolicyIDs: (subcontrolAssociationsData.subcontrol.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      }
    }

    return {}
  }, [isControl, subcontrolAssociationsData, controlAssociationsData])

  function getAssociationDiffs(initial: TObjectAssociationMap, current: TObjectAssociationMap): { added: TObjectAssociationMap; removed: TObjectAssociationMap } {
    const added: TObjectAssociationMap = {}
    const removed: TObjectAssociationMap = {}

    const allKeys = new Set([...Object.keys(initial), ...Object.keys(current)])

    for (const key of allKeys) {
      const initialSet = new Set(initial[key] ?? [])
      const currentSet = new Set(current[key] ?? [])

      const addedItems = [...currentSet].filter((id) => !initialSet.has(id))
      const removedItems = [...initialSet].filter((id) => !currentSet.has(id))

      if (addedItems.length > 0) {
        added[key] = addedItems
      }
      if (removedItems.length > 0) {
        removed[key] = removedItems
      }
    }

    return { added, removed }
  }

  const onSave = async () => {
    setIsSaving(true)
    try {
      const { added, removed } = getAssociationDiffs(initialData, associations)

      const buildMutationKey = (prefix: string, key: string) => `${prefix}${key.charAt(0).toUpperCase()}${key.slice(1)}`

      const associationInputs = {
        ...Object.entries(added).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('add', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),

        ...Object.entries(removed).reduce(
          (acc, [key, ids]) => {
            if (ids && ids.length > 0) {
              acc[buildMutationKey('remove', key)] = ids
            }
            return acc
          },
          {} as Record<string, string[]>,
        ),
      }

      if (isControl) {
        await updateControl({
          updateControlId: id!,
          input: associationInputs,
        })
      } else {
        await updateSubcontrol({
          updateSubcontrolId: subcontrolId!,
          input: associationInputs,
        })
      }

      successNotification({ title: `${isControl ? 'Control' : 'Subcontrol'} updated` })
      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAssociations({})
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger>
        <AddAssociationBtn />
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          onIdChange={(updatedMap) => {
            setSaveEnabled(saveEnabled)
            setAssociations(updatedMap)
          }}
          initialData={initialData}
          excludeObjectTypes={[
            ObjectTypeObjects.EVIDENCE,
            ObjectTypeObjects.SUB_CONTROL,
            ObjectTypeObjects.CONTROL,
            ObjectTypeObjects.CONTROL_OBJECTIVE,
            ObjectTypeObjects.GROUP,
            ...(isSubcontrol ? [ObjectTypeObjects.PROGRAM] : []),
          ]}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton onClick={() => setOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
