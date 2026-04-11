'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useEffect, useMemo } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { usePolicy } from '@/components/pages/protected/policies/create/hooks/use-policy.tsx'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { useAssociationDialog } from '@/components/shared/object-association/hooks/use-association-dialog'

type TSetObjectAssociationDialogProps = {
  policyId?: string
  fromTable?: boolean // if from table open automatically without trigger
  onClose?: () => void
}

const SetObjectAssociationPoliciesDialog = ({ policyId, fromTable = false, onClose }: TSetObjectAssociationDialogProps) => {
  const policyState = usePolicy()
  const queryClient = useQueryClient()
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()

  const allowedObjectTypes = fromTable
    ? [ObjectTypeObjects.PROCEDURE]
    : [
        ObjectTypeObjects.ASSET,
        ObjectTypeObjects.CONTROL,
        ObjectTypeObjects.CONTROL_OBJECTIVE,
        ObjectTypeObjects.ENTITY,
        ObjectTypeObjects.IDENTITY_HOLDER,
        ObjectTypeObjects.PROCEDURE,
        ObjectTypeObjects.PROGRAM,
        ObjectTypeObjects.RISK,
        ObjectTypeObjects.SUB_CONTROL,
        ObjectTypeObjects.TASK,
      ]

  const onSave = useCallback(
    async (associationInputs: Record<string, string[]>) => {
      await updatePolicy({
        updateInternalPolicyId: policyId ?? '',
        input: { ...associationInputs },
      })
      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
    },
    [updatePolicy, policyId, queryClient],
  )

  const onStateSave = useCallback(
    (associations: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
      policyState.setInitialAssociations(associations)
      policyState.setAssociations(associations)
      policyState.setAssociationRefCodes(refCodes)
    },
    [policyState],
  )

  const successMessage = useMemo(() => ({ title: 'Policy Updated', description: 'Policy has been successfully updated' }), [])

  const { open, setOpen, hasChanges, handleDialogChange: baseHandleDialogChange, handleIdChange, handleSave, associationsState, refCodeAssociationsState } = useAssociationDialog({
    associationsState: usePolicy((state) => state.associations),
    initialAssociationsState: usePolicy((state) => state.initialAssociations),
    refCodeAssociationsState: usePolicy((state) => state.associationRefCodes),
    entityId: policyId,
    onSave,
    onStateSave,
    successMessage,
  })

  const handleDialogChange = useCallback(
    (isOpen: boolean) => {
      baseHandleDialogChange(isOpen)
      if (!isOpen) {
        onClose?.()
      }
    },
    [baseHandleDialogChange, onClose],
  )

  useEffect(() => {
    if (!!policyId && !!fromTable) {
      setOpen(true)
    }
  }, [fromTable, policyId, setOpen])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      {!fromTable && (
        <DialogTrigger asChild>
          <AddAssociationPlusBtn />
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl p-6 space-y-4">
        <DialogHeader>
          <DialogTitle>Set Association</DialogTitle>
        </DialogHeader>
        <ObjectAssociation
          onIdChange={handleIdChange}
          initialData={associationsState}
          refCodeInitialData={refCodeAssociationsState}
          allowedObjectTypes={allowedObjectTypes}
          defaultSelectedObject={fromTable ? ObjectTypeObjects.PROCEDURE : undefined}
        />
        <DialogFooter>
          <SaveButton onClick={handleSave} isSaving={isSaving} disabled={isSaving || !hasChanges} />
          <CancelButton disabled={isSaving} onClick={() => handleDialogChange(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationPoliciesDialog
