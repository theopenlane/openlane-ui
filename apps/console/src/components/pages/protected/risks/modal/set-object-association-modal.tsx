'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { UpdateRiskInput } from '@repo/codegen/src/schema.ts'
import { useNotification } from '@/hooks/useNotification.tsx'
import { useUpdateRisk } from '@/lib/graphql-hooks/risk'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { getAssociationInput } from '@/components/shared/object-association/utils'

type TSetObjectAssociationDialogProps = {
  riskId?: string
  associations?: TObjectAssociationMap
  initialAssociations?: TObjectAssociationMap
  associationRefCodes?: TObjectAssociationMap
  onAssociationsChange?: (newAssociations: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => void
}

const SetObjectAssociationRisksDialog = ({
  riskId,
  associations: parentAssociations = {},
  initialAssociations = {},
  associationRefCodes = {},
  onAssociationsChange,
}: TSetObjectAssociationDialogProps) => {
  const { successNotification, errorNotification } = useNotification()
  const [localAssociations, setLocalAssociations] = useState<{
    associations: TObjectAssociationMap
    refCodes: TObjectAssociationMap
  }>({
    associations: {},
    refCodes: {},
  })
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateRisk, isPending: isSaving } = useUpdateRisk()

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setLocalAssociations({ associations: updatedMap, refCodes })
  }, [])

  const handleSave = () => {
    onAssociationsChange?.(localAssociations.associations, localAssociations.refCodes)
    if (riskId) {
      onSubmitHandler(localAssociations.associations)
    } else {
      setOpen(false)
    }
  }

  const onSubmitHandler = async (newAssociations: TObjectAssociationMap) => {
    try {
      const associationInputs = getAssociationInput(initialAssociations, newAssociations)

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
      setLocalAssociations({
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
          initialData={parentAssociations}
          refCodeInitialData={associationRefCodes}
          excludeObjectTypes={[
            ObjectTypeObjects.EVIDENCE,
            ObjectTypeObjects.GROUP,
            ObjectTypeObjects.RISK,
            ObjectTypeObjects.CONTROL_OBJECTIVE,
            ObjectTypeObjects.SCAN,
            ObjectTypeObjects.CAMPAIGN,
            ObjectTypeObjects.ASSET,
            ObjectTypeObjects.ENTITY,
            ObjectTypeObjects.IDENTITY_HOLDER,
          ]}
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
