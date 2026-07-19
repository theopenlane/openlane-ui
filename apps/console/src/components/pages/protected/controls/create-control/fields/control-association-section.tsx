import { useCallback } from 'react'
import { useGetControlAssociationsById, useUpdateControl } from '@/lib/graphql-hooks/control'
import type { UpdateControlInput } from '@repo/codegen/src/schema'
import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { CONTROL_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { asAssociationsData } from '@/components/shared/object-association/utils'
import { useUpdateControlWithFindingLinks } from '@/components/shared/object-association/finding-control-links'

export const ControlAssociationSection = (props: BaseAssociationSectionProps) => {
  const controlId = props.data?.id
  const { data: associationsData } = useGetControlAssociationsById(controlId)
  const { mutateAsync: updateControl } = useUpdateControl()

  const updateControlEntity = useCallback(async (input: object) => updateControl({ updateControlId: controlId as string, input: input as UpdateControlInput }), [updateControl, controlId])

  const handleUpdateControl = useUpdateControlWithFindingLinks({
    controlID: controlId,
    mappingConnection: associationsData?.control?.controlMappings,
    updateControl: updateControlEntity,
  })

  return <AssociationSection {...props} config={CONTROL_ASSOCIATION_CONFIG} associationsData={asAssociationsData(associationsData)} onUpdateEntity={handleUpdateControl} />
}
