'use client'

import { AssociationSection, type BaseAssociationSectionProps } from '@/components/shared/object-association/association-section'
import { FINDING_ASSOCIATION_CONFIG } from '@/components/shared/object-association/association-configs'
import { asAssociationsData } from '@/components/shared/object-association/utils'
import { useFindingAssociationUpdate } from '../../../hooks/use-finding-association-update'

export const FindingAssociationSection = (props: BaseAssociationSectionProps) => {
  const { associationsData, applyUpdate } = useFindingAssociationUpdate(props.data?.id)

  return <AssociationSection {...props} config={FINDING_ASSOCIATION_CONFIG} associationsData={asAssociationsData(associationsData)} onUpdateEntity={applyUpdate} />
}
