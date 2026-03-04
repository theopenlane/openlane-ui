'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type UpdateProcedureInput } from '@repo/codegen/src/schema.ts'
import { useUpdateProcedure } from '@/lib/graphql-hooks/procedure'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useQueryClient } from '@tanstack/react-query'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { getAssociationInput } from '@/components/shared/object-association/utils'

type TSetObjectAssociationDialog = {
  procedureId?: string
  associations?: TObjectAssociationMap
  initialAssociations?: TObjectAssociationMap
  associationRefCodes?: TObjectAssociationMap
  onAssociationsChange?: (newAssociations: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => void
}

const EMPTY_ASSOCIATIONS = {} as TObjectAssociationMap

const SetObjectAssociationProceduresDialog = ({ procedureId, associations: parentAssociations, initialAssociations, associationRefCodes, onAssociationsChange }: TSetObjectAssociationDialog) => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const normalizedAssociations = parentAssociations ?? EMPTY_ASSOCIATIONS
  const normalizedInitialAssociations = initialAssociations ?? EMPTY_ASSOCIATIONS
  const normalizedAssociationRefCodes = associationRefCodes ?? EMPTY_ASSOCIATIONS
  const [localAssociations, setLocalAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateProcedure, isPending: isSaving } = useUpdateProcedure()

  const handleSave = () => {
    onAssociationsChange?.(localAssociations.associations, localAssociations.refCodes)
    if (procedureId) {
      onSubmitHandler(localAssociations.associations)
    } else {
      setOpen(false)
    }
  }

  const onSubmitHandler = async (newAssociations: TObjectAssociationMap) => {
    try {
      const associationInputs = getAssociationInput(normalizedInitialAssociations, newAssociations)

      const formData: {
        updateProcedureId: string
        input: UpdateProcedureInput
      } = {
        updateProcedureId: procedureId ?? '',
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
      queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] })
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
      setLocalAssociations({
        associations: {},
        refCodes: {},
      })
    }
    setOpen(isOpen)
  }

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setLocalAssociations({ associations: updatedMap, refCodes })
  }, [])

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
          initialData={normalizedAssociations}
          refCodeInitialData={normalizedAssociationRefCodes}
          allowedObjectTypes={[ObjectTypeObjects.CONTROL, ObjectTypeObjects.INTERNAL_POLICY, ObjectTypeObjects.PROGRAM, ObjectTypeObjects.RISK, ObjectTypeObjects.SUB_CONTROL, ObjectTypeObjects.TASK]}
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
