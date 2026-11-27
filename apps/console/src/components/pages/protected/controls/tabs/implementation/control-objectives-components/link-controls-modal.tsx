'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { ObjectTypeObjects } from '@/components/shared/object-association/object-association-config'
import { AssociateObjectsDialog } from '@/components/shared/object-association/picker/associate-objects-dialog'
import { type TAssociationUpdateInput } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { getEdgeIds } from '@/components/shared/object-association/utils'
import { useUpdateControlObjective } from '@/lib/graphql-hooks/control-objective'
import { getObjectDisplayName } from '@/utils/object-display-name'

const ALLOWED_OBJECT_TYPES = [
  ObjectTypeObjects.PROGRAM,
  ObjectTypeObjects.EVIDENCE,
  ObjectTypeObjects.CONTROL,
  ObjectTypeObjects.SUB_CONTROL,
  ObjectTypeObjects.INTERNAL_POLICY,
  ObjectTypeObjects.PROCEDURE,
  ObjectTypeObjects.RISK,
  ObjectTypeObjects.TASK,
]

type TLinkControlsModalProps = {
  controlObjectiveData: ControlObjectiveFieldsFragment
  'aria-label'?: string
}

export const LinkControlsModal = ({ controlObjectiveData, 'aria-label': ariaLabel }: TLinkControlsModalProps) => {
  const { subcontrolId } = useParams<{ subcontrolId?: string }>()
  const [open, setOpen] = useState(false)
  const { mutateAsync: updateControlObjective } = useUpdateControlObjective()

  const initialData = useMemo(
    () => ({
      controlIDs: getEdgeIds(controlObjectiveData.controls?.edges),
      subcontrolIDs: getEdgeIds(controlObjectiveData.subcontrols?.edges),
      programIDs: getEdgeIds(controlObjectiveData.programs?.edges),
      evidenceIDs: getEdgeIds(controlObjectiveData.evidence?.edges),
      internalPolicyIDs: getEdgeIds(controlObjectiveData.internalPolicies?.edges),
      procedureIDs: getEdgeIds(controlObjectiveData.procedures?.edges),
      riskIDs: getEdgeIds(controlObjectiveData.risks?.edges),
      taskIDs: getEdgeIds(controlObjectiveData.tasks?.edges),
    }),
    [controlObjectiveData],
  )

  const handleSave = async (input: TAssociationUpdateInput<keyof typeof initialData>) => {
    await updateControlObjective({ updateControlObjectiveId: controlObjectiveData.id, input })
  }

  return (
    <AssociateObjectsDialog
      sourceType={ObjectTypeObjects.CONTROL_OBJECTIVE}
      sourceName={getObjectDisplayName(controlObjectiveData)}
      initialData={initialData}
      allowedObjectTypes={ALLOWED_OBJECT_TYPES}
      defaultSelectedObject={subcontrolId ? ObjectTypeObjects.SUB_CONTROL : ObjectTypeObjects.CONTROL}
      successMessage="Control Objective updated"
      onSave={handleSave}
      trigger={
        <Button disabled={controlObjectiveData.status === ControlObjectiveObjectiveStatus.ARCHIVED} className="h-8" aria-label={ariaLabel}>
          Set Associations
        </Button>
      }
      open={open}
      onOpenChange={setOpen}
    />
  )
}
