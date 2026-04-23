'use client'

import { useCallback, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import type { UpdateControlInput, UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { SetAssociationDialog } from '@/components/shared/object-association/set-association-dialog'
import { type AssociationsData } from '@/components/shared/object-association/association-section'
import { CONTROL_ASSOCIATION_CONFIG, SUBCONTROL_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { type ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { useGetControlAssociationsById, useUpdateControl } from '@/lib/graphql-hooks/control'
import { useGetSubcontrolAssociationsById, useUpdateSubcontrol } from '@/lib/graphql-hooks/subcontrol'

type SetControlAssociationDialogProps = {
  controlId?: string
  subcontrolId?: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
}

const ControlAssociationDialog = ({
  controlId,
  trigger,
  defaultSelectedObject,
  allowedObjectTypes,
}: {
  controlId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
}) => {
  const { data } = useGetControlAssociationsById(controlId)
  const { mutateAsync: updateControl } = useUpdateControl()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateControlInput>) => {
      await updateControl({ updateControlId: controlId, input })
    },
    [updateControl, controlId],
  )

  return (
    <SetAssociationDialog
      config={CONTROL_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={data as AssociationsData | undefined}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
    />
  )
}

const SubcontrolAssociationDialog = ({
  subcontrolId,
  trigger,
  defaultSelectedObject,
  allowedObjectTypes,
}: {
  subcontrolId: string
  trigger?: ReactNode
  defaultSelectedObject?: ObjectTypeObjects
  allowedObjectTypes?: readonly ObjectTypeObjects[]
}) => {
  const { data } = useGetSubcontrolAssociationsById(subcontrolId)
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()

  const handleUpdate = useCallback(
    async (input: Partial<UpdateSubcontrolInput>) => {
      await updateSubcontrol({ updateSubcontrolId: subcontrolId, input })
    },
    [updateSubcontrol, subcontrolId],
  )

  return (
    <SetAssociationDialog
      config={SUBCONTROL_ASSOCIATION_CONFIG.dialogConfig}
      associationsData={data as AssociationsData | undefined}
      onUpdate={handleUpdate}
      trigger={trigger}
      defaultSelectedObject={defaultSelectedObject}
      allowedObjectTypes={allowedObjectTypes}
    />
  )
}

export const SetControlAssociationDialog = ({ controlId, subcontrolId, trigger, defaultSelectedObject, allowedObjectTypes }: SetControlAssociationDialogProps) => {
  const params = useParams<{ id?: string; subcontrolId?: string }>()
  const resolvedSubcontrolId = subcontrolId ?? params?.subcontrolId
  const resolvedControlId = controlId ?? params?.id

  if (resolvedSubcontrolId) {
    return <SubcontrolAssociationDialog subcontrolId={resolvedSubcontrolId} trigger={trigger} defaultSelectedObject={defaultSelectedObject} allowedObjectTypes={allowedObjectTypes} />
  }

  if (resolvedControlId) {
    return <ControlAssociationDialog controlId={resolvedControlId} trigger={trigger} defaultSelectedObject={defaultSelectedObject} allowedObjectTypes={allowedObjectTypes} />
  }

  return null
}
