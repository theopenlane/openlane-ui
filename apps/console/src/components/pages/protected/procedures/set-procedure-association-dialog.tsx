import { useCallback, type ReactNode } from 'react'
import type { UpdateProcedureInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { PROCEDURE_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useGetProcedureAssociationsById, useUpdateProcedure } from '@/lib/graphql-hooks/procedure'

type SetProcedureAssociationDialogProps = {
  procedureId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SetProcedureAssociationDialog = ({ procedureId, trigger, defaultSelectedObject, allowedObjectTypes, open, onOpenChange }: SetProcedureAssociationDialogProps) => {
  const { data } = useGetProcedureAssociationsById(procedureId)
  const { mutateAsync: updateProcedure } = useUpdateProcedure()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateProcedureInput>) => {
      await updateProcedure({ updateProcedureId: procedureId, input })
    },
    [updateProcedure, procedureId],
  )

  return (
    <SetAssociationDialog
      config={PROCEDURE_ASSOCIATION_CONFIG.dialogConfig}
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
