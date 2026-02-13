'use client'

import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { UpdateRiskInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useRisk } from '@/components/pages/protected/risks/create/hooks/use-risk.tsx'
import { useUpdateRisk } from '@/lib/graphql-hooks/risks.ts'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'

type TSetObjectAssociationDialogProps = {
  riskId?: string
}

const SetObjectAssociationRisksDialog = ({ riskId }: TSetObjectAssociationDialogProps) => {
  const riskState = useRisk()
  const associationsState = useRisk((state) => state.associations)
  const initialAssociationsState = useRisk((state) => state.initialAssociations)
  const refCodeAssociationsState = useRisk((state) => state.associationRefCodes)
  const { successNotification, errorNotification } = useNotification()
  const [associations, setAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateRisk, isPending: isSaving } = useUpdateRisk()

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setAssociations({ associations: updatedMap, refCodes })
  }, [])

  const handleSave = () => {
    riskState.setAssociations(associations.associations)
    riskState.setAssociationRefCodes(associations.refCodes)
    if (riskId) {
      onSubmitHandler(associations.associations)
    } else {
      setOpen(false)
    }
  }

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

  const onSubmitHandler = async (associations: TObjectAssociationMap) => {
    try {
      const { added, removed } = getAssociationDiffs(initialAssociationsState, associations)

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

      const formData: {
        updateRiskId: string
        input: UpdateRiskInput
      } = {
        updateRiskId: riskId!,
        input: {
          ...associationInputs,
        },
      }

      await updateRisk(formData)

      successNotification({
        title: 'Risk Updated',
        description: 'Risk has been successfully updated',
      })

      setOpen(false)
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAssociations({
        associations: {},
        refCodes: {},
      })
    }
    setOpen(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <AddAssociationPlusBtn />
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Set Association</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          onIdChange={handleIdChange}
          initialData={associationsState}
          refCodeInitialData={refCodeAssociationsState}
          excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP, ObjectTypeObjects.RISK, ObjectTypeObjects.CONTROL_OBJECTIVE]}
        />
        <DialogFooter>
          <SaveButton onClick={handleSave} disabled={isSaving} />
          <CancelButton disabled={isSaving} onClick={() => setOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationRisksDialog
