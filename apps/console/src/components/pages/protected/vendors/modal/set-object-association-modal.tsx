'use client'

import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useMemo, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type UpdateEntityInput } from '@repo/codegen/src/schema'
import { useNotification } from '@/hooks/useNotification'
import { useGetEntityAssociations, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn'
import { getAssociationInput } from '@/components/shared/object-association/utils'
import { useQueryClient } from '@tanstack/react-query'

type TSetObjectAssociationDialogProps = {
  entityId: string
}

const SetObjectAssociationVendorsDialog = ({ entityId }: TSetObjectAssociationDialogProps) => {
  const queryClient = useQueryClient()
  const { successNotification, errorNotification } = useNotification()
  const { data: associationsData } = useGetEntityAssociations(entityId)
  const { mutateAsync: updateEntity, isPending: isSaving } = useUpdateEntity()
  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [open, setOpen] = useState(false)
  const [objectAssociationKey, setObjectAssociationKey] = useState(0)

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData?.entity) return {}
    return {
      assetIDs: (associationsData.entity.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      scanIDs: (associationsData.entity.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (associationsData.entity.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (associationsData.entity.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      controlIDs: (associationsData.entity.controls?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      subcontrolIDs: (associationsData.entity.subcontrols?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      internalPolicyIDs: (associationsData.entity.internalPolicies?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [associationsData])

  const onSave = async () => {
    try {
      const associationInputs = getAssociationInput(initialData, associations) as UpdateEntityInput

      if (Object.keys(associationInputs).length === 0) {
        setOpen(false)
        return
      }

      await updateEntity({
        updateEntityId: entityId,
        input: associationInputs,
      })

      queryClient.invalidateQueries({ queryKey: ['entities'] })

      successNotification({
        title: 'Vendor Updated',
        description: 'Vendor associations have been successfully updated',
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
    if (isOpen) {
      setObjectAssociationKey((prev) => prev + 1)
    }
    if (!isOpen) {
      setAssociations({})
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
          <DialogTitle>Associate Related Objects</DialogTitle>
        </DialogHeader>

        <ObjectAssociation
          key={objectAssociationKey}
          onIdChange={(updatedMap) => setAssociations(updatedMap)}
          initialData={initialData}
          allowedObjectTypes={[
            ObjectTypeObjects.ASSET,
            ObjectTypeObjects.CAMPAIGN,
            ObjectTypeObjects.CONTROL,
            ObjectTypeObjects.SUB_CONTROL,
            ObjectTypeObjects.IDENTITY_HOLDER,
            ObjectTypeObjects.INTERNAL_POLICY,
            ObjectTypeObjects.SCAN,
          ]}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton disabled={isSaving} onClick={() => setOpen(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SetObjectAssociationVendorsDialog
