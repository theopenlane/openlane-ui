'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlImplementations } from '@/lib/graphql-hooks/control-implementation'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objective'
import { controlAssociationFilter } from '@/lib/graphql-hooks/control-association'
import { type ControlImplementationFieldsFragment, type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import ControlImplementations from '@/components/pages/protected/controls/tabs/implementation/control-implementations'
import ControlObjectives from '@/components/pages/protected/controls/tabs/implementation/control-objectives'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import PublicRepresentationField from '@/components/pages/protected/controls/form-fields/public-representation-field.tsx'
import type { ControlByIdNode } from '@/lib/graphql-hooks/control'
import type { SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import type { TDocsEvidenceControl } from '@/components/pages/protected/controls/example-evidence-requests'

type ImplementationTabProps = {
  isEditing: boolean
  data?: SubcontrolByIdNode | ControlByIdNode
  canEdit: boolean
  docsControl?: TDocsEvidenceControl
}

const ImplementationTab: React.FC<ImplementationTabProps> = ({ isEditing, data, canEdit }) => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()

  const { data: implementationsData, isLoading: isImplementationsLoading } = useGetAllControlImplementations({
    ...controlAssociationFilter(id, subcontrolId),
  })

  const { data: objectivesData, isLoading: isObjectivesLoading } = useGetAllControlObjectives({
    ...controlAssociationFilter(id, subcontrolId),
    statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED,
  })

  const implementationEdges = implementationsData?.controlImplementations?.edges?.filter((edge): edge is { node: ControlImplementationFieldsFragment } => !!edge?.node)

  const objectiveEdges = objectivesData?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  const hasObjectives = (objectiveEdges?.length ?? 0) > 0

  const isLoading = isImplementationsLoading || isObjectivesLoading

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      {(isEditing || !!data?.publicRepresentation) && <PublicRepresentationField isEditing={isEditing} initialValue={data?.publicRepresentation || ''} isEditAllowed={canEdit} />}
      {(implementationEdges?.length ?? 0) > 0 && <ControlImplementations edges={implementationEdges} />}
      {hasObjectives && <ControlObjectives edges={objectiveEdges} />}
    </div>
  )
}

export default ImplementationTab

// Whether the tab has anything to show, so the parent can hide it entirely
export const useHasImplementationData = ({ publicRepresentation }: { publicRepresentation?: string | null }) => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()
  const association = controlAssociationFilter(id, subcontrolId)

  const { data: implementationsData, isLoading: isImplementationsLoading } = useGetAllControlImplementations(association)
  const { data: objectivesData, isLoading: isObjectivesLoading } = useGetAllControlObjectives({ ...association, statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED })

  return {
    hasData: Boolean(publicRepresentation || implementationsData?.controlImplementations?.edges?.length || objectivesData?.controlObjectives?.edges?.length),
    isLoading: isImplementationsLoading || isObjectivesLoading,
  }
}
