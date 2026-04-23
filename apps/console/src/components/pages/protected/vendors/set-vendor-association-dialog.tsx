'use client'

import { useCallback, type ReactNode } from 'react'
import type { UpdateEntityInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { type AssociationsData } from '@/components/shared/object-association/association-section'
import { ENTITY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useGetEntityAssociations, useUpdateEntity } from '@/lib/graphql-hooks/entity'

type SetVendorAssociationDialogProps = {
  entityId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
}

export const SetVendorAssociationDialog = ({ entityId, trigger, defaultSelectedObject, allowedObjectTypes }: SetVendorAssociationDialogProps) => {
  const { data } = useGetEntityAssociations(entityId)
  const { mutateAsync: updateEntity } = useUpdateEntity()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateEntityInput>) => {
      await updateEntity({ updateEntityId: entityId, input })
    },
    [updateEntity, entityId],
  )

  return (
    <SetAssociationDialog
      config={ENTITY_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={data as AssociationsData | undefined}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
    />
  )
}
