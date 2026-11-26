import { type ReactNode } from 'react'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { CONTROL_IMPLEMENTATION_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { type TAssociationUpdateInput } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { asAssociationsData } from '@/components/shared/object-association/utils'
import { useControlImplementationAssociations, useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'

type TAssociationKey = (typeof CONTROL_IMPLEMENTATION_ASSOCIATION_CONFIG)['associationKeys'][number]

type TSetControlImplementationAssociationDialogProps = {
  controlImplementationId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SetControlImplementationAssociationDialog = ({ controlImplementationId, ...dialogProps }: TSetControlImplementationAssociationDialogProps) => {
  const { data: associationsData } = useControlImplementationAssociations(controlImplementationId)
  const { mutateAsync: updateImplementation } = useUpdateControlImplementation()

  const handleUpdate = async (input: TAssociationUpdateInput<TAssociationKey>) => {
    await updateImplementation({ updateControlImplementationId: controlImplementationId, input })
  }

  return <SetAssociationDialog config={CONTROL_IMPLEMENTATION_ASSOCIATION_CONFIG.dialogConfig} associationsData={asAssociationsData(associationsData)} onUpdate={handleUpdate} {...dialogProps} />
}
