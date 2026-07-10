import { useCallback, type ReactNode } from 'react'
import type { UpdateInternalPolicyInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { POLICY_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useGetInternalPolicyAssociationsById, useUpdateInternalPolicy } from '@/lib/graphql-hooks/internal-policy'

type SetPolicyAssociationDialogProps = {
  policyId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SetPolicyAssociationDialog = ({ policyId, trigger, defaultSelectedObject, allowedObjectTypes, open, onOpenChange }: SetPolicyAssociationDialogProps) => {
  const { data } = useGetInternalPolicyAssociationsById(policyId)
  const { mutateAsync: updateInternalPolicy } = useUpdateInternalPolicy()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateInternalPolicyInput>) => {
      await updateInternalPolicy({ updateInternalPolicyId: policyId, input })
    },
    [updateInternalPolicy, policyId],
  )

  return (
    <SetAssociationDialog
      config={POLICY_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={data}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
