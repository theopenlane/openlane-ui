'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlImplementations } from '@/lib/graphql-hooks/control-implementations'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objectives'
import { ControlImplementationFieldsFragment, ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import ControlImplementations from '@/components/pages/protected/controls/tabs/implementation/control-implementations'
import ControlObjectives from '@/components/pages/protected/controls/tabs/implementation/control-objectives'
import { TableSkeleton } from '@/components/shared/skeleton/table-skeleton'
import EmptyTabState from '@/components/pages/protected/controls/tabs/shared/empty-tab-state'

const ImplementationTab: React.FC = () => {
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
  const hasData = Boolean(implementationEdges?.length || objectiveEdges?.length)

  if (isLoading) {
    return <TableSkeleton />
  }

  if (!hasData) {
    return <EmptyTabState description="To begin documenting how this control is met, add an implementation or objective. Once created, they’ll appear here." />
  }

  return (
    <div className="space-y-6">
      <ControlImplementations edges={implementationEdges} />
      <ControlObjectives edges={objectiveEdges} />
    </div>
  )
}

export default ImplementationTab
