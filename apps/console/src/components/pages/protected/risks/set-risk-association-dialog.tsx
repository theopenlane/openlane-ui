import { useCallback, type ReactNode } from 'react'
import type { UpdateRiskInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { RISK_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useGetRiskAssociations, useUpdateRisk } from '@/lib/graphql-hooks/risk'
import { asAssociationsData } from '@/components/shared/object-association/utils'

type SetRiskAssociationDialogProps = {
  riskId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SetRiskAssociationDialog = ({ riskId, trigger, defaultSelectedObject, allowedObjectTypes, open, onOpenChange }: SetRiskAssociationDialogProps) => {
  const { data } = useGetRiskAssociations(riskId)
  const { mutateAsync: updateRisk } = useUpdateRisk()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateRiskInput>) => {
      await updateRisk({ updateRiskId: riskId, input })
    },
    [updateRisk, riskId],
  )

  return (
    <SetAssociationDialog
      config={RISK_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={asAssociationsData(data)}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
