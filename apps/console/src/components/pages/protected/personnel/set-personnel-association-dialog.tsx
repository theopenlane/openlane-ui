'use client'

import { useCallback, type ReactNode } from 'react'
import type { UpdateIdentityHolderInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { IDENTITY_HOLDER_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useGetIdentityHolderAssociations, useUpdateIdentityHolder } from '@/lib/graphql-hooks/identity-holder'

type SetPersonnelAssociationDialogProps = {
  identityHolderId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
}

export const SetPersonnelAssociationDialog = ({ identityHolderId, trigger, defaultSelectedObject, allowedObjectTypes }: SetPersonnelAssociationDialogProps) => {
  const { data } = useGetIdentityHolderAssociations(identityHolderId)
  const { mutateAsync: updateIdentityHolder } = useUpdateIdentityHolder()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateIdentityHolderInput>) => {
      await updateIdentityHolder({ updateIdentityHolderId: identityHolderId, input })
    },
    [updateIdentityHolder, identityHolderId],
  )

  return (
    <SetAssociationDialog
      config={IDENTITY_HOLDER_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={data}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
    />
  )
}
