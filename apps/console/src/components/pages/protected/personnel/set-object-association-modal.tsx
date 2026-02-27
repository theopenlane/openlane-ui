'use client'

import { useGetIdentityHolderAssociations, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'
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

type SetIdentityHolderAssociationDialogProps = {
  identityHolderId: string
}

export function SetIdentityHolderAssociationDialog({ identityHolderId }: SetIdentityHolderAssociationDialogProps) {
  const queryClient = useQueryClient()
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const [associations, setAssociations] = useState<TObjectAssociationMap>({})
  const [isSaving, setIsSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [objectAssociationKey, setObjectAssociationKey] = useState(0)

  const { errorNotification, successNotification } = useNotification()
  const { data: associationsData } = useGetIdentityHolderAssociations(identityHolderId)

  const initialData: TObjectAssociationMap = useMemo(() => {
    if (!associationsData?.identityHolder) return {}
    return {
      assetIDs: (associationsData.identityHolder.assets?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      entityIDs: (associationsData.identityHolder.entities?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      campaignIDs: (associationsData.identityHolder.campaigns?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
      taskIDs: (associationsData.identityHolder.tasks?.edges?.map((e) => e?.node?.id).filter(Boolean) as string[]) ?? [],
    }
  }, [associationsData])

  const onSave = async () => {
    setIsSaving(true)
    try {
      const associationInputs = getAssociationInput(initialData, associations)

      await updateIdentityHolder({
        updateIdentityHolderId: identityHolderId,
        input: associationInputs,
      })

      queryClient.invalidateQueries({ queryKey: ['identityHolders'] })
      successNotification({ title: 'Personnel updated' })
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
          allowedObjectTypes={[ObjectTypeObjects.ASSET, ObjectTypeObjects.ENTITY, ObjectTypeObjects.CAMPAIGN, ObjectTypeObjects.TASK]}
        />
        <DialogFooter>
          <SaveButton onClick={onSave} isSaving={isSaving} />
          <CancelButton onClick={() => setOpen(false)} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
