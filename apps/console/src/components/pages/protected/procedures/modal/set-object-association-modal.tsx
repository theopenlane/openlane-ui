'use client'

import ObjectAssociation from '@/components/shared/objectAssociation/object-association'
import { Button } from '@repo/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/objectAssociation/object-assoiation-config'
import { TObjectAssociationMap } from '@/components/shared/objectAssociation/types/TObjectAssociationMap'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'
import { UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedures.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useQueryClient } from '@tanstack/react-query'

type TSetObjectAssociationDialog = {
  procedureId?: string
}

const SetObjectAssociationDialog: React.FC<TSetObjectAssociationDialog> = ({ procedureId }) => {
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
      errorNotification({
        title: 'Error',
        description: 'There was an error updating the procedure. Please try again.',
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
        <Button className="h-8 !px-2">Set Association</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Set Association</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          onIdChange={(updatedMap, refCodes) => {
            setAssociations({ associations: updatedMap, refCodes: refCodes })
          }}
          initialData={associationsState}
          refCodeInitialData={refCodeAssociationsState}
          excludeObjectTypes={[ObjectTypeObjects.EVIDENCE, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.GROUP, ObjectTypeObjects.CONTROL_OBJECTIVE, ObjectTypeObjects.PROCEDURE]}
        />
        <DialogFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            Save
          </Button>
          <Button variant="outline" disabled={isSaving} onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationDialog
