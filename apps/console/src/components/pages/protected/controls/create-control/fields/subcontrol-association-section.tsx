import { useCallback } from 'react'
import { useGetSubcontrolAssociationsById, useUpdateSubcontrol } from '@/lib/graphql-hooks/subcontrol'
import type { UpdateSubcontrolInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps, type AssociationsData } from '@/components/shared/object-association/association-section'
import { SUBCONTROL_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const SubcontrolAssociationSection = (props: BaseAssociationSectionProps) => {
  const subcontrolId = props.data?.id
  const { data: associationsData } = useGetSubcontrolAssociationsById(subcontrolId)
  const { mutateAsync: updateSubcontrol } = useUpdateSubcontrol()

  const handleUpdateSubcontrol = useCallback(
    async (input: Partial<UpdateSubcontrolInput>) => {
      if (!subcontrolId) return
      await updateSubcontrol({ updateSubcontrolId: subcontrolId, input })
    },
    [updateSubcontrol, subcontrolId],
  )

  return <AssociationSection {...props} config={SUBCONTROL_ASSOCIATION_CONFIG} associationsData={associationsData as AssociationsData | undefined} onUpdateEntity={handleUpdateSubcontrol} />
}
