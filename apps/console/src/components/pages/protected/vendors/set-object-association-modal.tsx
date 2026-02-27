'use client'

import { useGetEntityAssociations, useUpdateEntity } from '@/lib/graphql-hooks/entity'
import ObjectAssociation from '@/components/shared/object-association/object-association'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import React, { useMemo, useState } from 'react'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import { SaveButton } from '@/components/shared/save-button/save-button'
import { CancelButton } from '@/components/shared/cancel-button.tsx/cancel-button'
import { useQueryClient } from '@tanstack/react-query'
import AddAssociationPlusBtn from '@/components/shared/object-association/add-association-plus-btn.tsx'
import { getAssociationInput } from '@/components/shared/object-association/utils'

type SetEntityAssociationDialogProps = {
  entityId: string
}

export function SetEntityAssociationDialog({ entityId }: SetEntityAssociationDialogProps) {
  const queryClient = useQueryClient()
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [objectAssociationKey, setObjectAssociationKey] = useState(0)

  const { errorNotification, successNotification } = useNotification()
  const { data: associationsData } = useGetEntityAssociations(entityId)

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData?.entity) return {}
    return {
      assetIDs: (associationsData.entity.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      scanIDs: (associationsData.entity.scans?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (associationsData.entity.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      identityHolderIDs: (associationsData.entity.identityHolders?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [associationsData])

  const onSave = async () => {
    setIsSaving(true)
    try {
      const associationInputs = getAssociationInput(initialData, associations)

      await updateEntity({
        updateEntityId: entityId,
        input: associationInputs,
      })

      queryClient.invalidateQueries({ queryKey: ['entities'] })
      successNotification({ title: 'Vendor updated' })
      setOpen(false)
    } catch (error) {
      errorNotification({ title: 'Error', description: parseErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDialogChange = (isOpen: boolean) => {
    if (isOpen) {
      setObjectAssociationKey((prev) => prev + 1)
      setAssociations(initialData)
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
          allowedObjectTypes={[ObjectTypeObjects.ASSET, ObjectTypeObjects.SCAN, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.IDENTITY_HOLDER]}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton onClick={() => setOpen(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
