'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlImplementations } from '@/lib/graphql-hooks/control-implementation'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objective'
import { type ControlImplementationFieldsFragment, type ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import ControlImplementations from '@/components/pages/protected/controls/tabs/implementation/control-implementations'
import ControlObjectives from '@/components/pages/protected/controls/tabs/implementation/control-objectives'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import PublicRepresentationField from '@/components/pages/protected/controls/form-fields/public-representation-field.tsx'
import type { ControlByIdNode } from '@/lib/graphql-hooks/control'
import type { SubcontrolByIdNode } from '@/lib/graphql-hooks/subcontrol'
import { SuggestedObjective, useSuggestedObjective } from '@/components/pages/protected/controls/suggested-objective'
import type { TDocsEvidenceControl } from '@/components/pages/protected/controls/example-evidence-requests'

type ImplementationTabProps = {
  isEditing: boolean
  data?: SubcontrolByIdNode | ControlByIdNode
  canEdit: boolean
  docsControl?: TDocsEvidenceControl
}

const ImplementationTab: React.FC<ImplementationTabProps> = ({ isEditing, data, canEdit, docsControl }) => {
  const { id, subcontrolId } = useParams<{ id: string; subcontrolId?: string }>()

  const { data: implementationsData, isLoading: isImplementationsLoading } = useGetAllControlImplementations({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
  })

  const { data: objectivesData, isLoading: isObjectivesLoading } = useGetAllControlObjectives({
    ...(subcontrolId ? { hasSubcontrolsWith: [{ id: subcontrolId }] } : { hasControlsWith: [{ id }] }),
    statusNEQ: ControlObjectiveObjectiveStatus.ARCHIVED,
  })

  const implementationEdges = implementationsData?.controlImplementations?.edges?.filter((edge): edge is { node: ControlImplementationFieldsFragment } => !!edge?.node)

  const objectiveEdges = objectivesData?.controlObjectives?.edges?.filter((edge): edge is { node: ControlObjectiveFieldsFragment } => !!edge?.node)

  const objectiveSuggestion = useSuggestedObjective(docsControl)
  const hasObjectives = (objectiveEdges?.length ?? 0) > 0
  const showObjectiveSuggestion = !!objectiveSuggestion && !objectiveSuggestion.dismissed

  const isLoading = isImplementationsLoading || isObjectivesLoading

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      {(isEditing || !!data?.publicRepresentation) && <PublicRepresentationField isEditing={isEditing} initialValue={data?.publicRepresentation || ''} isEditAllowed={canEdit} />}
      {(implementationEdges?.length ?? 0) > 0 && <ControlImplementations edges={implementationEdges} />}
      {(hasObjectives || showObjectiveSuggestion) && <ControlObjectives edges={objectiveEdges} emptyState={<SuggestedObjective data={objectiveSuggestion} />} />}
    </div>
  )
}

export default ImplementationTab
