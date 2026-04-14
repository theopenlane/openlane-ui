'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useMemo } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useProcedure } from '@/components/pages/protected/procedures/create/hooks/use-procedure.tsx'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedure'
import { useQueryClient } from '@tanstack/react-query'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { useAssociationDialog } from '@/components/shared/object-association/hooks/use-association-dialog'

type TSetObjectAssociationDialog = {
  procedureId?: string
}

const SetObjectAssociationProceduresDialog = ({ procedureId }: TSetObjectAssociationDialog) => {
  const procedureState = useProcedure()
  const queryClient = useQueryClient()
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()

  const onSave = useCallback(
    async (associationInputs: Record<string, string[]>) => {
      await updateProcedure({
        updateProcedureId: procedureId ?? '',
        input: { ...associationInputs },
      })
      queryClient.invalidateQueries({ queryKey: ['procedures'] })
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] })
    },
    [updateProcedure, procedureId, queryClient],
  )

  const onStateSave = useCallback(
    (associations: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
      procedureState.setInitialAssociations(associations)
      procedureState.setAssociations(associations)
      procedureState.setAssociationRefCodes(refCodes)
    },
    [procedureState],
  )

  const successMessage = useMemo(() => ({ title: 'Procedure Updated', description: 'Procedure has been successfully updated' }), [])

  const { open, hasChanges, handleDialogChange, handleIdChange, handleSave, associationsState, refCodeAssociationsState } = useAssociationDialog({
    associationsState: useProcedure((state) => state.associations),
    initialAssociationsState: useProcedure((state) => state.initialAssociations),
    refCodeAssociationsState: useProcedure((state) => state.associationRefCodes),
    entityId: procedureId,
    onSave,
    onStateSave,
    successMessage,
  })

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
          allowedObjectTypes={[ObjectTypeObjects.CONTROL, ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROGRAM, ObjectTypeObjects.RISK, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.TASK]}
        />
        <DialogFooter>
          <SaveButton onClick={handleSave} disabled={isSaving || !hasChanges} />
          <CancelButton disabled={isSaving} onClick={() => handleDialogChange(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationProceduresDialog
