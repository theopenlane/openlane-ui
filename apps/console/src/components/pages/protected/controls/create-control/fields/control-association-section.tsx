import { useCallback } from 'react'
import { useGetControlAssociationsById, useUpdateControl } from '@/lib/graphql-hooks/control'
import type { UpdateControlInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps, type AssociationsData } from '@/components/shared/object-association/association-section'
import { CONTROL_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'

export const ControlAssociationSection = (props: BaseAssociationSectionProps) => {
  const controlId = props.data?.id
  const { data: associationsData } = useGetControlAssociationsById(controlId)
  const { mutateAsync: updateControl } = useUpdateControl()

  const handleUpdateControl = useCallback(
    async (input: Partial<UpdateControlInput>) => {
      if (!controlId) return
      await updateControl({ updateControlId: controlId, input })
    },
    [updateControl, controlId],
  )

  return <AssociationSection {...props} config={CONTROL_ASSOCIATION_CONFIG} associationsData={associationsData as AssociationsData | undefined} onUpdateEntity={handleUpdateControl} />
}
