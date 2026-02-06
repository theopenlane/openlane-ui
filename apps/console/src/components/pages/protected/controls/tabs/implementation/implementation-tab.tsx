'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useGetAllControlImplementations } from '@/lib/graphql-hooks/control-implementations'
import { useGetAllControlObjectives } from '@/lib/graphql-hooks/control-objectives'
import { ControlImplementationFieldsFragment, ControlObjectiveFieldsFragment, ControlObjectiveObjectiveStatus } from '@repo/codegen/src/schema'
import { Loading } from '@/components/shared/loading/loading'
import { FileCheck } from 'lucide-react'
import ControlImplementations from '@/components/pages/protected/controls/tabs/implementation/control-implementations'
import ControlObjectives from '@/components/pages/protected/controls/tabs/implementation/control-objectives'

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
    return <Loading />
  }

  if (!hasData) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 text-center">
        <div className="max-w-[520px] space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center text-muted-foreground">
            <FileCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">It looks like there are no items to display</p>
          <p className="text-sm text-muted-foreground">To begin tracking requests, activate approval workflows in the settings. After activation, all pending approvals will be listed here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      <ControlImplementations edges={implementationEdges} />
      <ControlObjectives edges={objectiveEdges} />
    </div>
  )
}

export default ImplementationTab
