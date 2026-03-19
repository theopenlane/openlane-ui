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

type ImplementationTabProps = {
  isEditing: boolean
  data?: SubcontrolByIdNode | ControlByIdNode
  canEdit: boolean
}

const ImplementationTab: React.FC<ImplementationTabProps> = ({ isEditing, data, canEdit }) => {
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

  const isLoading = isImplementationsLoading || isObjectivesLoading

  if (isLoading) {
    return <TableSkeleton />
  }

  return (
    <div className="space-y-6">
      <PublicRepresentationField isEditing={isEditing} initialValue={data?.publicRepresentation || ''} isEditAllowed={canEdit} />
      <ControlImplementations edges={implementationEdges} />
      <ControlObjectives edges={objectiveEdges} />
    </div>
  )
}

export default ImplementationTab
