'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'
import { UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useQueryClient } from '@tanstack/react-query'
import AddAssociationBtn from '@/components/shared/object-association/add-association-btn.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'

type TSetObjectAssociationDialog = {
  procedureId?: string
}

const SetObjectAssociationProceduresDialog = ({ procedureId }: TSetObjectAssociationDialog) => {
  const procedureState = useProcedure()
  const queryClient = useQueryClient()
  const associationsState = useProcedure((state) => state.associations)
  const initialAssociationsState = useProcedure((state) => state.initialAssociations)
  const refCodeAssociationsState = useProcedure((state) => state.associationRefCodes)
  const { successNotification, errorNotification } = useNotification()
  const [associations, setAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()

  const handleSave = () => {
    procedureState.setAssociations(associations.associations)
    procedureState.setAssociationRefCodes(associations.refCodes)
    if (procedureId) {
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
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedureId!,
        input: {
          ...associationInputs,
        },
      }

      await updateProcedure(formData)

      successNotification({
        title: 'Procedure Updated',
        description: 'Procedure has been successfully updated',
      })

      queryClient.invalidateQueries({ queryKey: ['procedures'] })
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId!] })
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

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setAssociations({ associations: updatedMap, refCodes })
  }, [])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <AddAssociationBtn />
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Set Association</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          onIdChange={handleIdChange}
          initialData={associationsState}
          refCodeInitialData={refCodeAssociationsState}
          excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.GROUP, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.PROCEDURE]}
        />
        <DialogFooter>
          <SaveButton onClick={handleSave} disabled={isSaving} />
          <CancelButton disabled={isSaving} onClick={() => setOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationProceduresDialog
