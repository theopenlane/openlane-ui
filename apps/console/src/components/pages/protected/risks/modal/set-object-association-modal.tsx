'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useMemo } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useRisk } from '@/components/pages/protected/risks/create/hooks/use-risk.tsx'
import { useUpdateRisk } from '@/lib/graphql-hooks/risk'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { useAssociationDialog } from '@/components/shared/object-association/hooks/use-association-dialog'

type TSetObjectAssociationDialogProps = {
  riskId?: string
}

const SetObjectAssociationRisksDialog = ({ riskId }: TSetObjectAssociationDialogProps) => {
  const riskState = useRisk()
  const { mutateAsync: updateRisk, isPending: isSaving } = useUpdateRisk()

  const onSave = useCallback(
    async (associationInputs: Record<string, string[]>) => {
      await updateRisk({
        updateRiskId: riskId ?? '',
        input: { ...associationInputs },
      })
    },
    [updateRisk, riskId],
  )

  const onStateSave = useCallback(
    (associations: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
      riskState.setInitialAssociations(associations)
      riskState.setAssociations(associations)
      riskState.setAssociationRefCodes(refCodes)
    },
    [riskState],
  )

  const successMessage = useMemo(() => ({ title: 'Risk Updated', description: 'Risk has been successfully updated' }), [])

  const { open, hasChanges, handleDialogChange, handleIdChange, handleSave, associationsState, refCodeAssociationsState } = useAssociationDialog({
    associationsState: useRisk((state) => state.associations),
    initialAssociationsState: useRisk((state) => state.initialAssociations),
    refCodeAssociationsState: useRisk((state) => state.associationRefCodes),
    entityId: riskId,
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
          allowedObjectTypes={[
            ObjectTypeObjects.ACTION_PLAN,
            ObjectTypeObjects.ASSET,
            ObjectTypeObjects.CONTROL,
            ObjectTypeObjects.ENTITY,
            ObjectTypeObjects.INTERNAL_POLICY,
            ObjectTypeObjects.PROCEDURE,
            ObjectTypeObjects.PROGRAM,
            ObjectTypeObjects.SCAN,
            ObjectTypeObjects.SUB_CONTROL,
            ObjectTypeObjects.TASK,
          ]}
        />
        <DialogFooter>
          <SaveButton onClick={handleSave} disabled={isSaving || !hasChanges} />
          <CancelButton disabled={isSaving} onClick={() => handleDialogChange(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationRisksDialog
