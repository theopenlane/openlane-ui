'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useCallback, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { UpdateInternalPolicyInput } from '@repo/codegen/src/schema.ts'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'
import { useNotification } from '@/hooks/useNotification.tsx'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { getAssociationInput } from '@/components/shared/object-association/utils'

type TSetObjectAssociationDialogProps = {
  policyId?: string
  fromTable?: boolean
  onClose?: () => void
  associations?: TObjectAssociationMap
  initialAssociations?: TObjectAssociationMap
  associationRefCodes?: TObjectAssociationMap
  onAssociationsChange?: (newAssociations: TObjectAssociationMap, newRefCodes: TObjectAssociationMap) => void
}

const EMPTY_ASSOCIATIONS = {} as TObjectAssociationMap

const SetObjectAssociationPoliciesDialog = ({
  policyId,
  fromTable = false,
  onClose,
  associations: parentAssociations,
  initialAssociations,
  associationRefCodes,
  onAssociationsChange,
}: TSetObjectAssociationDialogProps) => {
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
  const [open, setOpen] = useState(!!policyId && !!fromTable)
  const { mutateAsync: updatePolicy, isPending: isSaving } = useUpdateInternalPolicy()

  const excludeObjectTypes = fromTable
    ? Object.values(ObjectTypeObjects).filter((type) => type !== ObjectTypeObjects.PROCEDURE)
    : [
        ObjectTypeObjects.EVIDENCE,
        ObjectTypeObjects.GROUP,
        ObjectTypeObjects.RISK,
        ObjectTypeObjects.INTERNAL_POLICY,
        ObjectTypeObjects.SCAN,
        ObjectTypeObjects.CAMPAIGN,
        ObjectTypeObjects.ASSET,
        ObjectTypeObjects.ENTITY,
        ObjectTypeObjects.IDENTITY_HOLDER,
      ]

  const handleSave = () => {
    onAssociationsChange?.(localAssociations.associations, localAssociations.refCodes)
    if (policyId) {
      onSubmitHandler(localAssociations.associations)
    } else {
      setOpen(false)
    }
  }

  const onSubmitHandler = async (newAssociations: TObjectAssociationMap) => {
    try {
      const associationInputs = getAssociationInput(normalizedInitialAssociations, newAssociations)

      const formData: {
        updateInternalPolicyId: string
        input: UpdateInternalPolicyInput
      } = {
        updateInternalPolicyId: policyId!,
        input: {
          ...associationInputs,
        },
      }

      await updatePolicy(formData)

      successNotification({
        title: 'Policy Updated',
        description: 'Policy has been successfully updated',
      })

      queryClient.invalidateQueries({ queryKey: ['internalPolicies'] })
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
      onClose?.()
    }
    setOpen(isOpen)
  }

  const handleIdChange = useCallback((updatedMap: TObjectAssociationMap, refCodes: TObjectAssociationMap) => {
    setLocalAssociations({ associations: updatedMap, refCodes })
  }, [])

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
          initialData={normalizedAssociations}
          refCodeInitialData={normalizedAssociationRefCodes}
          excludeObjectTypes={excludeObjectTypes}
          defaultSelectedObject={fromTable ? ObjectTypeObjects.PROCEDURE : undefined}
        />
        <DialogFooter>
          <SaveButton onClick={handleSave} isSaving={isSaving} />
          <CancelButton disabled={isSaving} onClick={() => setOpen(false)}></CancelButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationPoliciesDialog
