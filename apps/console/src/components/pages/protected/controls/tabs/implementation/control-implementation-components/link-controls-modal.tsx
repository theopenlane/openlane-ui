'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { type ControlImplementationFieldsFragment } from '@repo/codegen/src/schema'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { AssociateObjectsDialog } from '@/components/shared/object-association/picker/associate-objects-dialog'
import { type TAssociationUpdateInput } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { getEdgeIds, getEdgeNodes } from '@/components/shared/object-association/utils'
import { getObjectDisplayName } from '@/utils/object-display-name'
import { useControllableOpen } from '@/hooks/useControllableOpen'
import { useUpdateControlImplementation } from '@/lib/graphql-hooks/control-implementation'

const ALLOWED_OBJECT_TYPES = [ObjectTypeObjects.CONTROL, ObjectTypeObjects.SUB_CONTROL]

type TLinkControlsModalProps = {
  controlImplementation: ControlImplementationFieldsFragment
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const LinkControlsModal = ({ controlImplementation, open: controlledOpen, onOpenChange }: TLinkControlsModalProps) => {
  const { subcontrolId } = useParams<{ id: string; subcontrolId: string }>()
  const [open, setOpen, isControlled] = useControllableOpen({ open: controlledOpen, onOpenChange })
  const { mutateAsync: update } = useUpdateControlImplementation()

  const initialData = useMemo(
    () => ({
      controlIDs: getEdgeIds(controlImplementation.controls?.edges),
      subcontrolIDs: getEdgeIds(controlImplementation.subcontrols?.edges),
    }),
    [controlImplementation],
  )

  const handleSave = async (input: TAssociationUpdateInput<keyof typeof initialData>) => {
    await update({ updateControlImplementationId: controlImplementation.id, input })
  }

  return (
    <AssociateObjectsDialog
      sourceType={ObjectTypeObjects.CONTROL_IMPLEMENTATION}
      sourceName={getObjectDisplayName(getEdgeNodes(controlImplementation.controls?.edges)[0])}
      initialData={initialData}
      allowedObjectTypes={ALLOWED_OBJECT_TYPES}
      defaultSelectedObject={subcontrolId ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
      successMessage="Associations updated successfully."
      onSave={handleSave}
      trigger={isControlled ? undefined : <Button className="h-8 px-2!">Set Association</Button>}
      open={open}
      onOpenChange={setOpen}
    />
  )
}
