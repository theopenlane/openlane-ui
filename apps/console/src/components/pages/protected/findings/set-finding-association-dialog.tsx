import { type ReactNode } from 'react'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { asAssociationsData } from '@/components/shared/object-association/utils'
import { useFindingAssociationUpdate } from './hooks/use-finding-association-update'

type TSetFindingAssociationDialogProps = {
  findingId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SetFindingAssociationDialog = ({ findingId, trigger, defaultSelectedObject, allowedObjectTypes, open, onOpenChange }: TSetFindingAssociationDialogProps) => {
  const { associationsData, applyUpdate } = useFindingAssociationUpdate(findingId)

  return (
    <SetAssociationDialog
      config={FINDING_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={asAssociationsData(associationsData)}
      onUpdate={applyUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
      open={open}
      onOpenChange={onOpenChange}
    />
  )
}
